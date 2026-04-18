import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

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

// Verify a single entry's hash
function verifyEntryHash(entry) {
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
  return computedHash === entry.hash
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userId } = req.query

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid userId' })
  }

  try {
    // Query all audit entries for the user, ordered by creation time
    const { data: entries, error } = await supabase
      .from('audit_trail')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Supabase error:', error)
      return res.status(500).json({ error: 'Failed to fetch audit chain' })
    }

    if (!entries || entries.length === 0) {
      return res.status(200).json({
        user_id: userId,
        chain: [],
        status: 'intact',
        entry_count: 0
      })
    }

    // Verify each entry and add status
    let chainIntact = true
    const chain = entries.map((entry, index) => {
      const isValid = verifyEntryHash(entry)
      const previousMatches = index === 0
        ? entry.previous_hash === null
        : entry.previous_hash === entries[index - 1].hash

      if (!isValid || !previousMatches) {
        chainIntact = false
      }

      return {
        id: entry.id,
        timestamp: entry.created_at,
        action: entry.action,
        result: entry.result,
        hash: entry.hash,
        previous_hash: entry.previous_hash,
        hash_valid: isValid,
        chain_link_valid: previousMatches,
        screenshot_hash: entry.screenshot_hash,
        reasoning_hash: entry.reasoning_hash,
        rulebook_version: entry.rulebook_version
      }
    })

    return res.status(200).json({
      user_id: userId,
      chain: chain,
      status: chainIntact ? 'intact' : 'broken',
      entry_count: chain.length,
      last_entry: chain[chain.length - 1] || null
    })
  } catch (error) {
    console.error('Error fetching audit chain:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
