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

    // For now, return incremented count
    // In production, would update Supabase:
    // const { data: existing } = await supabase.from('daily_usage').select('id, count').eq('user_id', id).eq('date', today).single()
    // if (existing) { update count } else { insert new record }

    return res.status(200).json({
      count: 1,
      date: today
    })
  } catch (error) {
    console.error('Error incrementing usage:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
