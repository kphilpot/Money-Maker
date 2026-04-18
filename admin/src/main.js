import { initAuth } from './auth.js'
import { showDashboard } from './dashboard.js'

const appDiv = document.getElementById('app')

// Initialize the app
async function init() {
  // Check if user is already logged in
  const token = localStorage.getItem('admin_token')

  if (token) {
    // Show dashboard
    showDashboard(appDiv)
  } else {
    // Show login page
    initAuth(appDiv, () => {
      showDashboard(appDiv)
    })
  }
}

init()
