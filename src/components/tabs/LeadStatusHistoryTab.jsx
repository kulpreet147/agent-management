import { useState, useEffect } from 'react'
import { Clock, RefreshCw, ArrowRight, User, Activity } from 'lucide-react'
import { getStatusHistory } from '../../utils/persons.js'

const statusColors = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-sky-100 text-sky-700',
  qualified: 'bg-indigo-100 text-indigo-700',
  proposal: 'bg-violet-100 text-violet-700',
  negotiation: 'bg-purple-100 text-purple-700',
  closed_won: 'bg-emerald-100 text-emerald-700',
  closed_lost: 'bg-red-100 text-red-600',
  converted: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-600',
  active: 'bg-emerald-100 text-emerald-700',
  churned: 'bg-red-100 text-red-600',
}

export default function LeadStatusHistoryTab({ personId, lead }) {
  const [statusHistory, setStatusHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!personId) return
    setLoading(true)
    getStatusHistory(personId)
      .then((data) => setStatusHistory(Array.isArray(data) ? data : []))
      .catch(() => setStatusHistory([]))
      .finally(() => setLoading(false))
  }, [personId])

  const formatFullDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-blue-600" />
          <h3 className="text-sm font-bold text-slate-800">Status History</h3>
        </div>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-12"><RefreshCw size={18} className="animate-spin text-blue-600 mr-2" /><span className="text-sm text-slate-500">Loading status history...</span></div>
      ) : statusHistory.length === 0 ? (
        <div className="py-12 text-center">
          <Activity size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm text-slate-500">No status changes recorded yet.</p>
        </div>
      ) : (
        <div className="relative px-6 py-6">
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-200" />
          <div className="space-y-6">
            {statusHistory.map((h, i) => {
              const fromStyle = statusColors[h.fromStatus] || 'bg-slate-100 text-slate-600'
              const toStyle = statusColors[h.toStatus] || 'bg-slate-100 text-slate-600'
              return (
                <div key={h.id || i} className="relative flex items-start gap-6">
                  <div className="relative z-10 flex items-center justify-center w-4 h-4 mt-1">
                    <div className="w-4 h-4 rounded-full bg-blue-600 border-4 border-white shadow" />
                  </div>
                  <div className="flex-1 bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${fromStyle}`}>{h.fromStatus || 'N/A'}</span>
                      <ArrowRight size={14} className="text-slate-400" />
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${toStyle}`}>{h.toStatus || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Clock size={11} /> {formatFullDate(h.changedAt)}</span>
                      {h.changedBy && <span className="flex items-center gap-1"><User size={11} /> by {h.changedBy}</span>}
                    </div>
                    {h.details?.notes && <p className="text-xs text-slate-600 mt-2 italic">"{h.details.notes}"</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
