import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { requireAdminAuth } from '../utils/admin-auth.js'

const supabaseUrl = process.env.SUPABASE_URL || 'https://sppetblailyeblxgpqss.supabase.co'
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwcGV0YmxhaWx5ZWJseGdwcXNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NDY3NzUsImV4cCI6MjA5MjAyMjc3NX0.TsD_HtFj0uoO4t22sR3CGEoHOdbYGI5FnnYvV-fEjeU'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Compute SHA-256 hash of data
function computeHash(data) {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(data))
    .digest('hex')
}

// Verify that each audit entry's hash matches the expected chain
function verifyAuditChain(entries) {
  const issues = []

  if (entries.length === 0) {
    return { verified: true, chain_integrity: 'intact', issues: [] }
  }

  // First entry should have no previous_hash or it should be null
  if (entries[0].previous_hash !== null) {
    issues.push({
      entry_id: entries[0].id,
      timestamp: entries[0].created_at,
      issue: 'First entry has previous_hash set (should be null)'
    })
  }

  // Verify each entry
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    const previousEntry = i > 0 ? entries[i - 1] : null

    // Build the data that should be hashed
    const entryData = {
      user_id: entry.user_id,
      action: entry.action,
      result: entry.result,
      screenshot_hash: entry.screenshot_hash,
      reasoning_hash: entry.reasoning_hash,
      rulebook_version: entry.rulebook_version,
      timestamp: entry.timestamp,
      previous_hash: entry.previous_hash
    }

    const computedHash = computeHash(entryData)

    // Verify the hash matches
    if (computedHash !== entry.hash) {
      issues.push({
        entry_id: entry.id,
        timestamp: entry.created_at,
        issue: `Hash mismatch. Expected: ${computedHash}, Got: ${entry.hash}`
      })
    }

    // Verify previous_hash chain (if not first entry)
    if (i > 0) {
      if (entry.previous_hash !== previousEntry.hash) {
        issues.push({
          entry_id: entry.id,
          timestamp: entry.created_at,
          issue: `previous_hash mismatch. Expected: ${previousEntry.hash}, Got: ${entry.previous_hash}`
        })
      }
    }
  }

  const verified = issues.length === 0
  const chain_integrity = verified ? 'intact' : 'broken'

  return { verified, chain_integrity, issues }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Verify admin authentication
  const authError = await requireAdminAuth(req, res)
  if (authError) {
    return authError
  }

  const { user_id, start_date, end_date } = req.body

  if (!user_id || typeof user_id !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid user_id' })
  }

  try {
    // Query all audit entries for the user, ordered by creation time
    let query = supabase
      .from('audit_trail')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: true })

    // Apply date filters if provided
    if (start_date) {
      query = query.gte('created_at', start_date)
    }
    if (end_date) {
      query = query.lte('created_at', end_date)
    }

    const { data: entries, error } = await query

    if (error) {
      console.error('Supabase error:', error)
      return res.status(500).json({ error: 'Failed to fetch audit trail' })
    }

    // Verify the chain integrity
    const verification = verifyAuditChain(entries || [])

    return res.status(200).json({
      user_id,
      verified: verification.verified,
      chain_integrity: verification.chain_integrity,
      total_entries: entries?.length || 0,
      issues: verification.issues
    })
  } catch (error) {
    console.error('Error verifying audit chain:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
