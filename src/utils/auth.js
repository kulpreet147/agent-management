import { apiRequest } from './api.js'

const KEY = 'agentflow_auth'

function getStorage() {
  return window.sessionStorage
}

export const auth = {
  async login({ email, password, loginAs = 'admin' }) {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password, loginAs })
    })

    const session = {
      id: data.user.id,
      email: data.user.email,
      role: data.user.role,
      name: data.user.name,
      onboardingStatus: data.user.onboardingStatus,
      signedDocuments: data.user.signedDocuments || {},
      token: data.accessToken,
      loggedInAt: new Date().toISOString()
    }

    getStorage().setItem(KEY, JSON.stringify(session))
    window.localStorage.removeItem(KEY)
    return session
  },
  logout() {
    getStorage().removeItem(KEY)
    window.localStorage.removeItem(KEY)
  },
  get() {
    try {
      const raw = getStorage().getItem(KEY)
      if (raw) return JSON.parse(raw)

      const legacyRaw = window.localStorage.getItem(KEY)
      if (!legacyRaw) return null

      const legacySession = JSON.parse(legacyRaw)
      getStorage().setItem(KEY, JSON.stringify(legacySession))
      window.localStorage.removeItem(KEY)
      return legacySession
    } catch {
      return null
    }
  },
  update(patch) {
    const session = this.get()
    if (!session) return null
    const nextSession = { ...session, ...patch }
    getStorage().setItem(KEY, JSON.stringify(nextSession))
    window.localStorage.removeItem(KEY)
    return nextSession
  },
  isAuthenticated() {
    return !!this.get()
  }
}
