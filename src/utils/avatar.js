// Shared helpers for resolving an agent's profile picture and rendering a
// consistent fallback avatar (deterministic gradient + initials).

export function resolveMediaUrl(url) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000/api'
  const origin = apiBase.replace(/\/api\/?$/, '')
  return `${origin}${url.startsWith('/') ? url : `/${url}`}`
}

export function readAvatarPathFromAgent(agent) {
  const avatar = agent?.documents?.profileAvatar
  if (!avatar) return ''
  if (avatar.fileName) return `/uploads/agents/${avatar.fileName}`
  if (avatar.path) {
    const normalized = String(avatar.path).replace(/\\/g, '/')
    const idx = normalized.indexOf('/uploads/')
    if (idx >= 0) return normalized.slice(idx)
  }
  return ''
}

// Returns a fully-qualified URL to the agent's profile picture, or '' if none.
export function getAgentAvatarUrl(agent) {
  const path = readAvatarPathFromAgent(agent)
  return path ? resolveMediaUrl(path) : ''
}

export function getInitials(name, fallback = 'AG') {
  if (!name) return fallback
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  const initials = parts.map((p) => p[0]?.toUpperCase()).slice(0, 2).join('')
  return initials || fallback
}

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#4f8ef7,#7c3aed)',
  'linear-gradient(135deg,#0ea5e9,#2563eb)',
  'linear-gradient(135deg,#10b981,#0d9488)',
  'linear-gradient(135deg,#f59e0b,#ea580c)',
  'linear-gradient(135deg,#ec4899,#be185d)',
  'linear-gradient(135deg,#8b5cf6,#6d28d9)',
  'linear-gradient(135deg,#14b8a6,#0891b2)',
  'linear-gradient(135deg,#f43f5e,#e11d48)',
]

// Picks a stable gradient for a given name so the same agent always gets the
// same colour across the app.
export function gradientForName(name) {
  const s = String(name || '')
  let hash = 0
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length]
}
