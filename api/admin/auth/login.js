import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'https://sppetblailyeblxgpqss.supabase.co'
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwcGV0YmxhaWx5ZWJseGdwcXNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NDY3NzUsImV4cCI6MjA5MjAyMjc3NX0.TsD_HtFj0uoO4t22sR3CGEoHOdbYGI5FnnYvV-fEjeU'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Simple auth for demo - hardcoded admin credentials
const ADMIN_EMAIL = 'admin@verifyai.dev'
const ADMIN_PASSWORD = 'admin123'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' })
  }

  try {
    // For demo: Simple hardcoded auth
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      // Create a mock JWT token
      const token = Buffer.from(JSON.stringify({
        email,
        role: 'admin',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 86400
      })).toString('base64')

      return res.status(200).json({
        success: true,
        token: token,
        user: { email, id: 'admin-001' },
        expires_in: 86400
      })
    }

    // Try Supabase auth as fallback
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return res.status(401).json({ error: 'Invalid credentials' })
      }

      if (data.session) {
        return res.status(200).json({
          success: true,
          token: data.session.access_token,
          user: data.user,
          expires_in: data.session.expires_in
        })
      }
    } catch (supabaseErr) {
      // Fall through to invalid credentials
    }

    return res.status(401).json({ error: 'Invalid credentials' })
  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
