import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabaseAdmin } from '../../backend/lib/supabase'

interface AuditLogRequest {
  userId: string
  action: 'verification'
  result: 'pass' | 'fail' | 'unclear' | 'pending'
  screenshotHash: string
  reasoningHash?: string
  ruleBookVersion?: string
  previousHash?: string
  hash: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const payload = req.body as AuditLogRequest

  if (!payload.userId || !payload.hash) {
    return res.status(400).json({ error: 'Missing required fields (userId, hash)' })
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('audit_trail')
      .insert({
        user_id: payload.userId,
        action: payload.action || 'verification',
        result: payload.result,
        screenshot_hash: payload.screenshotHash,
        reasoning_hash: payload.reasoningHash,
        rulebook_version: payload.ruleBookVersion,
        previous_hash: payload.previousHash,
        hash: payload.hash,
        timestamp: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return res.status(201).json({
      id: data?.id,
      hash: data?.hash,
      timestamp: data?.timestamp
    })
  } catch (error) {
    console.error('Error logging audit trail:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
