import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, FileCheck2, BookOpenCheck, Settings, Users, LogOut, Shield, BriefcaseBusiness, Lock, BadgeCheck, Megaphone, Menu, SquareChevronLeft } from 'lucide-react'
import { useToast } from '../hooks/useToast.js'
import { auth } from '../utils/auth.js'
import SidebarTip from './SidebarTip.jsx'

const navItems = [
  { icon: Home, label: 'Dashboard', path: '/agent/dashboard' },
  { icon: Users, label: 'Lead Management', path: '/agent/leads' },
  { icon: BriefcaseBusiness, label: 'Client Management', path: '/agent/clients' },
  { icon: FileCheck2, label: 'Documents', path: '/agent/documents' },
  { icon: BadgeCheck, label: 'Licensing', path: '/agent/licensing' },
  { icon: Megaphone, label: 'Marketing', path: '/agent/marketing' },
  { icon: BookOpenCheck, label: 'Training', path: '/agent/training' },
  { icon: Settings, label: 'Settings', path: '/agent/settings' },
]

// Persist the collapsed preference so it stays consistent as each page mounts
// its own sidebar instance (there is no shared agent layout). Shared across all
// portals so the rail behaves the same everywhere.
const COLLAPSE_KEY = 'sidebar_collapsed'

export default function AgentSidebar({ agentName, initials }) {
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const session = auth.get()
  const isActiveAgent = Number(session?.accountActivationStatus) === 1
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return window.localStorage.getItem(COLLAPSE_KEY) === '1'
    } catch {
      return false
    }
  })
  const lockedSectionMessage =
    'Your account is not active yet. These sections will become available once your onboarding review is completed and your access is activated by the administrator.'
  const agentStatusLabel = isActiveAgent
    ? 'Active Agent'
    : session?.status === 'under_review'
      ? 'Under Review'
      : session?.status === 'ready_for_mga'
        ? 'Ready for MGA'
        : 'Onboarding In Progress'

  const toggleCollapsed = () => {
    setCollapsed((value) => {
      const next = !value
      try {
        window.localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0')
      } catch {
        // Preference persistence is best-effort.
      }
      return next
    })
  }

  const handleLogout = async () => {
    await auth.endSession()
    navigate('/login', { replace: true })
  }

  return (
    <aside
      className={`flex shrink-0 flex-col bg-brand-950 text-slate-200 transition-[width] duration-200 ${
        collapsed ? 'w-[68px]' : 'w-64'
      }`}
    >
      <div className={`border-b border-white/5 ${collapsed ? 'p-3' : 'p-5'}`}>
        {collapsed ? (
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label="Expand sidebar"
            aria-expanded={false}
            title="Expand sidebar"
            className="mx-auto grid h-9 w-9 place-items-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <Menu size={18} />
          </button>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-white shadow-sm">
              <Shield size={18} />
            </div>
            <div className="min-w-0">
              <div className="font-bold tracking-tight text-white">Insurely</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Agent Portal</div>
            </div>
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label="Collapse sidebar"
              aria-expanded
              title="Collapse sidebar"
              className="ml-auto grid h-8 w-8 place-items-center rounded-md text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              <SquareChevronLeft size={18} />
            </button>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          const isLocked = item.path !== '/agent/dashboard' && !isActiveAgent
          return (
            <Link
              key={item.path}
              to={isLocked ? location.pathname : item.path}
              onClick={(event) => {
                if (isLocked) {
                  event.preventDefault()
                  toast.warning(lockedSectionMessage, 'Section Locked')
                }
              }}
              className={`group relative flex w-full items-center rounded-lg py-2.5 text-sm font-medium transition ${
                collapsed ? 'justify-center px-0' : 'gap-3 px-3'
              } ${
                isLocked
                  ? 'text-slate-400 hover:bg-white/5'
                  : isActive
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-900/40'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
              aria-disabled={isLocked}
              title={collapsed ? undefined : isLocked ? 'This section unlocks after the agent account is activated.' : item.label}
            >
              <item.icon size={17} className="shrink-0" />
              {!collapsed && <span className="flex-1">{item.label}</span>}
              {!collapsed && isLocked ? <Lock size={14} className="text-slate-500" /> : null}
              {collapsed && (
                <SidebarTip>
                  {item.label}
                  {isLocked ? ' · Locked' : ''}
                </SidebarTip>
              )}
            </Link>
          )
        })}
      </nav>

      <div className={`border-t border-white/5 ${collapsed ? 'p-2' : 'p-3'}`}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div className="group relative grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-xs font-bold text-white">
              {initials}
              <SidebarTip>
                {agentName} · {agentStatusLabel}
              </SidebarTip>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="group relative grid h-8 w-8 place-items-center rounded-md text-slate-400 transition hover:bg-white/10 hover:text-white"
              aria-label="Log out"
            >
              <LogOut size={15} />
              <SidebarTip>Log out</SidebarTip>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-lg bg-white/5 p-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-xs font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-white">{agentName}</div>
              <div className="truncate text-[11px] text-slate-400">{agentStatusLabel}</div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
              title="Log out"
            >
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
