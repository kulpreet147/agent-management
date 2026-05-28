import { Users, UserCheck, Briefcase, Hourglass, AlertTriangle, Clock, CheckCircle2, FileX } from 'lucide-react'

const TONE = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', icon: Users },
  green: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: UserCheck },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', icon: Briefcase },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', icon: Hourglass },
  red: { bg: 'bg-red-50', text: 'text-red-600', icon: AlertTriangle },
  slate: { bg: 'bg-slate-100', text: 'text-slate-600', icon: Clock },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: CheckCircle2 },
  rose: { bg: 'bg-rose-50', text: 'text-rose-600', icon: FileX }
}

export default function StatCard({ label, value, delta, tone = 'blue', urgent = false }) {
  const t = TONE[tone] || TONE.blue
  const Icon = t.icon

  return (
    <div
      className={`relative rounded-xl border bg-white p-4 shadow-card overflow-hidden ${
        urgent ? 'border-red-200' : 'border-slate-200'
      }`}
    >
      {urgent && (
        <span className="absolute top-2 right-2 text-[10px] font-bold tracking-wider text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
          URGENT
        </span>
      )}
      {delta && !urgent && (
        <span
          className={`absolute top-3 right-3 text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded ${
            delta.startsWith('+')
              ? 'text-emerald-700 bg-emerald-50'
              : 'text-slate-600 bg-slate-100'
          }`}
        >
          {delta}
        </span>
      )}
      <div className={`h-9 w-9 rounded-lg ${t.bg} ${t.text} grid place-items-center`}>
        <Icon size={18} />
      </div>
      <div className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div className="mt-0.5 text-2xl font-bold text-slate-900 tabular-nums">{value}</div>
    </div>
  )
}
