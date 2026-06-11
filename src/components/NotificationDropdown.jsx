import { useState, useEffect, useRef, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Bell, CheckCheck, Trash2, ExternalLink, RefreshCw, UserCheck, Calendar, Repeat, Clock, AlertTriangle, X } from 'lucide-react'
import { fetchNotifications, markRead, markAllRead, removeNotification, fetchUnreadCount } from '../redux/notificationSlice.js'
import { useNavigate } from 'react-router-dom'

const typeConfig = {
  lead_assigned: { icon: UserCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
  lead_reassigned: { icon: Repeat, color: 'text-amber-600', bg: 'bg-amber-50' },
  follow_up_due: { icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
  follow_up_reminder: { icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' },
  unworked_lead: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
}

export default function NotificationDropdown({ open, onClose, anchorRef }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { items, unreadCount, loading } = useSelector((s) => s.notifications)
  const dropdownRef = useRef(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 })

  useEffect(() => {
    if (open && anchorRef?.current) {
      const rect = anchorRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      })
    }
  }, [open, anchorRef])

  useEffect(() => {
    if (!open) return
    dispatch(fetchNotifications({ limit: 20 }))
    dispatch(fetchUnreadCount())

    const interval = setInterval(() => {
      dispatch(fetchUnreadCount())
    }, 30000)
    return () => clearInterval(interval)
  }, [open, dispatch])

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) && anchorRef?.current && !anchorRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose, anchorRef])

  const handleItemClick = useCallback(async (n) => {
    if (!n.readAt) {
      await dispatch(markRead(n.id)).unwrap()
    }
    if (n.link) navigate(n.link)
    onClose()
  }, [dispatch, navigate, onClose])

  const handleMarkAllRead = useCallback(async () => {
    await dispatch(markAllRead()).unwrap()
  }, [dispatch])

  const handleRemove = useCallback(async (e, id) => {
    e.stopPropagation()
    await dispatch(removeNotification(id)).unwrap()
  }, [dispatch])

  const timeAgo = (date) => {
    if (!date) return ''
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `${days}d ago`
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (!open) return null

  return (
    <div
      ref={dropdownRef}
      style={{ position: 'fixed', top: dropdownPosition.top, right: dropdownPosition.right, zIndex: 9999 }}
      className="w-[400px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-slate-600" />
          <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] text-center">{unreadCount}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="px-2.5 py-1.5 text-[11px] font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1">
              <CheckCheck size={13} /> Mark all read
            </button>
          )}
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={14} className="text-slate-400" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-[420px] overflow-y-auto">
        {loading && items.length === 0 ? (
          <div className="flex items-center justify-center py-10 gap-2 text-sm text-slate-500">
            <RefreshCw size={14} className="animate-spin" /> Loading...
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center">
            <Bell size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-slate-500">No notifications</p>
            <p className="text-xs text-slate-400 mt-0.5">You're all caught up!</p>
          </div>
        ) : (
          items.map((n) => {
            const config = typeConfig[n.type] || { icon: Bell, color: 'text-slate-600', bg: 'bg-slate-50' }
            const Icon = config.icon
            const isUnread = !n.readAt
            return (
              <div key={n.id} onClick={() => handleItemClick(n)}
                className={`px-5 py-3.5 flex items-start gap-3 cursor-pointer transition-colors border-b border-slate-100 last:border-0
                  ${isUnread ? 'bg-blue-50/40 hover:bg-blue-50' : 'hover:bg-slate-50'}`}>
                <div className={`mt-0.5 w-8 h-8 rounded-full ${config.bg} flex items-center justify-center shrink-0`}>
                  <Icon size={15} className={config.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm leading-snug ${isUnread ? 'font-bold text-slate-800' : 'text-slate-600'}`}>
                      {n.title}
                    </p>
                    {isUnread && <span className="mt-1 w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                  </div>
                  {n.message && (
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-slate-400">{timeAgo(n.createdAt)}</span>
                    {n.link && (
                      <span className="text-[10px] text-blue-600 font-semibold flex items-center gap-0.5">
                        <ExternalLink size={10} /> View
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={(e) => handleRemove(e, n.id)}
                  className="p-1 hover:bg-slate-200 rounded transition-colors shrink-0 opacity-0 group-hover:opacity-100 hover:opacity-100 mt-0.5">
                  <Trash2 size={12} className="text-slate-400" />
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}