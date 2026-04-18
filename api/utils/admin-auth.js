import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'https://sppetblailyeblxgpqss.supabase.co'
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwcGV0YmxhaWx5ZWJseGdwcXNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NDY3NzUsImV4cCI6MjA5MjAyMjc3NX0.TsD_HtFj0uoO4t22sR3CGEoHOdbYGI5FnnYvV-fEjeU'

// For local development: accept the demo token
function verifyDemoToken(token) {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString())
    return decoded.role === 'admin' && decoded.exp > Math.floor(Date.now() / 1000)
  } catch {
    return false
  }
}

export async function requireAdminAuth(req, res) {
  const authHeader = req.headers.authorization
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token' })
  }

  // Check if it's a demo token (base64-encoded JSON with role: admin)
  if (verifyDemoToken(token)) {
    return null // Auth successful
  }

  // Try to verify as Supabase JWT (production)
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    // Optionally check if user is admin (requires admin_role column in users table)
    // For now, any authenticated user can access admin endpoints
    // TODO: Implement admin role check
    // const { data: userRole } = await supabase
    //   .from('users')
    //   .select('admin_role')
    //   .eq('id', user.id)
    //   .single()
    // if (!userRole?.admin_role) {
    //   return res.status(403).json({ error: 'Not an admin' })
    // }

    return null // Auth successful
  } catch (error) {
    console.error('Auth error:', error)
    return res.status(401).json({ error: 'Token validation failed' })
  }
}
