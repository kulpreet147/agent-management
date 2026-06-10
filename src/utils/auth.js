import { apiRequest } from './api.js'

const KEY = 'agentflow_auth'
const NOTICE_KEY = 'agentflow_auth_notice'
const ADMIN_BACKUP_KEY = 'agentflow_admin_backup'

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
      accountActivationStatus: data.user.accountActivationStatus,
      status: data.user.status,
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

  async getCurrentUser() {
    return apiRequest('/auth/me')
  },

  logout() {
    getStorage().removeItem(KEY)
    window.localStorage.removeItem(KEY)
  },
  setLogoutNotice(notice) {
    try {
      if (!notice) return
      getStorage().setItem(NOTICE_KEY, JSON.stringify(notice))
    } catch {}
  },
  consumeLogoutNotice() {
    try {
      const raw = getStorage().getItem(NOTICE_KEY)
      getStorage().removeItem(NOTICE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
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
  },

  // --- Act on behalf (admin impersonation) --------------------------------
  async impersonateAgent(agentId) {
    return apiRequest(`/auth/impersonate/${agentId}`, { method: 'POST' })
  },
  // Swap the active session to the agent's impersonation session, backing up
  // the admin's own session so it can be restored on exit.
  startImpersonation(data) {
    const current = this.get()
    if (current && !current.impersonatedBy) {
      getStorage().setItem(ADMIN_BACKUP_KEY, JSON.stringify(current))
    }
    const session = {
      id: data.user.id,
      publicId: data.user.publicId,
      email: data.user.email,
      role: data.user.role,
      name: data.user.name,
      onboardingStatus: data.user.onboardingStatus,
      accountActivationStatus: data.user.accountActivationStatus,
      status: data.user.status,
      signedDocuments: data.user.signedDocuments || {},
      token: data.accessToken,
      impersonatedBy: data.impersonatedBy || null,
      loggedInAt: new Date().toISOString()
    }
    getStorage().setItem(KEY, JSON.stringify(session))
    window.localStorage.removeItem(KEY)
    return session
  },
  // End the delegation session (best-effort audit) and restore the admin session.
  async stopImpersonation() {
    try {
      await apiRequest('/auth/impersonate/end', { method: 'POST' })
    } catch {}
    const backup = getStorage().getItem(ADMIN_BACKUP_KEY)
    getStorage().removeItem(ADMIN_BACKUP_KEY)
    if (backup) {
      getStorage().setItem(KEY, backup)
    } else {
      getStorage().removeItem(KEY)
    }
    window.localStorage.removeItem(KEY)
    return backup ? JSON.parse(backup) : null
  }
}
