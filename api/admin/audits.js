import { createClient } from '@supabase/supabase-js'
import { requireAdminAuth } from '../utils/admin-auth.js'

const supabaseUrl = process.env.SUPABASE_URL || 'https://sppetblailyeblxgpqss.supabase.co'
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwcGV0YmxhaWx5ZWJseGdwcXNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NDY3NzUsImV4cCI6MjA5MjAyMjc3NX0.TsD_HtFj0uoO4t22sR3CGEoHOdbYGI5FnnYvV-fEjeU'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Verify admin authentication
  const authError = await requireAdminAuth(req, res)
  if (authError) {
    return authError
  }

  const { user_id, start_date, end_date, page = 1 } = req.query
  const pageNum = parseInt(page) || 1
  const pageSize = 20

  try {
    let query = supabase
      .from('audit_trail')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply filters
    if (user_id) {
      query = query.eq('user_id', user_id)
    }
    if (start_date) {
      query = query.gte('created_at', start_date)
    }
    if (end_date) {
      query = query.lte('created_at', end_date)
    }

    // Apply pagination
    const start = (pageNum - 1) * pageSize
    query = query.range(start, start + pageSize - 1)

    const { data: audits, count, error } = await query

    if (error) {
      console.error('Supabase error:', error)
      return res.status(500).json({ error: 'Failed to fetch audits' })
    }

    return res.status(200).json({
      audits: audits || [],
      total_count: count || 0,
      page: pageNum,
      per_page: pageSize,
      has_next: start + pageSize < (count || 0)
    })
  } catch (error) {
    console.error('Error fetching audits:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
