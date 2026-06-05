import { apiRequest } from './api.js'

export function createClient(data) {
  return apiRequest('/clients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export function getClients(params = {}) {
  const query = new URLSearchParams()
  if (params.status) query.set('status', params.status)
  if (params.agentId) query.set('agentId', params.agentId)
  if (params.tags) query.set('tags', params.tags)
  if (params.search) query.set('search', params.search)
  if (params.renewalBefore) query.set('renewalBefore', params.renewalBefore)
  if (params.renewalAfter) query.set('renewalAfter', params.renewalAfter)
  if (params.page) query.set('page', params.page)
  if (params.limit) query.set('limit', params.limit)
  const qs = query.toString()
  return apiRequest(`/clients${qs ? `?${qs}` : ''}`)
}

export function getMyClients(params = {}) {
  const query = new URLSearchParams()
  if (params.status) query.set('status', params.status)
  if (params.tags) query.set('tags', params.tags)
  if (params.search) query.set('search', params.search)
  if (params.page) query.set('page', params.page)
  if (params.limit) query.set('limit', params.limit)
  const qs = query.toString()
  return apiRequest(`/clients/my-clients${qs ? `?${qs}` : ''}`)
}

export function getClient(id) {
  return apiRequest(`/clients/${id}`)
}

export function updateClient(id, data) {
  return apiRequest(`/clients/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export function deleteClient(id) {
  return apiRequest(`/clients/${id}`, { method: 'DELETE' })
}

// ============ POLICIES ============

export function addPolicy(clientId, data) {
  return apiRequest(`/clients/${clientId}/policies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export function updatePolicy(clientId, policyId, data) {
  return apiRequest(`/clients/${clientId}/policies/${policyId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export function removePolicy(clientId, policyId) {
  return apiRequest(`/clients/${clientId}/policies/${policyId}`, { method: 'DELETE' })
}

// ============ DOCUMENTS ============

export function uploadDocument(clientId, file, documentType, expiryDate) {
  const formData = new FormData()
  formData.append('file', file)
  if (documentType) formData.append('documentType', documentType)
  if (expiryDate) formData.append('expiryDate', expiryDate)
  return apiRequest(`/clients/${clientId}/documents`, {
    method: 'POST',
    body: formData,
  })
}

export function getDocuments(clientId) {
  return apiRequest(`/clients/${clientId}/documents`)
}

export function downloadDocument(clientId, docId) {
  const session = JSON.parse(sessionStorage.getItem('agentflow_auth') || localStorage.getItem('agentflow_auth') || '{}')
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000/api'
  const url = `${API_BASE}/clients/${clientId}/documents/${docId}/download`
  const a = document.createElement('a')
  a.href = url
  if (session?.token) {
    fetch(url, { headers: { Authorization: `Bearer ${session.token}` } })
      .then(res => {
        if (!res.ok) throw new Error('Download failed')
        return res.blob()
      })
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob)
        a.href = blobUrl
        a.click()
        URL.revokeObjectURL(blobUrl)
      })
      .catch(err => alert(err.message || 'Download failed'))
  } else {
    a.click()
  }
}

// ============ NOTES ============

export function addNote(clientId, content, noteType) {
  return apiRequest(`/clients/${clientId}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, noteType }),
  })
}

export function getNotes(clientId) {
  return apiRequest(`/clients/${clientId}/notes`)
}

// ============ ACTIVITY LOG ============

export function getActivityLog(clientId, page, limit) {
  const params = new URLSearchParams()
  if (page) params.set('page', page)
  if (limit) params.set('limit', limit)
  const qs = params.toString()
  return apiRequest(`/clients/${clientId}/activity${qs ? `?${qs}` : ''}`)
}

// ============ FOLLOW-UPS ============

export function addFollowUp(clientId, data) {
  return apiRequest(`/clients/${clientId}/follow-ups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export function updateFollowUp(followUpId, data) {
  return apiRequest(`/clients/follow-ups/${followUpId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export function getFollowUps(clientId) {
  return apiRequest(`/clients/${clientId}/follow-ups`)
}

export function getUpcomingFollowUps() {
  return apiRequest('/clients/follow-ups/upcoming')
}

export function getOverdueFollowUps() {
  return apiRequest('/clients/follow-ups/overdue')
}

// ============ DASHBOARD & REPORTS ============

export function getClientStats() {
  return apiRequest('/clients/dashboard/stats')
}

export function getUpcomingRenewals() {
  return apiRequest('/clients/reports/upcoming-renewals')
}

export function getPolicySummary() {
  return apiRequest('/clients/reports/policy-summary')
}

// ============ HOUSEHOLD ============

export function addHouseholdMember(clientId, data) {
  return apiRequest(`/clients/${clientId}/household`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export function getHouseholdMembers(clientId) {
  return apiRequest(`/clients/${clientId}/household`)
}

export function removeHouseholdMember(clientId, memberId) {
  return apiRequest(`/clients/${clientId}/household/${memberId}`, { method: 'DELETE' })
}
