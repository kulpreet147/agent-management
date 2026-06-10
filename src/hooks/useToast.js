import { useDispatch } from 'react-redux'
import { ShowRealtimeAlert } from '../redux/realtimeSlice.js'

export function useToast() {
  const dispatch = useDispatch()

  const show = ({ variant = 'info', title, message }) => {
    dispatch(
      ShowRealtimeAlert({
        variant,
        title,
        message,
      }),
    )
  }

  return {
    show,
    success: (message, title = 'Success') => show({ variant: 'success', title, message }),
    error: (message, title = 'Something went wrong') => show({ variant: 'danger', title, message }),
    info: (message, title = 'Notice') => show({ variant: 'info', title, message }),
    warning: (message, title = 'Attention') => show({ variant: 'warning', title, message }),
  }
}
