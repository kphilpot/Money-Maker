import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabase } from '../../../backend/lib/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing user ID' })
  }

  try {
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

    const { data, error } = await supabase
      .from('daily_usage')
      .select('count, cost')
      .eq('user_id', id)
      .eq('date', today)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    // If no record found, return 0
    const count = data?.count || 0
    const cost = data?.cost || 0

    return res.status(200).json({
      count,
      cost,
      date: today,
      resetAt: getResetTime()
    })
  } catch (error) {
    console.error('Error fetching daily usage:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

function getResetTime(): string {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  return tomorrow.toISOString()
}
