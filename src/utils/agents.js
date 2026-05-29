import { apiRequest } from './api.js'

export function createAgent({ form, docs, level, mode }) {
  const payload = new FormData()
  const allowedFields = [
    'name',
    'email',
    'agentId',
    'licenceType',
    'eo',
    'apex',
    'creditReport',
    'sin',
    'mga',
    'commissionOverride',
    'insuranceCompany',
    'agentCode'
  ]

  allowedFields.forEach((key) => {
    const value = key === 'commissionOverride' && !form[key] ? '0' : form[key]
    payload.append(key, value ?? '')
  })

  payload.append('agentLevel', level)
  payload.append('licenceWorkflow', mode)

  Object.entries(docs).forEach(([key, file]) => {
    if (file) payload.append(key, file)
  })

  return apiRequest('/agents', {
    method: 'POST',
    body: payload,
  })
}

export function getAgents() {
  return apiRequest('/agents')
}

export function getAgent(id) {
  return apiRequest(`/agents/${id}`)
}

export function getAgentInvite(token) {
  return apiRequest(`/agents/invites/${token}`)
}

export function activateAgentInvite(token, password) {
  return apiRequest(`/agents/invites/${token}/activate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ password })
  })
}

export function updateAgentOnboardingStatus(agentId, status) {
  return apiRequest(`/agents/${agentId}/onboarding-status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status })
  })
}

export function saveAgentSignedDocument(agentId, document) {
  return apiRequest(`/agents/${agentId}/signed-documents`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(document)
  })
}
