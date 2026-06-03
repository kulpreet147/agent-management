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
  BriefcaseBusiness
} from 'lucide-react'

import { auth } from '../utils/auth.js'
import CommonHeader from '../components/CommonHeader.jsx'

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
  const session = auth.get()
  const nav = variant === 'master' ? masterNav : adminNav
  const location = useLocation()


  const handleLogout = () => {
    auth.logout()
    navigate('/login')
  }

  return (
    <div className="fixed inset-0 overflow-hidden flex bg-slate-100">
      {/* SIDEBAR */}
      <aside className="h-full w-64 shrink-0 bg-brand-950 text-slate-200 flex flex-col">
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-brand-600 text-white grid place-items-center shadow-sm">
              <Shield size={18} />
            </div>
            <div>
              <div className="text-white font-bold tracking-tight">AgentFlow</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400">
                {variant === 'master' ? 'System Portal' : 'Management Portal'}
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {nav.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.to
            return (
              <Link
                key={item.label}
                to={item.to}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm shadow-brand-900/40'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >

                <Icon size={17} />
                {item.label}
              </Link>
            )
          })}
        </nav>


        {/* User card */}
        <div className="p-3 border-t border-white/5">
          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-white/5">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 grid place-items-center text-white text-xs font-bold">
              {(session?.name || 'U').slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">
                {session?.name || 'User'}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {session?.email || 'admin@agentflow.io'}
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Log out"
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <CommonHeader />

        <main className="flex-1 min-h-0 overflow-hidden overflow-x-hidden bg-slate-100 p-4 lg:p-5">
          {children}
        </main>
      </div>
    </div>
  )
}
