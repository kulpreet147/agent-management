// Promise-based confirmation / prompt dialog. A single <ConfirmHost/> mounted at
// the app root subscribes here and renders a professional modal.
//
//   if (await confirmDialog({ title, message })) { ... }            // confirm
//   const note = await confirmDialog({ message, input: {...} })     // prompt -> string|null

let subscriber = null
let activeResolve = null

export function _subscribeConfirm(fn) {
  subscriber = fn
  return () => {
    if (subscriber === fn) subscriber = null
  }
}

export function confirmDialog(options = {}) {
  return new Promise((resolve) => {
    if (!subscriber) {
      // Graceful fallback if the host isn't mounted yet.
      if (options.input) {
        resolve(window.prompt(options.message || '') )
      } else {
        resolve(window.confirm(options.message || ''))
      }
      return
    }
    activeResolve = resolve
    subscriber({
      open: true,
      title: options.title || 'Please confirm',
      message: options.message || '',
      confirmText: options.confirmText || (options.input ? 'Submit' : 'Confirm'),
      cancelText: options.cancelText || 'Cancel',
      variant: options.variant || 'primary',
      input: options.input || null,
    })
  })
}

export function _resolveConfirm(value) {
  const resolve = activeResolve
  activeResolve = null
  if (subscriber) subscriber({ open: false })
  if (resolve) resolve(value)
}
