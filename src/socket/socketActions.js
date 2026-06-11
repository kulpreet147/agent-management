import { io } from 'socket.io-client'
import { getAllAccountsAsync } from '../redux/accountSlice.js'
import { getAllAgentsAsync } from '../redux/agentSlice.js'
import { Logout } from '../redux/authSlice.js'
import { ClearRealtimeAlert, ShowRealtimeAlert } from '../redux/realtimeSlice.js'
import { auth } from '../utils/auth.js'

const BLOCKED_ADMIN_MESSAGE =
  'Your administrator access has been suspended by the master administrator. Click this alert to sign out securely.'
const ADMIN_EVENTS = [
  'admin:created',
  'admin:activated',
  'admin:blocked',
  'admin:unblocked',
  'admin:updated',
  'admin:refresh',
]
const AGENT_EVENTS = [
  'agent:activated',
  'agent:notification',
  'agent:updated',
  'agent:refresh',
]
const LEAD_EVENTS = ['lead:assigned', 'lead:reassigned', 'lead:updated', 'lead:status_updated', 'lead:refresh']
const REALTIME_EVENTS = [...ADMIN_EVENTS, ...AGENT_EVENTS, ...LEAD_EVENTS]

let socket
let channel
let socketToken = null
let sessionGuardTimer = null

function getSocketUrl() {
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000/api'
  return import.meta.env.VITE_SOCKET_URL || apiBase.replace(/\/api\/?$/, '')
}

function createSocket(session = auth.get()) {
  return io(getSocketUrl(), {
    autoConnect: true,
    transports: ['websocket', 'polling'],
    auth: session?.token ? { token: session.token } : undefined,
  })
}

function getRealtimeChannel() {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
    return null
  }

  if (!channel) {
    channel = new BroadcastChannel('agentflow-admin-realtime')
  }

  return channel
}

export function getRealtimeSocket() {
  if (!socket) {
    socket = createSocket()
    socketToken = auth.get()?.token || null
  }

  if (!socket.connected) {
    socket.connect()
  }

  return socket
}

export function disconnectRealtimeSocket() {
  stopSessionGuard()

  if (socket) {
    socket.disconnect()
    socket = undefined
  }

  socketToken = null
}

export function syncRealtimeSession(session) {
  const nextToken = session?.token || null

  if (!nextToken) {
    disconnectRealtimeSocket()
    return null
  }

  if (!socket || socketToken !== nextToken) {
    disconnectRealtimeSocket()
    socket = createSocket(session)
    socketToken = nextToken
  }

  if (!socket.connected) {
    socket.connect()
  }

  return socket
}

export function stopSessionGuard() {
  if (sessionGuardTimer) {
    window.clearInterval(sessionGuardTimer)
    sessionGuardTimer = null
  }
}

export function shouldForceLogoutFromPayload(payload, session) {
  return (
    session?.role === 'admin' &&
    payload?.targetUserId === session.id &&
    payload?.forceLogout !== false
  )
}

export function createBlockedAdminAlert(payload) {
  return {
    variant: 'danger',
    title: payload?.title || 'Administrator access suspended',
    message: payload?.message || BLOCKED_ADMIN_MESSAGE,
    actionType: 'logout',
  }
}

export function showBlockedAdminAlert({ dispatch, payload }) {
  dispatch(ShowRealtimeAlert(createBlockedAdminAlert(payload)))
  disconnectRealtimeSocket()
}

export async function validateRealtimeSession({ dispatch, navigate, session }) {
  if (!session?.token || session.role !== 'admin') return false

  try {
    const response = await auth.getCurrentUser()
    const currentUser = response?.user
    const isBlocked = Boolean(
      currentUser?.isBlocked ||
        currentUser?.adminStatus === 'blocked' ||
        currentUser?.status === 'blocked',
    )

    if (isBlocked) {
      showBlockedAdminAlert({ dispatch, payload: currentUser })
      return true
    }
  } catch (error) {
    if (/401|403|denied|blocked|invalid|expired/i.test(error?.message || '')) {
      showBlockedAdminAlert({ dispatch })
      return true
    }
  }

  return false
}

export function startSessionGuard({ dispatch, navigate, session }) {
  stopSessionGuard()

  if (!session?.token || session.role !== 'admin') {
    return () => {}
  }

  const runValidation = () => {
    validateRealtimeSession({ dispatch, navigate, session })
  }

  runValidation()
  sessionGuardTimer = window.setInterval(runValidation, 15000)
  window.addEventListener('focus', runValidation)

  return () => {
    stopSessionGuard()
    window.removeEventListener('focus', runValidation)
  }
}

export function subscribeToRealtimeActions(handler) {
  const instance = getRealtimeSocket()
  const listeners = REALTIME_EVENTS.map((eventName) => {
    const listener = (payload) => handler(eventName, payload)
    instance.on(eventName, listener)
    return { eventName, listener }
  })

  const broadcastChannel = getRealtimeChannel()
  const channelListener = (event) => {
    if (!event?.data?.eventName) return
    handler(event.data.eventName, event.data.payload)
  }

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', channelListener)
  }

  return () => {
    listeners.forEach(({ eventName, listener }) => {
      instance.off(eventName, listener)
    })

    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', channelListener)
    }
  }
}

export function handleSocketRealtimeAction({
  dispatch,
  eventName,
  navigate,
  payload,
  session,
}) {
  if (!session) return

  if (LEAD_EVENTS.includes(eventName)) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('lead:realtime-update', {
          detail: { eventName, payload, leadId: payload?.leadId || payload?.id, leadUuid: payload?.id },
        }),
      )
    }
    return
  }

  if (session.role === 'agent' && eventName === 'agent:notification') {
    const nextPatch = {}

    if (payload?.type === 'account_activated') {
      nextPatch.accountActivationStatus = 1
      nextPatch.status = 'active'
    }

    if (typeof payload?.onboardingStatus !== 'undefined') {
      nextPatch.onboardingStatus = payload.onboardingStatus
    }

    if (Object.keys(nextPatch).length > 0) {
      auth.update(nextPatch)
    }
  }

  if (session.role === 'master_admin' && eventName.startsWith('admin:')) {
    dispatch(getAllAccountsAsync('admin'))
  }

  if (session.role === 'admin' && eventName.startsWith('agent:')) {
    dispatch(getAllAgentsAsync())
  }

  if (eventName === 'admin:activated' && session.role === 'master_admin') {
    dispatch(
      ShowRealtimeAlert({
        variant: 'success',
        title: 'Administrator activated',
        message: 'An administrator finished account setup and is now active.',
      }),
    )
    return
  }

  if (
    eventName === 'admin:blocked' &&
    shouldForceLogoutFromPayload(payload, session)
  ) {
    showBlockedAdminAlert({ dispatch, payload })
    return
  }

  if (eventName === 'agent:activated' && session.role === 'admin') {
    dispatch(
      ShowRealtimeAlert({
        variant: 'success',
        title: 'Agent activated',
        message: payload?.email
          ? `Agent account activated for ${payload.email}.`
          : 'An agent finished account setup and is now active.',
      }),
    )
    return
  }

  if (eventName === 'agent:notification' && session.role === 'agent') {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('agent:realtime-update', {
          detail: { eventName, payload },
        }),
      )
    }

    dispatch(
      ShowRealtimeAlert({
        variant:
          payload?.type === 'approved' || payload?.type === 'account_activated'
            ? 'success'
            : payload?.type === 'rejected' || payload?.type === 'revision_requested'
              ? 'warning'
              : 'info',
        title: payload?.title || 'Agent update',
        message: payload?.message || 'Your onboarding status has been updated.',
      }),
    )
    return
  }

  if (eventName === 'agent:updated' && session.role === 'admin') {
    const onboardingStatus = Number(payload?.onboardingStatus || payload?.agent?.onboardingStatus || 0)
    const updateType = payload?.updateType
    const agentEmail = payload?.email || payload?.agent?.email || 'the agent'

    if (updateType === 'registration_details_completed') {
      dispatch(
        ShowRealtimeAlert({
          variant: 'info',
          title: 'Agent registration updated',
          message: `${agentEmail} completed registration details and is ready for document signing.`,
        }),
      )
      return
    }

    if (updateType === 'document_signed') {
      dispatch(
        ShowRealtimeAlert({
          variant: 'info',
          title: 'Agent documents submitted',
          message: payload?.documentName
            ? `${payload.documentName} was submitted by ${agentEmail}.`
            : `A document was submitted by ${agentEmail}.`,
        }),
      )
      return
    }

    if (updateType === 'onboarding_status_updated' && onboardingStatus === 3) {
      dispatch(
        ShowRealtimeAlert({
          variant: 'info',
          title: 'Agent registration completed',
          message: `${agentEmail} completed registration and moved to document signing.`,
        }),
      )
      return
    }

    if (updateType === 'onboarding_status_updated' && onboardingStatus === 4) {
      dispatch(
        ShowRealtimeAlert({
          variant: 'warning',
          title: 'Agent moved to under review',
          message: `${agentEmail} completed document signing and moved to review.`,
        }),
      )
      return
    }

    if (updateType === 'onboarding_status_updated' && onboardingStatus === 5) {
      dispatch(
        ShowRealtimeAlert({
          variant: 'success',
          title: 'Agent ready for MGA',
          message: `${agentEmail} is ready for MGA.`,
        }),
      )
    }
  }
}

export function handleRealtimeAlertAction({ alert, dispatch, navigate }) {
  if (!alert) return

  if (alert.actionType === 'logout') {
    auth.setLogoutNotice({
      variant: alert.variant,
      title: alert.title,
      message: alert.message,
    })
    disconnectRealtimeSocket()
    dispatch(ClearRealtimeAlert())
    dispatch(Logout())
    navigate('/login', { replace: true })
    return
  }

  dispatch(ClearRealtimeAlert())
}

export function emitRealtimeAction(eventName, payload) {
  const instance = getRealtimeSocket()
  instance.emit(eventName, payload)
  const broadcastChannel = getRealtimeChannel()
  broadcastChannel?.postMessage({ eventName, payload })
}
