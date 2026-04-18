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

    // For now, return 0 usage since Supabase client not initialized
    // In production, would query: const { data } = await supabase.from('daily_usage').select('count, cost').eq('user_id', id).eq('date', today).single()
    return res.status(200).json({
      count: 0,
      cost: 0,
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
