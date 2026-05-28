const STYLES = {
  Success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Critical: 'bg-red-50 text-red-700 border-red-200',
  Processing: 'bg-amber-50 text-amber-700 border-amber-200',
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Training: 'bg-slate-100 text-slate-700 border-slate-200',
  'Contract Expiring': 'bg-red-50 text-red-700 border-red-200',
  NEW: 'bg-blue-50 text-blue-700 border-blue-200',
  Prospect: 'bg-slate-50 text-slate-700 border-slate-200',
  'Under Review': 'bg-amber-50 text-amber-700 border-amber-200'
}

export default function StatusPill({ status, size = 'sm' }) {
  const cls = STYLES[status] || 'bg-slate-100 text-slate-700 border-slate-200'
  const sz = size === 'xs' ? 'text-[10px] px-2 py-0.5' : 'text-[12px] px-3 py-1'
  return (
    <span className={`inline-flex items-center font-semibold tracking-wide border rounded-full ${cls} ${sz}`}>
      {status}
    </span>
  )
}
