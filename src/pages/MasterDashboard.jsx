import { Plus } from 'lucide-react'
import StatCard from '../components/StatCard.jsx'
import StatusPill from '../components/StatusPill.jsx'
import { masterStats, auditLogs } from '../data/dummy.js'

export default function MasterDashboard() {
  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Overview</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time monitoring of administrative operations and agent lifecycle.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-sm shadow-brand-600/20 transition">
          <Plus size={16} />
          New Administrator
        </button>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
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

      {/* Audit log */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Global System Audit Logs</h2>
          <button className="text-sm text-brand-600 font-semibold hover:underline">
            View All Logs
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50/50">
                <th className="text-left font-semibold px-6 py-3">Timestamp</th>
                <th className="text-left font-semibold px-6 py-3">Administrator</th>
                <th className="text-left font-semibold px-6 py-3">Action Type</th>
                <th className="text-left font-semibold px-6 py-3">Entity Affected</th>
                <th className="text-left font-semibold px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.map((log, i) => (
                <tr key={i} className="hover:bg-slate-50/60 transition">
                  <td className="px-6 py-3.5 text-slate-600 tabular-nums">{log.timestamp}</td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 grid place-items-center text-white text-[10px] font-bold">
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
