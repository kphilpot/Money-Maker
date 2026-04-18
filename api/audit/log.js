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

  const payload = req.body

  if (!payload.userId || !payload.hash) {
    return res.status(400).json({ error: 'Missing required fields (userId, hash)' })
  }

  try {
    const timestamp = new Date().toISOString()

    const { data, error } = await supabase
      .from('audit_trail')
      .insert({
        user_id: payload.userId,
        hash: payload.hash,
        created_at: timestamp,
        previous_hash: payload.previousHash || null,
        data: payload.data || null
      })
      .select('id, hash, created_at')
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      return res.status(500).json({ error: 'Failed to log audit entry' })
    }

    return res.status(201).json({
      id: data.id,
      hash: data.hash,
      timestamp: data.created_at
    })
  } catch (error) {
    console.error('Error logging audit trail:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
