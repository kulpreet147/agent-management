import { apiRequest } from './api.js'

export function createNotification(data) {
  return apiRequest('/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export function getNotifications(params = {}) {
  const query = new URLSearchParams()
  if (params.page) query.set('page', params.page)
  if (params.limit) query.set('limit', params.limit)
  if (params.unreadOnly) query.set('unreadOnly', 'true')
  const qs = query.toString()
  return apiRequest(`/notifications${qs ? `?${qs}` : ''}`)
}

export function getUnreadCount() {
  return apiRequest('/notifications/unread-count')
}

export function markNotificationRead(id) {
  return apiRequest(`/notifications/${id}/read`, { method: 'PATCH' })
}

export function markAllNotificationsRead() {
  return apiRequest('/notifications/read-all', { method: 'POST' })
}

export function deleteNotification(id) {
  return apiRequest(`/notifications/${id}`, { method: 'DELETE' })
}
