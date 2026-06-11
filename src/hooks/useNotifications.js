import { useCallback } from 'react'
import { createNotification } from '../utils/notifications.js'

export function useNotify() {
  const notify = useCallback(async ({ type, title, message, recipientId, link, leadId }) => {
    try {
      return await createNotification({ type, title, message, recipientId, link, leadId })
    } catch {
      // fail silently — notification creation should never block the primary action
    }
  }, [])

  return notify
}
