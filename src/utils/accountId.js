export function formatAccountId(prefix, publicId) {
  if (!publicId) return ''
  return `${prefix}-${String(publicId)}`
}
