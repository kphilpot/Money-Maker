import { createClient } from '@supabase/supabase-js'

// TODO: Move to Vercel environment variables (Settings → Environment Variables)
const supabaseUrl = process.env.SUPABASE_URL || 'https://sppetblailyeblxgpqss.supabase.co'
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwcGV0YmxhaWx5ZWJseGdwcXNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NDY3NzUsImV4cCI6MjA5MjAyMjc3NX0.TsD_HtFj0uoO4t22sR3CGEoHOdbYGI5FnnYvV-fEjeU'

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
