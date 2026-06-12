import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import {
  Shield,
  LayoutDashboard,
  Users,
  Settings,
  ShieldCheck,
  LogOut,
  TrendingUp,
  Activity,
  BriefcaseBusiness,
  Menu,
  SquareChevronLeft,
} from 'lucide-react'
import { useDispatch } from 'react-redux'

import { auth } from '../utils/auth.js'
import { Logout } from '../redux/authSlice.js'
import CommonHeader from '../components/CommonHeader.jsx'
import SidebarTip from '../components/SidebarTip.jsx'

// Shared with the agent sidebar so the rail behaves the same across portals.
const COLLAPSE_KEY = 'sidebar_collapsed'

const masterNav = [
  { label: 'Dashboard', icon: LayoutDashboard, active: true, to: '/master' },
  {
    label: 'Admin Management',
    icon: Users,
    to: '/master/admin-management'
  },
  { label: 'Settings', icon: Settings, to: '/master/settings' }
]

const adminNav = [
  { label: 'Dashboard', icon: LayoutDashboard, active: true, to: '/admin' },
  { label: 'Agent Management', icon: Users, to: '/admin/agents' },
  { label: 'Lead Management', icon: TrendingUp, to: '/admin/leads' },
  { label: 'Client Management', icon: BriefcaseBusiness, to: '/admin/clients' },
  { label: 'Policy Management', icon: ShieldCheck, to: '/admin/policies' },
  { label: 'Analytics', icon: Activity, to: '/admin/analytics' },
]


export default function DashboardLayout({ variant = 'master', children }) {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const session = auth.get()
  const nav = variant === 'master' ? masterNav : adminNav
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return window.localStorage.getItem(COLLAPSE_KEY) === '1'
    } catch {
      return false
    }
  })

  const userName = session?.name || 'User'
  const userEmail = session?.email || 'admin@agentflow.io'
  const userInitials = userName.slice(0, 2).toUpperCase()

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

  const handleLogout = () => {
    dispatch(Logout())
    navigate('/login')
  }

  return (
    <div className="fixed inset-0 overflow-hidden flex bg-slate-100">
      {/* SIDEBAR */}
      <aside
        className={`h-full shrink-0 bg-brand-950 text-slate-200 flex flex-col transition-[width] duration-200 ${
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
              <div className="h-9 w-9 rounded-lg bg-brand-600 text-white grid place-items-center shadow-sm">
                <Shield size={18} />
              </div>
              <div className="min-w-0">
                <div className="text-white font-bold tracking-tight">Insurely</div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400">
                  {variant === 'master' ? 'System Portal' : 'Management Portal'}
                </div>
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

        <nav className="flex-1 p-3 space-y-1">
          {nav.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.to
            return (
              <Link
                key={item.label}
                to={item.to}
                title={collapsed ? undefined : item.label}
                className={`group relative w-full flex items-center py-2.5 rounded-lg text-sm font-medium transition ${
                  collapsed ? 'justify-center px-0' : 'gap-3 px-3'
                } ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm shadow-brand-900/40'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={17} className="shrink-0" />
                {!collapsed && item.label}
                {collapsed && <SidebarTip>{item.label}</SidebarTip>}
              </Link>
            )
          })}
        </nav>


        {/* User card */}
        <div className={`border-t border-white/5 ${collapsed ? 'p-2' : 'p-3'}`}>
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <div className="group relative h-9 w-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 grid place-items-center text-white text-xs font-bold">
                {userInitials}
                <SidebarTip>
                  {userName} · {userEmail}
                </SidebarTip>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Log out"
                className="group relative grid h-8 w-8 place-items-center rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <LogOut size={15} />
                <SidebarTip>Log out</SidebarTip>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-white/5">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 grid place-items-center text-white text-xs font-bold">
                {userInitials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate">{userName}</div>
                <div className="text-[11px] text-slate-400 truncate">{userEmail}</div>
              </div>
              <button
                onClick={handleLogout}
                title="Log out"
                className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <LogOut size={15} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <CommonHeader />

        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-slate-100 p-4 lg:p-5">
          {children}
        </main>
      </div>
    </div>
  )
}
