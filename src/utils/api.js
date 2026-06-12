const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000/api'

export async function apiRequest(path, options = {}) {
  const { skipAuth = false, body, ...rest } = options
  const headers = buildHeaders(rest.headers || {}, skipAuth)

  const fetchOptions = { ...rest, headers }

  if (body !== undefined && body !== null) {
    if (typeof body === 'object' && !(body instanceof FormData) && !(body instanceof Blob) && !(body instanceof URLSearchParams)) {
      fetchOptions.body = JSON.stringify(body)
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json')
      }
    } else {
      fetchOptions.body = body
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, fetchOptions)

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = Array.isArray(data.message) ? data.message.join(' ') : data.message
    throw new Error(message || 'Request failed.')
  }

  return data
}

export async function apiBinaryRequest(path, options = {}) {
  const { skipAuth = false, ...requestOptions } = options
  const headers = buildHeaders(requestOptions.headers, skipAuth)

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestOptions,
    headers
  })

  if (!response.ok) {
    let message = 'Request failed.'
    try {
      const data = await response.json()
      message = Array.isArray(data.message) ? data.message.join(' ') : data.message || message
    } catch {
      message = response.statusText || message
    }
    throw new Error(message)
  }

  return response.blob()
}

function buildHeaders(initialHeaders, skipAuth) {
  const session = getSession()
  const headers = new Headers(initialHeaders || {})

  if (!skipAuth && session?.token) {
    headers.set('Authorization', `Bearer ${session.token}`)
  }

  return headers
}

function getSession() {
  try {
    const raw = sessionStorage.getItem('agentflow_auth') || localStorage.getItem('agentflow_auth')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
