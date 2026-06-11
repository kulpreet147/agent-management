import { AlertTriangle, BellRing, CheckCircle2, X } from 'lucide-react'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { ClearRealtimeAlert } from '../redux/realtimeSlice.js'
import { handleRealtimeAlertAction } from '../socket/socketActions.js'

const styles = {
  danger:
    'border-red-200 bg-red-50 text-red-800',
  warning:
    'border-amber-200 bg-amber-50 text-amber-800',
  success:
    'border-emerald-200 bg-emerald-50 text-emerald-800',
  info:
    'border-blue-200 bg-blue-50 text-blue-800',
}

const icons = {
  danger: AlertTriangle,
  warning: BellRing,
  success: CheckCircle2,
  info: BellRing,
}

export default function RealtimeAlertBar() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const alert = useSelector((state) => state.realtime.activeAlert)

  useEffect(() => {
    if (!alert || alert.actionType === 'logout') return undefined

    const timer = window.setTimeout(() => {
      dispatch(ClearRealtimeAlert())
    }, 3500)

    return () => window.clearTimeout(timer)
  }, [alert, dispatch])

  if (!alert) return null

  const Icon = icons[alert.variant] || BellRing

  if (alert.actionType === 'logout') {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4">
        <div className={`w-full max-w-lg rounded-3xl border px-6 py-5 shadow-xl ${styles[alert.variant] || styles.info}`}>
          <div className="flex items-start gap-3">
            <Icon size={22} className="mt-0.5 shrink-0" />
            <div>
              <div className="text-base font-semibold">{alert.title}</div>
              <div className="mt-2 text-sm leading-6">{alert.message}</div>
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={() => handleRealtimeAlertAction({ alert, dispatch, navigate })}
              className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 active:bg-red-800"
            >
              Sign Out Securely
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`realtime-toast fixed top-3 right-4 z-[1200] flex w-[calc(100%-2rem)] max-w-sm items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-left shadow-lg ${styles[alert.variant] || styles.info}`}
    >
      <div className="flex items-start gap-3">
      <Icon size={18} className="mt-0.5 shrink-0" />
      <div>
        <div className="text-sm font-semibold">{alert.title}</div>
        <div className="mt-1 text-sm">{alert.message}</div>
      </div>
      </div>
      <button
        type="button"
        onClick={() => handleRealtimeAlertAction({ alert, dispatch, navigate })}
        className="rounded-full p-1 text-current/70 transition hover:bg-white/40 hover:text-current"
        aria-label="Close alert"
      >
        <X size={16} />
      </button>
    </div>
  )
}
