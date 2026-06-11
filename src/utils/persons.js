import { apiRequest } from './api.js'

// ============ PERSON CRUD ============

export function createPerson(data) {
  return apiRequest('/persons', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export async function getOrCreatePersonByLeadId(leadData) {
  const leadIdentifier = leadData.leadId || leadData.id
  try {
    const person = await getPersonByPersonId(leadIdentifier)
    return person
  } catch {
    let firstName = leadData.firstName
    let lastName = leadData.lastName
    if (!firstName && leadData.name) {
      const parts = leadData.name.trim().split(/\s+/)
      firstName = parts[0] || ''
      lastName = parts.slice(1).join(' ') || ''
    }
    const newPerson = await createPerson({
      firstName: firstName || '',
      lastName: lastName || '',
      email: leadData.email || '',
      phone: leadData.phone || '',
      dateOfBirth: leadData.dateOfBirth || null,
      maritalStatus: leadData.maritalStatus || '',
      address: leadData.address || '',
    })
    const personId = newPerson?.id || newPerson?.personId || newPerson?._id
    return { id: personId, ...newPerson }
  }
}

export function getPersons(params = {}) {
  const query = new URLSearchParams()
  if (params.phase) query.set('phase', params.phase)
  if (params.status) query.set('status', params.status)
  if (params.agentId) query.set('agentId', params.agentId)
  if (params.leadPriority) query.set('leadPriority', params.leadPriority)
  if (params.leadSource) query.set('leadSource', params.leadSource)
  if (params.search) query.set('search', params.search)
  if (params.maritalStatus) query.set('maritalStatus', params.maritalStatus)
  if (params.page) query.set('page', params.page)
  if (params.limit) query.set('limit', params.limit)
  const qs = query.toString()
  return apiRequest(`/persons${qs ? `?${qs}` : ''}`)
}

export function getPerson(id) {
  return apiRequest(`/persons/${id}`)
}

export function getPersonByPersonId(personId) {
  return apiRequest(`/persons/by-personId/${encodeURIComponent(personId)}`)
}

export function updatePerson(id, data) {
  return apiRequest(`/persons/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export function deletePerson(id) {
  return apiRequest(`/persons/${id}`, { method: 'DELETE' })
}

export function updatePersonStatus(id, status, notes) {
  return apiRequest(`/persons/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, notes }),
  })
}

// ============ MY PERSONS (AGENT) ============

export function getMyPersons(phase) {
  const qs = phase ? `?phase=${phase}` : ''
  return apiRequest(`/persons/my-persons${qs}`)
}

// ============ ASSIGNMENTS ============

export function getAssignments(personId) {
  return apiRequest(`/persons/${personId}/assignments`)
}

export function assignAgents(personId, assignments, reassignmentReason) {
  return apiRequest(`/persons/${personId}/assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assignments, reassignmentReason }),
  })
}

export function removeAssignment(personId, assignmentId) {
  return apiRequest(`/persons/${personId}/assignments/${assignmentId}`, { method: 'DELETE' })
}

// ============ FAMILY MEMBERS ============

export function getFamilyMembers(personId) {
  return apiRequest(`/persons/${personId}/family`)
}

export function addFamilyMember(personId, data) {
  return apiRequest(`/persons/${personId}/family`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export function updateFamilyMember(personId, memberId, data) {
  return apiRequest(`/persons/${personId}/family/${memberId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export function removeFamilyMember(personId, memberId) {
  return apiRequest(`/persons/${personId}/family/${memberId}`, { method: 'DELETE' })
}

// ============ POLICIES ============

export function getPolicies(personId) {
  return apiRequest(`/persons/${personId}/policies`)
}

export function addPolicy(personId, data) {
  return apiRequest(`/persons/${personId}/policies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export function updatePolicy(personId, policyId, data) {
  return apiRequest(`/persons/${personId}/policies/${policyId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export function removePolicy(personId, policyId) {
  return apiRequest(`/persons/${personId}/policies/${policyId}`, { method: 'DELETE' })
}

// ============ QUOTES ============

export function getQuotes(personId, familyMemberId) {
  const qs = familyMemberId ? `?familyMemberId=${familyMemberId}` : ''
  return apiRequest(`/persons/${personId}/quotes${qs}`)
}

export function selectQuote(personId, quoteId) {
  return apiRequest(`/persons/${personId}/quotes/${quoteId}/select`, { method: 'POST' })
}

export function emailQuote(personId, quoteId) {
  return apiRequest(`/persons/${personId}/quotes/${quoteId}/email`, { method: 'POST' })
}

export function updateQuoteStatus(personId, quoteId, status) {
  return apiRequest(`/persons/${personId}/quotes/${quoteId}/status`, { method: 'PATCH', body: { status } })
}

export function deleteQuote(personId, quoteId) {
  return apiRequest(`/persons/${personId}/quotes/${quoteId}`, { method: 'DELETE' })
}

// ============ NEED ANALYSIS ============

export function getNeedAnalysis(personId, familyMemberId) {
  const qs = familyMemberId ? `?familyMemberId=${familyMemberId}` : ''
  return apiRequest(`/persons/${personId}/need-analysis${qs}`)
}

export function saveNeedAnalysis(personId, data) {
  return apiRequest(`/persons/${personId}/need-analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export function deleteNeedAnalysis(personId, analysisId) {
  return apiRequest(`/persons/${personId}/need-analysis/${analysisId}`, { method: 'DELETE' })
}

// ============ OPPORTUNITIES ============

export function getOpportunities(personId, familyMemberId) {
  const qs = familyMemberId ? `?familyMemberId=${familyMemberId}` : ''
  return apiRequest(`/persons/${personId}/opportunities${qs}`)
}

export function createOpportunity(personId, data) {
  return apiRequest(`/persons/${personId}/opportunities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export function updateOpportunity(personId, oppId, data) {
  return apiRequest(`/persons/${personId}/opportunities/${oppId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export function deleteOpportunity(personId, oppId) {
  return apiRequest(`/persons/${personId}/opportunities/${oppId}`, { method: 'DELETE' })
}

// ============ FOLLOW-UPS ============

export function getFollowUps(personId) {
  return apiRequest(`/persons/${personId}/follow-ups`)
}

export function createFollowUp(personId, data) {
  return apiRequest(`/persons/${personId}/follow-ups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export function updateFollowUp(personId, followUpId, data) {
  return apiRequest(`/persons/${personId}/follow-ups/${followUpId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export function deleteFollowUp(personId, followUpId) {
  return apiRequest(`/persons/${personId}/follow-ups/${followUpId}`, { method: 'DELETE' })
}

export function getTodayFollowUps() {
  return apiRequest('/persons/follow-ups/today')
}

export function getTomorrowFollowUps() {
  return apiRequest('/persons/follow-ups/tomorrow')
}

export function getOverdueFollowUps() {
  return apiRequest('/persons/follow-ups/overdue')
}

export function getUpcomingFollowUps() {
  return apiRequest('/persons/follow-ups/upcoming')
}

// ============ ACTIVITY LOGS ============

export function getActivityLogs(personId) {
  return apiRequest(`/persons/${personId}/activity`)
}

// ============ DOCUMENTS ============

export function getDocuments(personId) {
  return apiRequest(`/persons/${personId}/documents`)
}

export function removeDocument(personId, docId) {
  return apiRequest(`/persons/${personId}/documents/${docId}`, { method: 'DELETE' })
}

// ============ NOTES ============

export function getNotes(personId) {
  return apiRequest(`/persons/${personId}/notes`)
}

export function addNote(personId, content, noteType) {
  return apiRequest(`/persons/${personId}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, noteType }),
  })
}

export function deleteNote(personId, noteId) {
  return apiRequest(`/persons/${personId}/notes/${noteId}`, { method: 'DELETE' })
}

// ============ STATUS HISTORY ============

export function getStatusHistory(personId) {
  return apiRequest(`/persons/${personId}/status-history`)
}

// ============ REPORTS ============

export function getStatusSummary() {
  return apiRequest('/persons/reports/status-summary')
}

export function getAgentPerformance() {
  return apiRequest('/persons/reports/agent-performance')
}

export function getLeadAging() {
  return apiRequest('/persons/reports/lead-aging')
}

export function getSourcePerformance() {
  return apiRequest('/persons/reports/source-performance')
}
