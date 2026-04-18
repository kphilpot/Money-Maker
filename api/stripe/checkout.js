import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const supabaseUrl = process.env.SUPABASE_URL || 'https://sppetblailyeblxgpqss.supabase.co'
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwcGV0YmxhaWx5ZWJseGdwcXNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NDY3NzUsImV4cCI6MjA5MjAyMjc3NX0.TsD_HtFj0uoO4t22sR3CGEoHOdbYGI5FnnYvV-fEjeU'

const supabase = createClient(supabaseUrl, supabaseAnonKey)
const stripe = new Stripe(stripeSecretKey || '')

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { tier } = req.body
  const authHeader = req.headers.authorization
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token' })
  }

  if (!tier || !['pro', 'max'].includes(tier)) {
    return res.status(400).json({ error: 'Invalid tier. Must be "pro" or "max"' })
  }

  try {
    // Verify user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    // Get or create Stripe customer
    let stripeCustomerId
    const { data: userData, error: userLookupError } = await supabase
      .from('users')
      .select('stripe_id')
      .eq('id', user.id)
      .single()

    if (userData?.stripe_id) {
      stripeCustomerId = userData.stripe_id
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id
        }
      })
      stripeCustomerId = customer.id

      // Save Stripe customer ID
      await supabase
        .from('users')
        .update({ stripe_id: stripeCustomerId })
        .eq('id', user.id)
    }

    // Get price ID for tier
    const priceId = tier === 'pro'
      ? process.env.STRIPE_PRICE_PRO
      : process.env.STRIPE_PRICE_MAX

    if (!priceId) {
      return res.status(500).json({ error: `Price not configured for tier: ${tier}` })
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${getBaseUrl()}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getBaseUrl()}/upgrade`,
      metadata: {
        user_id: user.id,
        tier: tier
      }
    })

    return res.status(200).json({
      success: true,
      checkout_url: session.url,
      session_id: session.id
    })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return res.status(500).json({ error: 'Failed to create checkout session', message: error.message })
  }
}

function getBaseUrl() {
  // Return the extension/web base URL
  // In production, this should be configurable
  return process.env.APP_BASE_URL || 'https://verifyai.dev'
}
