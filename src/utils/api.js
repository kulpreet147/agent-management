const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

export async function apiRequest(path, options = {}) {
  const session = getSession()
  const headers = new Headers(options.headers || {})

  if (session?.token) {
    headers.set('Authorization', `Bearer ${session.token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
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
    const raw = localStorage.getItem('agentflow_auth')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
