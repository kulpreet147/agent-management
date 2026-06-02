import { apiRequest } from './api.js'

function getResource(accountType = 'admin') {
  return accountType === 'agent' ? 'agents' : 'admins'
}

export function listAccounts(accountType = 'admin') {
  return apiRequest(`/${getResource(accountType)}`)
}

export function createAccountInvite(accountType = 'admin', payload) {
  return apiRequest(`/${getResource(accountType)}/invites`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
}

export function getAccountInvite(accountType = 'admin', token) {
  return apiRequest(`/${getResource(accountType)}/invites/${token}`)
}

export function activateAccountInvite(accountType = 'admin', token, password) {
  return apiRequest(`/${getResource(accountType)}/invites/${token}/activate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password }),
  })
}

export function setAccountBlocked(accountType = 'admin', accountId, isBlocked) {
  return apiRequest(`/${getResource(accountType)}/${accountId}/block`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ isBlocked }),
  })
}
