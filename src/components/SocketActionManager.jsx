import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  disconnectRealtimeSocket,
  handleSocketRealtimeAction,
  startSessionGuard,
  subscribeToRealtimeActions,
  syncRealtimeSession,
} from '../socket/socketActions.js'

export default function SocketActionManager() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const session = useSelector((state) => state.auth.session)

  useEffect(() => {
    const socket = syncRealtimeSession(session)
    if (!socket) return undefined

    const stopGuard = startSessionGuard({ dispatch, navigate, session })
    const unsubscribe = subscribeToRealtimeActions((eventName, payload) => {
      handleSocketRealtimeAction({
        dispatch,
        eventName,
        navigate,
        payload,
        session,
      })
    })

    return () => {
      stopGuard()
      unsubscribe()
    }
  }, [dispatch, navigate, session])

  useEffect(() => () => disconnectRealtimeSocket(), [])

  return null
}
