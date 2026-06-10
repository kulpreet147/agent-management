import { apiBinaryRequest, apiRequest } from './api.js'

export function createAgent({ form, docs, mode }) {
  const payload = new FormData()
  const allowedFields = [
    'name',
    'email',
    'phone',
    'agentId',
    'licenceType',
    'requireSponsorship',
    'haveApexa',
    'apexaId',
    'eo',
    'apex',
    'creditScore',
    'sin',
    'mga',
    'accessCode',
    'status',
    'comment',
    'licenceExpiryDate',
    'eoPolicyNumber',
    'eoPolicyCompany',
    'eoPolicyExpiryDate',
    'referralSource',
    'notes',
    'commissionOverride',
    'segFundsOverride',
    'insuranceCompany'
  ]

  allowedFields.forEach((key) => {
    const value =
      (key === 'commissionOverride' || key === 'segFundsOverride') && !form[key]
        ? '0'
        : form[key]
    payload.append(key, value ?? '')
  })
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

export function resendAgentInvite(agentId) {
  return apiRequest(`/agents/${agentId}/resend-invite`, {
    method: 'POST'
  })
}

export function adminSetAgentPassword(agentId, password) {
  return apiRequest(`/agents/${agentId}/admin-set-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ password })
  })
}

export function updateAccountActivationStatus(agentId, status) {
  return apiRequest(`/agents/${agentId}/account-activation-status`, {
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

export function getAgentSignedDocuments(agentId) {
  return apiRequest(`/agents/${agentId}/signed-documents`)
}

export function reviewAgentDocument(agentId, payload) {
  return apiRequest(`/agents/${agentId}/document-review`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
}

export function rejectAgentDocument(agentId, payload) {
  return apiRequest(`/agents/${agentId}/reject-document`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
}

export function sendMgaPackageEmail(agentId, payload) {
  return apiRequest(`/agents/${agentId}/send-mga-package-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
}

export function getAgentProfile(agentId) {
  return apiRequest(`/agents/${agentId}/profile`).catch(() => apiRequest(`/agents/${agentId}`))
}

export function triggerAgentAgreements(agentId, payload = {}) {
  return apiRequest(`/agents/${agentId}/trigger-agreements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
}

export function markManagerAgreementComplete(agentId, payload = {}) {
  return apiRequest(`/agents/${agentId}/agreements/manager-complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
}

export function getManagerAgreementPackage(token) {
  return apiRequest(`/agents/manager-agreements/${token}`, {
    skipAuth: true,
  })
}

export function submitManagerAgreementPackage(token, payload) {
  return apiRequest(`/agents/manager-agreements/${token}/sign`, {
    method: 'POST',
    skipAuth: true,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
}

export function getAgentAgreementPreview(agentId, documentId) {
  return apiBinaryRequest(`/agents/${agentId}/agreement-preview/${documentId}`)
}

export function updateAgentProfile(agentId, payload) {
  if (!(payload instanceof FormData)) {
    throw new Error('Profile update requires FormData payload.')
  }

  payload.set('agentId', String(agentId))

  return apiRequest('/agents/UpdateProfile', {
    method: 'POST',
    body: payload,
  })
}

export function requestTierUpgrade(agentId, requestedTier) {
  return apiRequest(`/agents/${agentId}/tier-request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ requestedTier })
  })
}

export function decideAgentTierRequest(agentId, payload) {
  return apiRequest(`/agents/${agentId}/tier-request`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
}

export function changeAgentPassword(agentId, payload) {
  return apiRequest(`/agents/${agentId}/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
}

export function updateAgentRegistrationDetails(agentId, details) {
  const formData = new FormData()
  formData.set('agentId', String(agentId))
  formData.set(
    'profile',
    JSON.stringify({
      personal: {
        city: details.city || '',
        residence: details.residence || '',
        postalCode: details.postalCode || '',
      },
    }),
  )

  return apiRequest('/agents/UpdateProfile', {
    method: 'POST',
    body: formData,
  })
}
