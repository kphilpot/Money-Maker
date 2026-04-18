import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing user ID' })
  }

  try {
    const today = new Date().toISOString().split('T')[0]

    // First, try to find existing record for today
    const { data: existing, error: selectError } = await supabase
      .from('daily_usage')
      .select('id, count')
      .eq('user_id', id)
      .eq('date', today)
      .single()

    let result

    if (selectError && selectError.code === 'PGRST116') {
      // No record found, insert new one
      const { data, error } = await supabase
        .from('daily_usage')
        .insert({
          user_id: id,
          date: today,
          count: 1,
          cost: 0
        })
        .select('count')
        .single()

      if (error) {
        console.error('Supabase insert error:', error)
        return res.status(500).json({ error: 'Failed to increment usage' })
      }

      result = data
    } else if (selectError) {
      console.error('Supabase select error:', selectError)
      return res.status(500).json({ error: 'Failed to fetch usage' })
    } else {
      // Record exists, increment count
      const { data, error } = await supabase
        .from('daily_usage')
        .update({ count: existing.count + 1 })
        .eq('id', existing.id)
        .select('count')
        .single()

      if (error) {
        console.error('Supabase update error:', error)
        return res.status(500).json({ error: 'Failed to increment usage' })
      }

      result = data
    }

    return res.status(200).json({
      count: result.count,
      date: today
    })
  } catch (error) {
    console.error('Error incrementing usage:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
