import { apiRequest } from './api.js'

export function createAgent({ form, docs, level, mode }) {
  const payload = new FormData()

  Object.entries(form).forEach(([key, value]) => {
    payload.append(key, value)
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
