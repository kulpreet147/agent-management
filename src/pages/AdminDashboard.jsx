import { useNavigate } from 'react-router-dom'
import {
  Plus,
  SlidersHorizontal,
  AlertCircle,
  PenLine,
  ShieldCheck,
  MoreHorizontal,
  Search,
  FileText,
  X
} from 'lucide-react'
import StatCard from '../components/StatCard.jsx'
import StatusPill from '../components/StatusPill.jsx'
import {
  adminStats,
  onboardingPipeline,
  recentSubmissions,
  complianceAlerts,
  trainingCompletion,
  recentAgents
} from '../data/dummy.js'

const STAT_TONES = ['indigo', 'amber', 'slate', 'emerald', 'rose']

export default function AdminDashboard() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Overview</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time metrics for agent lifecycle management.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-sm font-semibold px-3.5 py-2.5 rounded-lg transition">
            <SlidersHorizontal size={15} />
            Filters
          </button>
          <button
            onClick={() => navigate('/admin/agent-record-creation')}
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-sm shadow-brand-600/20 transition"
          >
            <Plus size={16} />
            New Agent
          </button>

        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {adminStats.map((s, i) => (
          <StatCard key={s.label} label={s.label} value={s.value} delta={s.delta} tone={STAT_TONES[i]} />
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* LEFT — main column (2/3) */}
        <div className="xl:col-span-2 space-y-6">
          <RecentAgentsPanel />
        </div>

        {/* RIGHT — side column (1/3) */}
        <div className="space-y-6">
          <TrainingPanel />
        </div>
      </div>

    </div>
  )
}

/* ------------------------------- Sub panels ------------------------------- */

function OnboardingPanel() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <h2 className="font-bold text-slate-900">Onboarding Overview</h2>
        <button className="text-sm text-brand-600 font-semibold hover:underline">
          View Full Pipeline
        </button>
      </div>

      <div className="px-6 py-5 grid grid-cols-4 gap-4">
        {onboardingPipeline.map((p) => (
          <div key={p.label} className="text-center">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {p.label}
            </div>
            <div className="mt-2 text-3xl font-bold text-slate-900 tabular-nums">
              {String(p.value).padStart(2, '0')}
            </div>
          </div>
        ))}
      </div>

      <div className="px-6 pb-5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3">
          Recent Submissions
        </div>
        <div className="space-y-2">
          {recentSubmissions.map((s) => (
            <div
              key={s.app}
              className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50/60 transition"
            >
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 grid place-items-center text-white text-xs font-bold">
                {s.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-800">{s.name}</div>
                <div className="text-xs text-slate-500">
                  {s.app} • Submitted {s.submitted}
                </div>
              </div>
              <StatusPill status={s.tag} size="xs" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function RecentAgentsPanel() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <h2 className="font-bold text-slate-900">Recent Agent Activity</h2>
        <div className="flex items-center gap-1">
          <button className="h-8 w-8 grid place-items-center rounded-md text-slate-500 hover:bg-slate-100">
            <Search size={15} />
          </button>
          <button className="h-8 w-8 grid place-items-center rounded-md text-slate-500 hover:bg-slate-100">
            <MoreHorizontal size={15} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50/50">
              <th className="text-left font-semibold px-6 py-3">Agent Name</th>
              <th className="text-left font-semibold px-6 py-3">State</th>
              <th className="text-left font-semibold px-6 py-3">MGA Level</th>
              <th className="text-left font-semibold px-6 py-3">Status</th>
              <th className="text-left font-semibold px-6 py-3">Last Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {recentAgents.map((a) => (
              <tr key={a.email} className="hover:bg-slate-50/60 transition">
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 grid place-items-center text-white text-[10px] font-bold">
                      {a.initials}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800">{a.name}</div>
                      <div className="text-xs text-slate-500">{a.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-3.5 text-slate-600">{a.state}</td>
                <td className="px-6 py-3.5 text-slate-600">{a.level}</td>
                <td className="px-6 py-3.5">
                  <StatusPill status={a.status} />
                </td>
                <td className="px-6 py-3.5 text-slate-500">{a.updated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CompliancePanel() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h2 className="font-bold text-slate-900">Compliance Alerts</h2>
        <span className="text-[10px] font-bold tracking-wider text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
          3 TOTAL
        </span>
      </div>

      <div className="p-5 space-y-3">
        {complianceAlerts.map((alert, i) => (
          <AlertItem key={i} alert={alert} />
        ))}

        <button className="w-full text-sm text-brand-600 font-semibold hover:underline pt-1">
          View All Compliance Logs
        </button>
      </div>
    </div>
  )
}

function AlertItem({ alert }) {
  const icon = {
    critical: <AlertCircle size={16} className="text-red-600" />,
    warning: <PenLine size={16} className="text-amber-600" />,
    info: <ShieldCheck size={16} className="text-emerald-600" />
  }[alert.type]

  const bg = {
    critical: 'bg-red-50/60 border-red-100',
    warning: 'bg-amber-50/40 border-amber-100',
    info: 'bg-emerald-50/40 border-emerald-100'
  }[alert.type]

  return (
    <div className={`rounded-lg border p-3 ${bg}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-slate-900">{alert.title}</div>
          <div className="text-xs text-slate-600 mt-0.5 leading-relaxed">{alert.body}</div>
          {alert.actions && (
            <div className="flex flex-wrap gap-2 mt-2.5">
              {alert.actions.map((a) => (
                <button
                  key={a}
                  className={`text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded ${
                    a === 'Suspend Agent'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  } transition`}
                >
                  {a}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TrainingPanel() {
  const t = trainingCompletion
  return (
    <div className="rounded-xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white p-5 shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-700">Training Completion</div>
          <div className="mt-1 text-4xl font-bold text-brand-700 tabular-nums">{t.percent}%</div>
          <div className="text-xs text-slate-500 mt-0.5">{t.target}</div>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {t.modules.map((m) => (
          <div key={m.label}>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">{m.label}</span>
              <span className="font-bold text-slate-800 tabular-nums">{m.percent}%</span>
            </div>
            <div className="mt-1 h-1.5 bg-slate-200/70 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-600 rounded-full transition-all"
                style={{ width: `${m.percent}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <button className="mt-5 w-full bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold py-2.5 rounded-lg transition">
        ASSIGN MODULES
      </button>
    </div>
  )
}

function ReportCard() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card flex items-start gap-3">
      <div className="h-10 w-10 rounded-lg bg-brand-50 text-brand-600 grid place-items-center shrink-0">
        <FileText size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-slate-900">Q4 Compliance Report</div>
        <div className="text-xs text-slate-500 mt-0.5">Generated 10 mins ago</div>
      </div>
      <button className="text-slate-400 hover:text-slate-600">
        <X size={16} />
      </button>
    </div>
  )
}
