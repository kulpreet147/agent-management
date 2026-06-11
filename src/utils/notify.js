import { store } from '../redux/store.js'
import { ShowRealtimeAlert } from '../redux/realtimeSlice.js'

// Module-level toast helper that reuses the app's RealtimeAlertBar renderer.
// Works anywhere (components, utils, async callbacks) — no hook required.
function emit(variant, title, message) {
  store.dispatch(
    ShowRealtimeAlert({
      variant,
      title,
      message: message == null ? '' : String(message),
    }),
  )
}

export const notify = {
  success: (message, title = 'Success') => emit('success', title, message),
  error: (message, title = 'Something went wrong') => emit('danger', title, message),
  info: (message, title = 'Notice') => emit('info', title, message),
  warning: (message, title = 'Attention') => emit('warning', title, message),
}

export default notify
