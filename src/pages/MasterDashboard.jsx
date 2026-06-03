import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import StatCard from '../components/StatCard.jsx'
import StatusPill from '../components/StatusPill.jsx'
import { masterStats, auditLogs } from '../data/dummy.js'

export default function MasterDashboard() {
  const navigate = useNavigate()

  return (
    <div className="flex h-full min-h-0 flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Overview</h1>
          <p className="mt-1 text-sm text-slate-500">
            Real-time monitoring of administrative operations and agent lifecycle.
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {masterStats.map((s, i) => (
          <StatCard
            key={s.label}
            label={s.label}
            value={s.value}
            delta={s.delta}
            tone={s.tone}
            urgent={i === 4}
          />
        ))}
      </div>

      <div className="mt-6 min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="font-bold text-slate-900">Global System Audit Logs</h2>
          <button className="text-sm font-semibold text-brand-600 hover:underline">
            View All Logs
          </button>
        </div>

        <div className="h-full overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-slate-50/50 text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-6 py-3 text-left font-semibold">Timestamp</th>
                <th className="px-6 py-3 text-left font-semibold">Administrator</th>
                <th className="px-6 py-3 text-left font-semibold">Action Type</th>
                <th className="px-6 py-3 text-left font-semibold">Entity Affected</th>
                <th className="px-6 py-3 text-left font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.map((log, i) => (
                <tr key={i} className="transition hover:bg-slate-50/60">
                  <td className="px-6 py-3.5 tabular-nums text-slate-600">{log.timestamp}</td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-[10px] font-bold text-white">
                        {log.admin.initials}
                      </div>
                      <span className="font-medium text-slate-800">{log.admin.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 font-medium text-slate-800">{log.action}</td>
                  <td className="px-6 py-3.5 text-slate-600">{log.entity}</td>
                  <td className="px-6 py-3.5">
                    <StatusPill status={log.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
