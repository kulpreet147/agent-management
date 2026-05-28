const STYLES = {
  Success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Critical: 'bg-red-50 text-red-700 border-red-200',
  Processing: 'bg-amber-50 text-amber-700 border-amber-200',
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Training: 'bg-slate-100 text-slate-700 border-slate-200',
  'Contract Expiring': 'bg-red-50 text-red-700 border-red-200',
  NEW: 'bg-blue-50 text-blue-700 border-blue-200'
}

export default function StatusPill({ status, size = 'sm' }) {
  const cls = STYLES[status] || 'bg-slate-100 text-slate-700 border-slate-200'
  const sz = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-[11px] px-2 py-0.5'
  return (
    <span className={`inline-flex items-center font-semibold uppercase tracking-wider border rounded ${cls} ${sz}`}>
      {status}
    </span>
  )
}
