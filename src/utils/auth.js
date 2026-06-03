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
      publicId: data.user.publicId,
      email: data.user.email,
      role: data.user.role,
      name: data.user.name,
      onboardingStatus: data.user.onboardingStatus,
      signedDocuments: data.user.signedDocuments || {},
      token: data.accessToken,
      loggedInAt: new Date().toISOString()
    }

    const isBlocked =
      session.role === 'admin' &&
      Boolean(data.user.isBlocked || data.user.blocked || data.user.status === 'blocked')

    if (isBlocked) {
      throw new Error('Your access is denied by master admin.')
    }

    getStorage().setItem(KEY, JSON.stringify(session))
    window.localStorage.removeItem(KEY)
    return session
  },

  async requestPasswordReset({ email, loginAs = 'admin' }) {
    const role = loginAs === 'agent' ? 'agent' : 'admin'
    return apiRequest('/auth/password-reset', {
      method: 'POST',
      skipAuth: true,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, loginAs: role })
    })
  },

  async validatePasswordResetToken(token) {
    return apiRequest(`/auth/password-reset/${token}`, { skipAuth: true })
  },

  async resetPassword({ token, password }) {
    return apiRequest(`/auth/password-reset/${token}`, {
      method: 'PATCH',
      skipAuth: true,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password })
    })
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
