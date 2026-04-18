export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing user ID' })
  }

  try {
    // For now, return default tier since Supabase client not initialized
    // In production, would query: const { data } = await supabase.from('users').select('tier').eq('id', id).single()
    return res.status(200).json({
      tier: 'free',
      id
    })
  } catch (error) {
    console.error('Error fetching user tier:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
