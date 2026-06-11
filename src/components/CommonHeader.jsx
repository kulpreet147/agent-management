import { Bell, Search, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../hooks/useToast.js'
import { auth } from '../utils/auth.js'

function getInitials(name) {
  return (name || 'User')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function CommonHeader({
  title,
  leading,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  compact = false,
}) {
  const navigate = useNavigate()
  const toast = useToast()
  const session = auth.get()
  const initials = getInitials(session?.name)
  const showSearch = typeof onSearchChange === 'function'

  const showUnderImplementation = () => {
    toast.info('This section is still under implementation.', 'Coming Soon')
  }

  const handleProfileClick = () => {
    if (session?.role === 'agent') {
      navigate('/agent/profile')
      return
    }
    showUnderImplementation()
  }

  const handleSettingsClick = () => {
    if (session?.role === 'master_admin') {
      navigate('/master/settings')
      return
    }
    showUnderImplementation()
  }

  return (
    <header className={`${compact ? 'h-14' : 'h-16'} shrink-0 border-b border-slate-200 bg-white px-6`}>
      <div className="flex h-full items-center gap-4">
        {leading}
        {title ? <div className="shrink-0 text-sm font-bold text-slate-900">{title}</div> : null}

        {showSearch ? (
          <div className="relative w-full max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 w-full rounded-md border border-slate-300 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white"
            />
          </div>
        ) : null}

        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            onClick={showUnderImplementation}
            title="Notifications"
            className="relative grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
          >
            <Bell size={17} />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>

          <button
            type="button"
            onClick={handleSettingsClick}
            title="Settings"
            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
          >
            <Settings size={17} />
          </button>

          <button
            type="button"
            onClick={handleProfileClick}
            title="Profile"
            className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-xs font-bold text-white transition hover:brightness-95"
          >
            {initials}
          </button>
        </div>
      </div>
    </header>
  )
}
