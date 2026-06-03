const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000/api'

export async function apiRequest(path, options = {}) {
  const { skipAuth = false, ...requestOptions } = options
  const session = getSession()
  const headers = new Headers(requestOptions.headers || {})

  if (!skipAuth && session?.token) {
    headers.set('Authorization', `Bearer ${session.token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestOptions,
    headers
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = Array.isArray(data.message) ? data.message.join(' ') : data.message
    throw new Error(message || 'Request failed.')
  }

  return data
}

function getSession() {
  try {
    const raw = sessionStorage.getItem('agentflow_auth') || localStorage.getItem('agentflow_auth')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
