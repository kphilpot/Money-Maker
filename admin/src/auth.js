import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://sppetblailyeblxgpqss.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwcGV0YmxhaWx5ZWJseGdwcXNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NDY3NzUsImV4cCI6MjA5MjAyMjc3NX0.TsD_HtFj0uoO4t22sR3CGEoHOdbYGI5FnnYvV-fEjeU'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export function initAuth(container, onLoginSuccess) {
  container.innerHTML = `
    <div class="login-container">
      <div class="login-box">
        <h1>🔐 VerifyAI Admin</h1>
        <p class="subtitle">Audit Trail Management Dashboard</p>

        <form id="login-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required placeholder="admin@example.com">
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required placeholder="••••••••">
          </div>

          <button type="submit" class="btn btn-primary">Sign In</button>

          <div id="error-message" class="error-message" style="display: none;"></div>
        </form>

        <p class="login-hint">Test credentials: admin@verifyai.dev / admin123</p>
      </div>
    </div>
  `

  const form = document.getElementById('login-form')
  const errorDiv = document.getElementById('error-message')

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value

    try {
      errorDiv.style.display = 'none'
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        errorDiv.textContent = error.message
        errorDiv.style.display = 'block'
        return
      }

      // Store token
      if (data.session) {
        localStorage.setItem('admin_token', data.session.access_token)
        localStorage.setItem('admin_user', JSON.stringify(data.user))
        onLoginSuccess()
      }
    } catch (err) {
      errorDiv.textContent = err.message
      errorDiv.style.display = 'block'
    }
  })
}

export function logout() {
  localStorage.removeItem('admin_token')
  localStorage.removeItem('admin_user')
  location.reload()
}

export function getAuthToken() {
  return localStorage.getItem('admin_token')
}

export function getAuthUser() {
  const user = localStorage.getItem('admin_user')
  return user ? JSON.parse(user) : null
}
