import { useState, useEffect } from 'react'
import { Calculator, Mail, Trash2, RefreshCw, Check, XCircle } from 'lucide-react'
import { getQuotes, selectQuote as selectQuotePerson, emailQuote as emailQuotePerson, deleteQuote as deleteQuotePerson, updateQuoteStatus } from '../../utils/persons.js'
import { listQuotes, selectQuote as selectQuoteLead, emailQuote as emailQuoteLead, deleteQuote as deleteQuoteLead, updateQuoteStatus as updateQuoteStatusLead } from '../../utils/leads.js'

export default function LeadQuotesTab({ personId, lead }) {
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [source, setSource] = useState(null) // 'person' or 'lead'

  const loadQuotes = async () => {
    if (!personId && !lead?.id) return
    setLoading(true)
    try {
      // Try person_quotes first (new model)
      if (personId) {
        const personData = await getQuotes(personId)
        const personQuotes = Array.isArray(personData) ? personData : []
        if (personQuotes.length > 0) {
          setQuotes(personQuotes)
          setSource('person')
          setLoading(false)
          return
        }
      }
      // Fallback to lead_quotes (old model)
      if (lead?.id) {
        const leadData = await listQuotes(lead.id)
        const leadQuotes = Array.isArray(leadData?.quotes) ? leadData.quotes : Array.isArray(leadData) ? leadData : []
        setQuotes(leadQuotes)
        setSource('lead')
      }
    } catch (err) {
      setQuotes([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadQuotes() }, [personId, lead?.id])

  const handleSelect = async (quoteId) => {
    try {
      if (source === 'lead') {
        await selectQuoteLead(lead.id, quoteId)
      } else {
        await selectQuotePerson(personId, quoteId)
      }
      loadQuotes()
    } catch (err) { alert(err.message || 'Failed to select quote') }
  }

  const handleEmail = async (quoteId) => {
    try {
      if (source === 'lead') {
        await emailQuoteLead(lead.id, quoteId)
      } else {
        await emailQuotePerson(personId, quoteId)
      }
      alert('Quote emailed successfully!')
    } catch (err) { alert(err.message || 'Failed to email quote') }
  }

  const handleDelete = async (quoteId) => {
    if (!window.confirm('Delete this quote?')) return
    try {
      if (source === 'lead') {
        await deleteQuoteLead(lead.id, quoteId)
      } else {
        await deleteQuotePerson(personId, quoteId)
      }
      loadQuotes()
    } catch (err) { alert(err.message || 'Failed to delete quote') }
  }

  const handleAccept = async (quoteId) => {
    try {
      if (source === 'lead') {
        await updateQuoteStatusLead(lead.id, quoteId, 'accepted')
      } else {
        await updateQuoteStatus(personId, quoteId, 'accepted')
      }
      loadQuotes()
    } catch (err) { alert(err.message || 'Failed to accept quote') }
  }

  const handleReject = async (quoteId) => {
    try {
      if (source === 'lead') {
        await updateQuoteStatusLead(lead.id, quoteId, 'rejected')
      } else {
        await updateQuoteStatus(personId, quoteId, 'rejected')
      }
      loadQuotes()
    } catch (err) { alert(err.message || 'Failed to reject quote') }
  }

  const getStatusBadge = (q) => {
    const status = q.status || 'draft'
    const badges = {
      draft: { label: 'Draft', style: 'bg-slate-100 text-slate-600' },
      sent: { label: 'Sent', style: 'bg-blue-100 text-blue-700' },
      accepted: { label: 'Accepted', style: 'bg-green-100 text-green-700' },
      rejected: { label: 'Rejected', style: 'bg-red-100 text-red-700' },
      expired: { label: 'Expired', style: 'bg-yellow-100 text-yellow-700' },
    }
    return badges[status] || badges.draft
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator size={18} className="text-blue-600" />
          <h3 className="text-sm font-bold text-slate-800">Quotes</h3>
          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full">{quotes.length}</span>
        </div>
        <button onClick={loadQuotes} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <RefreshCw size={15} className="text-slate-500" />
        </button>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-12"><RefreshCw size={18} className="animate-spin text-blue-600 mr-2" /><span className="text-sm text-slate-500">Loading quotes...</span></div>
      ) : quotes.length === 0 ? (
        <div className="py-12 text-center">
          <Calculator size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm text-slate-500">No quotes run yet.</p>
          <p className="text-xs text-slate-400 mt-1">Run a quote from the Quick Actions panel.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                <th className="px-6 py-3">For</th>
                <th className="px-6 py-3">Carrier</th>
                <th className="px-6 py-3">Product</th>
                <th className="px-6 py-3">Premium</th>
                <th className="px-6 py-3">Coverage</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {quotes.map((q) => {
                const badge = getStatusBadge(q)
                return (
                  <tr key={q.id} className={`hover:bg-slate-50 transition-colors ${q.status === 'accepted' ? 'bg-green-50/50' : q.status === 'rejected' ? 'bg-red-50/30' : ''}`}>
                    <td className="px-6 py-4 text-xs font-semibold">
                      {q.familyMember ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-bold">
                          {q.familyMember.firstName} {q.familyMember.lastName}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">Self</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">{q.carrier || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{q.productType || q.product || q.model || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                      {q.premium ? `${q.currency || 'CHF'} ${Number(q.premium).toLocaleString()}` : q.premiumMonthly ? `${q.currency || 'CHF'} ${Number(q.premiumMonthly).toLocaleString()}` : 'N/A'}
                      {q.premiumFrequency && <span className="text-xs text-slate-500"> /{q.premiumFrequency}</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {q.coverageAmount ? `CHF ${Number(q.coverageAmount).toLocaleString()}` 
                        : q.faceAmount ? `CHF ${Number(q.faceAmount).toLocaleString()}`
                        : q.deductible ? `CHF ${Number(q.deductible).toLocaleString()} deductible`
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${badge.style}`}>{badge.label}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {q.createdAt ? new Date(q.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {q.status !== 'accepted' && q.status !== 'rejected' && (
                          <button onClick={() => handleAccept(q.id)} className="p-1.5 hover:bg-green-50 rounded transition-colors" title="Accept Quote">
                            <Check size={14} className="text-green-600" />
                          </button>
                        )}
                        {q.status !== 'accepted' && q.status !== 'rejected' && (
                          <button onClick={() => handleReject(q.id)} className="p-1.5 hover:bg-red-50 rounded transition-colors" title="Reject Quote">
                            <XCircle size={14} className="text-red-500" />
                          </button>
                        )}
                        <button onClick={() => handleEmail(q.id)} className="p-1.5 hover:bg-blue-50 rounded transition-colors" title="Email Quote">
                          <Mail size={14} className="text-blue-600" />
                        </button>
                        <button onClick={() => handleDelete(q.id)} className="p-1.5 hover:bg-red-50 rounded transition-colors" title="Delete">
                          <Trash2 size={14} className="text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
