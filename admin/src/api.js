import { getAuthToken } from './auth.js'

const API_BASE = typeof window !== 'undefined' && window.location.origin
  ? window.location.origin
  : 'https://money-maker-kl2345.vercel.app'

async function fetchAPI(endpoint, options = {}) {
  const token = getAuthToken()
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }

  return response.json()
}

export async function getAudits(params = {}) {
  const queryString = new URLSearchParams(params).toString()
  const endpoint = `/api/admin/audits?${queryString}`
  return fetchAPI(endpoint)
}

export async function getUsers() {
  return fetchAPI('/api/admin/users')
}

export async function verifyChain(userId) {
  return fetchAPI('/api/audit/verify', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId })
  })
}

export async function sendReceipt(auditId, userId) {
  return fetchAPI('/api/audit/send-receipt', {
    method: 'POST',
    body: JSON.stringify({ audit_id: auditId, user_id: userId })
  })
}

export async function getAuditChain(userId) {
  return fetchAPI(`/api/audit/chain/${userId}`)
}
