import { apiRequest } from './api.js'

const KEY = 'agentflow_auth'

export const auth = {
  async login({ email, password }) {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    })

    const session = {
      email: data.user.email,
      role: data.user.role,
      name: data.user.name,
      token: data.accessToken,
      loggedInAt: new Date().toISOString()
    }

    localStorage.setItem(KEY, JSON.stringify(session))
    return session
  },
  logout() {
    localStorage.removeItem(KEY)
  },
  get() {
    try {
      const raw = localStorage.getItem(KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },
  isAuthenticated() {
    return !!this.get()
  }
}
