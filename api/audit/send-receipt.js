import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { generateReceiptHTML, generateReceiptPlainText } from '../utils/email-templates.js'
import { requireAdminAuth } from '../utils/admin-auth.js'
import crypto from 'crypto'

const supabaseUrl = process.env.SUPABASE_URL || 'https://sppetblailyeblxgpqss.supabase.co'
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwcGV0YmxhaWx5ZWJseGdwcXNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NDY3NzUsImV4cCI6MjA5MjAyMjc3NX0.TsD_HtFj0uoO4t22sR3CGEoHOdbYGI5FnnYvV-fEjeU'
const resendApiKey = process.env.RESEND_API_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)
const resend = resendApiKey ? new Resend(resendApiKey) : null

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

  const computedHash = crypto
    .createHash('sha256')
    .update(JSON.stringify(entryData))
    .digest('hex')

  return computedHash === entry.hash
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

  if (!resendApiKey) {
    return res.status(500).json({ error: 'Email service not configured (RESEND_API_KEY missing)' })
  }

  const { audit_id, user_id } = req.body

  if (!audit_id || !user_id) {
    return res.status(400).json({ error: 'Missing required fields: audit_id, user_id' })
  }

  try {
    // Fetch the audit entry
    const { data: auditEntry, error: auditError } = await supabase
      .from('audit_trail')
      .select('*')
      .eq('id', audit_id)
      .single()

    if (auditError || !auditEntry) {
      console.error('Audit entry not found:', auditError)
      return res.status(404).json({ error: 'Audit entry not found' })
    }

    // Verify user_id matches
    if (auditEntry.user_id !== user_id) {
      return res.status(403).json({ error: 'Unauthorized: user_id mismatch' })
    }

    // Fetch user email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', user_id)
      .single()

    if (userError || !user) {
      console.error('User not found:', userError)
      return res.status(404).json({ error: 'User not found' })
    }

    // Determine chain status (simplified - just check if hash is valid)
    const hashIsValid = verifyEntryHash(auditEntry)
    const chainStatus = hashIsValid ? 'intact' : 'broken'

    // Generate receipt HTML and plain text
    const htmlContent = generateReceiptHTML(auditEntry, chainStatus)
    const plainTextContent = generateReceiptPlainText(auditEntry, chainStatus)

    // Send email via Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'noreply@verifyai.dev',
      to: user.email,
      subject: `🔐 VerifyAI Audit Entry Receipt - ${new Date(auditEntry.created_at).toLocaleDateString()}`,
      html: htmlContent,
      text: plainTextContent,
      reply_to: 'support@verifyai.dev'
    })

    if (emailError) {
      console.error('Resend error:', emailError)
      return res.status(500).json({ error: 'Failed to send email', details: emailError.message })
    }

    return res.status(200).json({
      success: true,
      receipt_id: emailData?.id || `receipt-${audit_id}`,
      sent_at: new Date().toISOString(),
      sent_to: user.email,
      audit_id: audit_id,
      chain_status: chainStatus
    })
  } catch (error) {
    console.error('Error sending audit receipt:', error)
    return res.status(500).json({ error: 'Internal server error', message: error.message })
  }
}
