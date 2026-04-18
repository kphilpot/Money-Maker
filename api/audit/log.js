export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const payload = req.body

  if (!payload.userId || !payload.hash) {
    return res.status(400).json({ error: 'Missing required fields (userId, hash)' })
  }

  try {
    // For now, just acknowledge the audit entry
    // In production, would insert into Supabase:
    // const { data } = await supabase.from('audit_trail').insert({...payload})

    return res.status(201).json({
      id: `audit-${Date.now()}`,
      hash: payload.hash,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error logging audit trail:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
