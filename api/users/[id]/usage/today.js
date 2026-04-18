import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing user ID' })
  }

  try {
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('daily_usage')
      .select('count, cost')
      .eq('user_id', id)
      .eq('date', today)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Supabase error:', error)
      return res.status(500).json({ error: 'Failed to fetch daily usage' })
    }

    return res.status(200).json({
      count: data?.count || 0,
      cost: data?.cost || 0,
      date: today,
      resetAt: getResetTime()
    })
  } catch (error) {
    console.error('Error fetching daily usage:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

function getResetTime() {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  return tomorrow.toISOString()
}
