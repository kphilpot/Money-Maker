/**
 * API client for Vercel backend endpoints
 * Used by paid tiers (pro/max) to query usage and tiers from Supabase
 */

const API_BASE = process.env.REACT_APP_API_BASE || 'https://money-maker-nvvon38zk-kphilpots-projects.vercel.app'

interface UsageResponse {
  count: number
  cost: number
  date: string
  resetAt: string
}

interface TierResponse {
  tier: 'free' | 'pro' | 'max'
  id: string
}

interface AuditLogRequest {
  userId: string
  action: 'verification'
  result: 'pass' | 'fail' | 'unclear' | 'pending'
  screenshotHash: string
  reasoningHash?: string
  ruleBookVersion?: string
  previousHash?: string
  hash: string
}

interface AuditLogResponse {
  id: string
  hash: string
  timestamp: string
}

interface CheckoutResponse {
  success: boolean
  checkout_url: string
  session_id: string
}

/**
 * Get user's tier from backend
 * Used to verify tier status for paid users
 */
export async function getUserTier(userId: string): Promise<'free' | 'pro' | 'max'> {
  try {
    const response = await fetch(`${API_BASE}/api/users/${userId}/tier`)

    if (!response.ok) {
      console.warn(`Failed to fetch tier: ${response.status}`)
      return 'free' // Fallback to free tier
    }

    const data = (await response.json()) as TierResponse
    return data.tier
  } catch (error) {
    console.warn('Error fetching user tier:', error)
    return 'free' // Fallback to free tier
  }
}

/**
 * Get today's usage count from backend
 * Only called for pro/max users
 */
export async function getDailyUsage(userId: string): Promise<number> {
  try {
    const response = await fetch(`${API_BASE}/api/users/${userId}/usage/today`)

    if (!response.ok) {
      console.warn(`Failed to fetch usage: ${response.status}`)
      return 0 // Fallback to 0
    }

    const data = (await response.json()) as UsageResponse
    return data.count
  } catch (error) {
    console.warn('Error fetching daily usage:', error)
    return 0 // Fallback to 0
  }
}

/**
 * Increment usage count in backend
 * Called after each verification for pro/max users
 */
export async function incrementDailyUsage(userId: string): Promise<number> {
  try {
    const response = await fetch(`${API_BASE}/api/users/${userId}/usage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    })

    if (!response.ok) {
      console.warn(`Failed to increment usage: ${response.status}`)
      return 0 // Fallback
    }

    const data = (await response.json()) as UsageResponse
    return data.count
  } catch (error) {
    console.warn('Error incrementing daily usage:', error)
    return 0 // Fallback
  }
}

/**
 * Log audit trail entry to backend
 * Called for all users (free and paid)
 */
export async function logAuditTrail(request: AuditLogRequest): Promise<AuditLogResponse | null> {
  try {
    const response = await fetch(`${API_BASE}/api/audit/log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      console.warn(`Failed to log audit: ${response.status}`)
      return null
    }

    return (await response.json()) as AuditLogResponse
  } catch (error) {
    console.warn('Error logging audit trail:', error)
    return null
  }
}

/**
 * Create Stripe checkout session for upgrading subscription
 * Requires valid Supabase Auth token
 * @param tier 'pro' | 'max'
 * @param authToken Supabase auth token from user session
 * @returns Checkout URL or null if failed
 */
export async function createCheckoutSession(tier: 'pro' | 'max', authToken: string): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE}/api/stripe/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ tier })
    })

    if (!response.ok) {
      console.warn(`Failed to create checkout session: ${response.status}`)
      return null
    }

    const data = (await response.json()) as CheckoutResponse
    return data.checkout_url
  } catch (error) {
    console.warn('Error creating checkout session:', error)
    return null
  }
}
