import { apiRequest } from './api.js'

export function createLead(data) {
  return apiRequest('/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export function getLeads(params = {}) {
  const query = new URLSearchParams()
  if (params.status) query.set('status', params.status)
  if (params.agentId) query.set('agentId', params.agentId)
  if (params.leadPriority) query.set('leadPriority', params.leadPriority)
  if (params.leadSource) query.set('leadSource', params.leadSource)
  if (params.search) query.set('search', params.search)
  if (params.page) query.set('page', params.page)
  if (params.limit) query.set('limit', params.limit)
  const qs = query.toString()
  return apiRequest(`/leads${qs ? `?${qs}` : ''}`)
}

export function getLead(id) {
  return apiRequest(`/leads/${id}`)
}

export function updateLead(id, data) {
  return apiRequest(`/leads/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export function updateLeadStatus(id, status, notes) {
  return apiRequest(`/leads/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, notes }),
  })
}

export function deleteLead(id) {
  return apiRequest(`/leads/${id}`, { method: 'DELETE' })
}

export function assignAgents(id, assignments, reassignmentReason) {
  return apiRequest(`/leads/${id}/assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assignments, reassignmentReason }),
  })
}

export function reassignAgent(id, agentId, commissionShare, reason) {
  return apiRequest(`/leads/${id}/reassign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      assignments: [{ agentId, commissionShare }],
      reassignmentReason: reason,
    }),
  })
}

export function removeAssignment(id, agentId) {
  return apiRequest(`/leads/${id}/assignments/${agentId}`, { method: 'DELETE' })
}

export function getAssignments(id) {
  return apiRequest(`/leads/${id}/assignments`)
}

export function addNote(id, content, noteType) {
  return apiRequest(`/leads/${id}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, noteType }),
  })
}

export function getActivityLog(id, page, limit) {
  const params = new URLSearchParams()
  if (page) params.set('page', page)
  if (limit) params.set('limit', limit)
  const qs = params.toString()
  return apiRequest(`/leads/${id}/activity${qs ? `?${qs}` : ''}`)
}

export function getStatusHistory(id) {
  return apiRequest(`/leads/${id}/status-history`)
}

export function addFollowUp(id, data) {
  return apiRequest(`/leads/${id}/follow-ups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export function updateFollowUp(followUpId, data) {
  return apiRequest(`/leads/follow-ups/${followUpId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export function getFollowUps(id) {
  return apiRequest(`/leads/${id}/follow-ups`)
}

export function getTodayFollowUps() {
  return apiRequest('/leads/follow-ups/today')
}

export function getTomorrowFollowUps() {
  return apiRequest('/leads/follow-ups/tomorrow')
}

export function getOverdueFollowUps() {
  return apiRequest('/leads/follow-ups/overdue')
}

export function getFollowUpsForAgent(agentId, date) {
  const params = date ? `?date=${date}` : ''
  return apiRequest(`/leads/follow-ups/agent/${agentId}${params}`)
}

export function getStatusSummary() {
  return apiRequest('/leads/reports/status-summary')
}

export function getAgentPerformance(agentId) {
  const params = agentId ? `?agentId=${agentId}` : ''
  return apiRequest(`/leads/reports/agent-performance${params}`)
}

export function getLeadAging() {
  return apiRequest('/leads/reports/lead-aging')
}

export function getSourcePerformance() {
  return apiRequest('/leads/reports/source-performance')
}

export function getUnworkedLeads(days) {
  const params = days ? `?days=${days}` : ''
  return apiRequest(`/leads/reports/unworked${params}`)
}

export function getNeedAnalysis(leadId) {
  return apiRequest(`/leads/${leadId}/need-analysis`)
}

export function saveNeedAnalysis(leadId, data) {
  return apiRequest(`/leads/${leadId}/need-analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export function deleteNeedAnalysis(leadId) {
  return apiRequest(`/leads/${leadId}/need-analysis`, { method: 'DELETE' })
}

export function sendNeedAnalysisToClient(leadId, { pdfBase64, clientEmail }) {
  return apiRequest(`/leads/${leadId}/need-analysis/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pdfBase64, clientEmail }),
  })
}

export function runQuote(leadId, params = {}) {
  return apiRequest(`/leads/${leadId}/quotes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
}

export function listQuotes(leadId) {
  return apiRequest(`/leads/${leadId}/quotes`)
}

export function selectQuote(leadId, quoteInternalId) {
  return apiRequest(`/leads/${leadId}/quotes/${quoteInternalId}/select`, {
    method: 'POST',
  })
}

export function emailQuote(leadId, quoteInternalId, clientEmail) {
  return apiRequest(`/leads/${leadId}/quotes/${quoteInternalId}/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientEmail }),
  })
}

export function deleteQuote(leadId, quoteInternalId) {
  return apiRequest(`/leads/${leadId}/quotes/${quoteInternalId}`, {
    method: 'DELETE',
  })
}
