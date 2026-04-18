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
    const { data, error } = await supabase
      .from('users')
      .select('tier')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return res.status(500).json({ error: 'Failed to fetch user tier' })
    }

    if (!data) {
      return res.status(404).json({ error: 'User not found' })
    }

    return res.status(200).json({
      tier: data.tier,
      id
    })
  } catch (error) {
    console.error('Error fetching user tier:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
