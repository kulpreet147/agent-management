import { apiRequest } from './api.js'

export function getAccountActivities(accountType, accountId, params = {}) {
  const query = new URLSearchParams()
  if (params.page) query.set('page', params.page)
  if (params.limit) query.set('limit', params.limit)
  const qs = query.toString()
  return apiRequest(`/activities/${accountType}/${accountId}${qs ? `?${qs}` : ''}`)
}
