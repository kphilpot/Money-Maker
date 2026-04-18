import { logout, getAuthUser } from './auth.js'
import { getAudits, verifyChain, sendReceipt, getAuditChain } from './api.js'

let currentPage = 1
let currentFilters = {}

export async function showDashboard(container) {
  const user = getAuthUser()

  container.innerHTML = `
    <div class="dashboard">
      <nav class="navbar">
        <div class="navbar-brand">
          <h1>🔐 VerifyAI Admin</h1>
        </div>
        <div class="navbar-user">
          <span class="user-email">${user?.email}</span>
          <button id="logout-btn" class="btn btn-small">Logout</button>
        </div>
      </nav>

      <div class="dashboard-container">
        <div class="filters-section">
          <h2>Filters</h2>
          <div class="filter-group">
            <label>User ID</label>
            <input type="text" id="filter-user-id" placeholder="Filter by user ID...">
          </div>
          <div class="filter-group">
            <label>Start Date</label>
            <input type="date" id="filter-start-date">
          </div>
          <div class="filter-group">
            <label>End Date</label>
            <input type="date" id="filter-end-date">
          </div>
          <button id="apply-filters" class="btn btn-primary">Apply Filters</button>
          <button id="clear-filters" class="btn btn-secondary">Clear</button>
        </div>

        <div class="audits-section">
          <div class="section-header">
            <h2>Audit Trail</h2>
            <div class="loading" id="loading" style="display: none;">Loading...</div>
          </div>

          <div class="stats-bar">
            <div class="stat">
              <strong id="stat-total">0</strong>
              <span>Total Entries</span>
            </div>
            <div class="stat">
              <strong id="stat-verified">0</strong>
              <span>Verified</span>
            </div>
            <div class="stat">
              <strong id="stat-broken">0</strong>
              <span>Broken Chain</span>
            </div>
          </div>

          <table class="audits-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User ID</th>
                <th>Action</th>
                <th>Result</th>
                <th>Hash (truncated)</th>
                <th>Chain</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="audits-body">
              <tr><td colspan="7" class="text-center">Loading...</td></tr>
            </tbody>
          </table>

          <div class="pagination">
            <button id="prev-page" class="btn btn-small">← Previous</button>
            <span id="page-info">Page 1</span>
            <button id="next-page" class="btn btn-small">Next →</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <div id="detail-modal" class="modal" style="display: none;">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Audit Entry Details</h2>
          <button id="close-modal" class="btn-close">&times;</button>
        </div>
        <div class="modal-body" id="modal-body"></div>
        <div class="modal-footer">
          <button id="modal-send-receipt" class="btn btn-primary">Send Receipt</button>
          <button id="modal-close" class="btn btn-secondary">Close</button>
        </div>
      </div>
    </div>
  `

  // Event listeners
  document.getElementById('logout-btn').addEventListener('click', logout)
  document.getElementById('apply-filters').addEventListener('click', applyFilters)
  document.getElementById('clear-filters').addEventListener('click', clearFilters)
  document.getElementById('prev-page').addEventListener('click', () => changePage(-1))
  document.getElementById('next-page').addEventListener('click', () => changePage(1))
  document.getElementById('close-modal').addEventListener('click', closeModal)
  document.getElementById('modal-close').addEventListener('click', closeModal)

  // Load initial data
  await loadAudits()
}

async function loadAudits() {
  const loading = document.getElementById('loading')
  const body = document.getElementById('audits-body')
  loading.style.display = 'inline-block'

  try {
    const params = {
      page: currentPage,
      ...currentFilters
    }

    const data = await getAudits(params)

    // Update stats
    document.getElementById('stat-total').textContent = data.total_count || 0

    // Render table
    if (data.audits && data.audits.length > 0) {
      body.innerHTML = data.audits.map(audit => `
        <tr>
          <td>${new Date(audit.created_at).toLocaleString()}</td>
          <td class="truncate" title="${audit.user_id}">${audit.user_id?.substring(0, 8)}...</td>
          <td>${audit.action || 'verification'}</td>
          <td><span class="badge ${audit.result === 'pass' ? 'badge-success' : 'badge-warning'}">${audit.result || 'pending'}</span></td>
          <td class="truncate" title="${audit.hash}"><code>${audit.hash?.substring(0, 16)}...</code></td>
          <td><span class="badge badge-info">Pending</span></td>
          <td>
            <button class="btn btn-tiny" onclick="window.showDetails('${audit.id}')">Details</button>
            <button class="btn btn-tiny" onclick="window.verifyCh('${audit.user_id}')">Verify</button>
          </td>
        </tr>
      `).join('')
    } else {
      body.innerHTML = '<tr><td colspan="7" class="text-center">No audit entries found</td></tr>'
    }

    document.getElementById('page-info').textContent = `Page ${currentPage}`
  } catch (error) {
    body.innerHTML = `<tr><td colspan="7" class="text-center error">${error.message}</td></tr>`
  } finally {
    loading.style.display = 'none'
  }
}

function applyFilters() {
  currentPage = 1
  currentFilters = {
    user_id: document.getElementById('filter-user-id').value || undefined,
    start_date: document.getElementById('filter-start-date').value || undefined,
    end_date: document.getElementById('filter-end-date').value || undefined
  }

  // Remove undefined values
  Object.keys(currentFilters).forEach(k => currentFilters[k] === undefined && delete currentFilters[k])

  loadAudits()
}

function clearFilters() {
  document.getElementById('filter-user-id').value = ''
  document.getElementById('filter-start-date').value = ''
  document.getElementById('filter-end-date').value = ''
  currentFilters = {}
  currentPage = 1
  loadAudits()
}

function changePage(delta) {
  currentPage = Math.max(1, currentPage + delta)
  loadAudits()
}

function closeModal() {
  document.getElementById('detail-modal').style.display = 'none'
}

// Global functions for table buttons
window.showDetails = async (auditId) => {
  const modal = document.getElementById('detail-modal')
  const body = document.getElementById('modal-body')
  body.innerHTML = '<p>Loading...</p>'
  modal.style.display = 'block'

  try {
    // In a real app, fetch the full audit details
    body.innerHTML = `
      <div class="detail-content">
        <p><strong>Audit ID:</strong> <code>${auditId}</code></p>
        <p>Full details view coming soon...</p>
      </div>
    `
  } catch (error) {
    body.innerHTML = `<p class="error">Error: ${error.message}</p>`
  }
}

window.verifyCh = async (userId) => {
  try {
    const result = await verifyChain(userId)
    alert(`Chain Status: ${result.chain_integrity}\n${result.total_entries} entries verified`)
  } catch (error) {
    alert(`Error: ${error.message}`)
  }
}
