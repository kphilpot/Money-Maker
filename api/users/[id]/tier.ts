import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabase } from '../../backend/lib/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
      if (error.code === 'PGRST116') {
        // Not found
        return res.status(404).json({ error: 'User not found' })
      }
      throw error
    }

    return res.status(200).json({
      tier: data?.tier || 'free',
      id
    })
  } catch (error) {
    console.error('Error fetching user tier:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
