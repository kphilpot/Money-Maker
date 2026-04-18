import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabaseAdmin } from '../../../backend/lib/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing user ID' })
  }

  try {
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

    // Try to update existing record, if not found, insert new
    const { data: existing } = await supabaseAdmin
      .from('daily_usage')
      .select('id, count')
      .eq('user_id', id)
      .eq('date', today)
      .single()

    let result

    if (existing) {
      // Increment existing record
      result = await supabaseAdmin
        .from('daily_usage')
        .update({ count: (existing.count || 0) + 1 })
        .eq('id', existing.id)
        .select()
        .single()
    } else {
      // Create new record
      result = await supabaseAdmin
        .from('daily_usage')
        .insert({
          user_id: id,
          date: today,
          count: 1,
          cost: 0
        })
        .select()
        .single()
    }

    if (result.error) {
      throw result.error
    }

    return res.status(200).json({
      count: result.data?.count,
      date: today
    })
  } catch (error) {
    console.error('Error incrementing usage:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
