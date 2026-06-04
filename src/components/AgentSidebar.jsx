import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, FileCheck2, BookOpenCheck, WalletCards, Settings, Users, LogOut, Shield, BriefcaseBusiness } from 'lucide-react'
import { auth } from '../utils/auth.js'

const navItems = [
  { icon: Home, label: 'Dashboard', path: '/agent/dashboard' },
  { icon: Users, label: 'Lead Management', path: '/agent/leads' },
  { icon: BriefcaseBusiness, label: 'Client Management', path: '/agent/clients' },
  { icon: FileCheck2, label: 'Documents', path: '/agent/documents' },
  { icon: BookOpenCheck, label: 'Training', path: '/agent/training' },
  { icon: WalletCards, label: 'Commissions', path: '/agent/commissions' },
  { icon: Settings, label: 'Settings', path: '/agent/settings' },
]

export default function AgentSidebar({ agentName, initials }) {
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    auth.logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-brand-950 text-slate-200">
      <div className="border-b border-white/5 p-5">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-white shadow-sm">
            <Shield size={18} />
          </div>
          <div>
            <div className="font-bold tracking-tight text-white">Insurely</div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Agent Portal</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-900/40'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={17} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-white/5 p-3">
        <div className="flex items-center gap-3 rounded-lg bg-white/5 p-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-xs font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-white">{agentName}</div>
            <div className="truncate text-[11px] text-slate-400">Active Agent</div>
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
      </div>
    </aside>
  )
}
