import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { getOverdueFollowUps, getUnworkedLeads } from '../utils/leads.js'
import { createNotification } from '../utils/notifications.js'
import { addRealtimeNotification, fetchUnreadCount, fetchNotifications } from '../redux/notificationSlice.js'

const NOTIFIED_IDS_KEY = 'af_notified_followups'
const UNWORKED_NOTIFIED_KEY = 'af_notified_unworked'

function getNotifiedIds() {
  try {
    const raw = sessionStorage.getItem(NOTIFIED_IDS_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch { return new Set() }
}

function addNotifiedId(id) {
  try {
    const ids = getNotifiedIds()
    ids.add(id)
    sessionStorage.setItem(NOTIFIED_IDS_KEY, JSON.stringify([...ids]))
  } catch {}
}

function getUnworkedNotifiedCount() {
  try {
    return Number(sessionStorage.getItem(UNWORKED_NOTIFIED_KEY)) || 0
  } catch { return 0 }
}

function setUnworkedNotifiedCount(count) {
  try {
    sessionStorage.setItem(UNWORKED_NOTIFIED_KEY, String(count))
  } catch {}
}

export default function NotificationChecker() {
  const dispatch = useDispatch()
  const session = useSelector((s) => s.auth.session)

  useEffect(() => {
    if (!session?.token) return

    dispatch(fetchNotifications({ limit: 50 }))
    dispatch(fetchUnreadCount())
  }, [dispatch, session?.token])

  useEffect(() => {
    if (!session?.token) return

    const check = async () => {
      try {
        const data = await getOverdueFollowUps().catch(() => [])
        const overdueList = Array.isArray(data) ? data : []
        const notifiedIds = getNotifiedIds()

        for (const fu of overdueList) {
          const fuId = fu.id || fu._id
          if (!fuId || notifiedIds.has(fuId)) continue

          const leadName = fu.leadName || `${fu.leadFirstName || ''} ${fu.leadLastName || ''}`.trim() || 'a lead'
          const typeLabel = fu.type || fu.activityType || 'Follow-up'

          addNotifiedId(fuId)
          try {
            const created = await createNotification({
              type: 'follow_up_due',
              title: 'Overdue Follow-up',
              message: `${typeLabel} with ${leadName}${fu.scheduledAt ? ` at ${new Date(fu.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : ''}`,
              recipientId: session.id,
              leadId: fu.leadId,
              link: session?.role === 'agent' ? `/agent/leads/${fu.leadId}` : `/admin/leads/${fu.leadId}`,
            })
            if (created?.id || created?._id) {
              dispatch(addRealtimeNotification(created))
            }
          } catch {}
        }

        if (overdueList.length > 0) {
          dispatch(fetchUnreadCount())
        }

        if (session?.role !== 'agent') {
          try {
            const unworked = await getUnworkedLeads(7).catch(() => [])
            const unworkedList = Array.isArray(unworked) ? unworked : []
            const prevNotified = getUnworkedNotifiedCount()
            if (unworkedList.length > 0 && unworkedList.length > prevNotified) {
              setUnworkedNotifiedCount(unworkedList.length)
              try {
                const created = await createNotification({
                  type: 'unworked_lead',
                  title: 'Unworked Leads',
                  message: `${unworkedList.length} lead(s) have not been worked in 7+ days.`,
                  recipientId: session.id,
                })
                if (created?.id || created?._id) {
                  dispatch(addRealtimeNotification(created))
                }
              } catch {}
            }
          } catch {}
        }
      } catch {}
    }

    check()
    const interval = setInterval(check, 30000)
    return () => clearInterval(interval)
  }, [dispatch, session?.token, session?.role, session?.id])

  return null
}
