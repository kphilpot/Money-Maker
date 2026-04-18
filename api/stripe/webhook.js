import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET
const supabaseUrl = process.env.SUPABASE_URL || 'https://sppetblailyeblxgpqss.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Use service role key for webhooks (write access needed)
const supabase = createClient(supabaseUrl, supabaseServiceKey || '')
const stripe = new Stripe(stripeSecretKey || '')

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Verify webhook signature
  const signature = req.headers['stripe-signature']
  let event

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      stripeWebhookSecret || ''
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).json({ error: 'Invalid signature' })
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionEvent(event.data.object)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionCancelled(event.data.object)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return res.status(200).json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function handleSubscriptionEvent(subscription) {
  try {
    const customerId = subscription.customer
    const priceId = subscription.items?.data?.[0]?.price?.id
    const status = subscription.status

    // Map Stripe price ID to tier
    const tier = priceIdToTier(priceId)
    if (!tier) {
      console.warn(`Unknown price ID: ${priceId}`)
      return
    }

    // Find user by Stripe customer ID
    const { data: users, error: findError } = await supabase
      .from('users')
      .select('id')
      .eq('stripe_id', customerId)
      .single()

    if (findError || !users) {
      console.error('User not found for customer ID:', customerId)
      return
    }

    // Update subscription status
    const subscriptionStatus = status === 'active' ? 'active' : 'cancelled'

    const { error: updateError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: users.id,
        tier: tier,
        status: subscriptionStatus,
        stripe_subscription_id: subscription.id,
        next_billing_date: new Date(subscription.current_period_end * 1000).toISOString()
      }, {
        onConflict: 'stripe_subscription_id'
      })

    if (updateError) {
      console.error('Error updating subscription:', updateError)
      return
    }

    // Update user tier
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({
        tier: tier,
        subscription_status: subscriptionStatus
      })
      .eq('id', users.id)

    if (userUpdateError) {
      console.error('Error updating user tier:', userUpdateError)
    }
  } catch (error) {
    console.error('Error handling subscription event:', error)
  }
}

async function handlePaymentSucceeded(invoice) {
  try {
    const customerId = invoice.customer
    const subscriptionId = invoice.subscription

    // Find user and update subscription to active
    const { data: users, error: findError } = await supabase
      .from('users')
      .select('id')
      .eq('stripe_id', customerId)
      .single()

    if (findError || !users) {
      console.error('User not found for customer ID:', customerId)
      return
    }

    // Get subscription details to determine tier
    const sub = await stripe.subscriptions.retrieve(subscriptionId)
    const priceId = sub.items?.data?.[0]?.price?.id
    const tier = priceIdToTier(priceId)

    if (!tier) {
      console.warn(`Unknown price ID in payment: ${priceId}`)
      return
    }

    // Update user tier to active
    const { error: updateError } = await supabase
      .from('users')
      .update({
        tier: tier,
        subscription_status: 'active'
      })
      .eq('id', users.id)

    if (updateError) {
      console.error('Error updating user after payment:', updateError)
    }
  } catch (error) {
    console.error('Error handling payment succeeded:', error)
  }
}

async function handleSubscriptionCancelled(subscription) {
  try {
    const customerId = subscription.customer

    // Find user and revert to free tier
    const { data: users, error: findError } = await supabase
      .from('users')
      .select('id')
      .eq('stripe_id', customerId)
      .single()

    if (findError || !users) {
      console.error('User not found for customer ID:', customerId)
      return
    }

    // Revert to free tier
    const { error: updateError } = await supabase
      .from('users')
      .update({
        tier: 'free',
        subscription_status: 'cancelled'
      })
      .eq('id', users.id)

    if (updateError) {
      console.error('Error reverting to free tier:', updateError)
    }
  } catch (error) {
    console.error('Error handling subscription cancellation:', error)
  }
}

// Helper function to map Stripe price ID to tier
function priceIdToTier(priceId) {
  // Environment variable format: STRIPE_PRICE_PRO=price_XXX STRIPE_PRICE_MAX=price_YYY
  const proPriceId = process.env.STRIPE_PRICE_PRO
  const maxPriceId = process.env.STRIPE_PRICE_MAX

  if (priceId === proPriceId) return 'pro'
  if (priceId === maxPriceId) return 'max'

  return null
}
