import { useState, useEffect } from 'react'
import { X, User, Shield, Calculator, Heart, FileText, Calendar, Mail, Phone, RefreshCw, DollarSign, Trash2, Check, XCircle, Edit3 } from 'lucide-react'
import { getFamilyMembers, getPolicies, getQuotes, getNeedAnalysis, addFamilyMember, updateFamilyMember, removeFamilyMember, emailQuote as emailQuotePerson, deleteQuote as deleteQuotePerson, updateQuoteStatus } from '../../utils/persons.js'
import FamilyMemberNeedAnalysisForm from '../FamilyMemberNeedAnalysisForm.jsx'

export default function LeadFamilyMemberDetail({ personId, member, familyMembers, onClose, lead }) {
  const [activeSection, setActiveSection] = useState('policies')
  const [policies, setPolicies] = useState([])
  const [quotes, setQuotes] = useState([])
  const [needAnalysis, setNeedAnalysis] = useState(null)
  const [loadingPolicies, setLoadingPolicies] = useState(true)
  const [loadingQuotes, setLoadingQuotes] = useState(true)
  const [loadingNA, setLoadingNA] = useState(true)
  const [showNeedAnalysisForm, setShowNeedAnalysisForm] = useState(false)

  const memberId = member?.id || undefined

  useEffect(() => {
    if (!personId || !memberId) return
    setLoadingPolicies(true)
    setLoadingQuotes(true)
    setLoadingNA(true)

    getPolicies(personId, memberId).then(d => setPolicies(Array.isArray(d) ? d : [])).catch(() => setPolicies([])).finally(() => setLoadingPolicies(false))
    getQuotes(personId, memberId).then(d => setQuotes(Array.isArray(d) ? d : [])).catch(() => setQuotes([])).finally(() => setLoadingQuotes(false))
    getNeedAnalysis(personId, memberId).then(d => setNeedAnalysis(d || null)).catch(() => setNeedAnalysis(null)).finally(() => setLoadingNA(false))
  }, [personId, memberId])

  const statusStyle = (s) =>
    s === 'active' ? 'bg-emerald-100 text-emerald-700' :
    s === 'lapsed' ? 'bg-red-100 text-red-700' :
    'bg-amber-100 text-amber-700'

  const quoteStatusBadge = (q) => {
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

  const reloadQuotes = () => {
    setLoadingQuotes(true)
    getQuotes(personId, memberId).then(d => setQuotes(Array.isArray(d) ? d : [])).catch(() => setQuotes([])).finally(() => setLoadingQuotes(false))
  }

  const handleAcceptQuote = async (quoteId) => {
    try {
      await updateQuoteStatus(personId, quoteId, 'accepted')
      reloadQuotes()
    } catch (err) { alert(err.message || 'Failed to accept quote') }
  }

  const handleRejectQuote = async (quoteId) => {
    try {
      await updateQuoteStatus(personId, quoteId, 'rejected')
      reloadQuotes()
    } catch (err) { alert(err.message || 'Failed to reject quote') }
  }

  const handleEmailQuote = async (quoteId) => {
    try {
      await emailQuotePerson(personId, quoteId)
      reloadQuotes()
    } catch (err) { alert(err.message || 'Failed to email quote') }
  }

  const reloadNA = () => {
    setLoadingNA(true)
    getNeedAnalysis(personId, memberId).then(d => setNeedAnalysis(d || null)).catch(() => setNeedAnalysis(null)).finally(() => setLoadingNA(false))
  }

  const handleDeleteQuote = async (quoteId) => {
    if (!window.confirm('Delete this quote?')) return
    try {
      await deleteQuotePerson(personId, quoteId)
      reloadQuotes()
    } catch (err) { alert(err.message || 'Failed to delete quote') }
  }

  const sections = [
    { key: 'policies', label: 'Policies', icon: Shield },
    { key: 'quotes', label: 'Quotes', icon: Calculator },
    { key: 'products', label: 'Recommended Products', icon: Heart },
    { key: 'analysis', label: 'Need Analysis', icon: FileText },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(23, 28, 31, 0.6)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
              <User size={18} className="text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{member.firstName} {member.lastName}</h3>
              <p className="text-xs text-slate-500">{member.relationship}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-full transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        {/* Member Info */}
        <div className="px-6 py-3 bg-white border-b border-slate-200 flex flex-wrap gap-4 text-xs text-slate-600">
          {member.dateOfBirth && (
            <span className="flex items-center gap-1"><Calendar size={12} /> DOB: {new Date(member.dateOfBirth).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          )}
          {member.email && <span className="flex items-center gap-1"><Mail size={12} /> {member.email}</span>}
          {member.phone && <span className="flex items-center gap-1"><Phone size={12} /> {member.phone}</span>}
        </div>

        {/* Section Tabs */}
        <div className="flex border-b border-slate-200 bg-white">
          {sections.map((s) => {
            const Icon = s.icon
            return (
              <button key={s.key} onClick={() => setActiveSection(s.key)}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold transition-colors ${
                  activeSection === s.key ? 'text-purple-700 border-b-2 border-purple-700 bg-purple-50/50' : 'text-slate-500 hover:text-slate-700'
                }`}>
                <Icon size={14} />
                {s.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeSection === 'policies' && (
            <>
              <h4 className="text-sm font-bold text-slate-800 mb-3">Policies for {member.firstName}</h4>
              {loadingPolicies ? (
                <div className="flex items-center gap-2 text-sm text-slate-500"><RefreshCw size={14} className="animate-spin" /> Loading...</div>
              ) : policies.length === 0 ? (
                <p className="text-sm text-slate-400 italic">No policies for this family member.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                        <th className="py-2 pr-4">Policy #</th>
                        <th className="py-2 pr-4">Type</th>
                        <th className="py-2 pr-4">Carrier</th>
                        <th className="py-2 pr-4 text-right">Premium</th>
                        <th className="py-2 pr-4 text-right">Coverage</th>
                        <th className="py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {policies.map((p) => (
                        <tr key={p.id}>
                          <td className="py-2 pr-4 font-semibold text-slate-800">{p.policyNumber}</td>
                          <td className="py-2 pr-4">{p.policyType || p.productType || '—'}</td>
                          <td className="py-2 pr-4 text-slate-600">{p.carrier || '—'}</td>
                          <td className="py-2 pr-4 text-right font-semibold">CHF {Number(p.premium || 0).toLocaleString()}</td>
                          <td className="py-2 pr-4 text-right">CHF {Number(p.coverageAmount || 0).toLocaleString()}</td>
                          <td className="py-2"><span className={`px-2 py-0.5 text-[10px] font-bold rounded ${statusStyle(p.status)}`}>{p.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {activeSection === 'quotes' && (
            <>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-800">Quotes for {member.firstName}</h4>
                <button onClick={reloadQuotes} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors" title="Refresh quotes">
                  <RefreshCw size={13} className={`text-slate-500 ${loadingQuotes ? 'animate-spin' : ''}`} />
                </button>
              </div>
              {loadingQuotes ? (
                <div className="flex items-center gap-2 text-sm text-slate-500"><RefreshCw size={14} className="animate-spin" /> Loading...</div>
              ) : quotes.length === 0 ? (
                <p className="text-sm text-slate-400 italic">No quotes run for this family member.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                        <th className="py-2 pr-4">Carrier</th>
                        <th className="py-2 pr-4">Product</th>
                        <th className="py-2 pr-4 text-right">Premium</th>
                        <th className="py-2 pr-4 text-right">Coverage</th>
                        <th className="py-2 pr-4">Status</th>
                        <th className="py-2 pr-4">Date</th>
                        <th className="py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {quotes.map((q) => {
                        const badge = quoteStatusBadge(q)
                        return (
                          <tr key={q.id} className={`transition-colors ${q.status === 'accepted' ? 'bg-green-50/50' : q.status === 'rejected' ? 'bg-red-50/30' : 'hover:bg-slate-50'}`}>
                            <td className="py-2 pr-4 font-semibold text-slate-800">{q.carrier || 'N/A'}</td>
                            <td className="py-2 pr-4 text-slate-600">{q.productType || q.product || q.model || 'N/A'}</td>
                            <td className="py-2 pr-4 text-right font-semibold">
                              {q.premium ? `${q.currency || 'CHF'} ${Number(q.premium).toLocaleString()}` : q.premiumMonthly ? `${q.currency || 'CHF'} ${Number(q.premiumMonthly).toLocaleString()}` : 'N/A'}
                            </td>
                            <td className="py-2 pr-4 text-right text-slate-600">
                              {q.coverageAmount ? `CHF ${Number(q.coverageAmount).toLocaleString()}`
                                : q.faceAmount ? `CHF ${Number(q.faceAmount).toLocaleString()}`
                                : q.deductible ? `CHF ${Number(q.deductible).toLocaleString()} ded.`
                                : 'N/A'}
                            </td>
                            <td className="py-2 pr-4"><span className={`px-2 py-0.5 text-[10px] font-bold rounded ${badge.style}`}>{badge.label}</span></td>
                            <td className="py-2 pr-4 text-slate-600 text-xs">{q.createdAt ? new Date(q.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</td>
                            <td className="py-2 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {q.status !== 'accepted' && q.status !== 'rejected' && (
                                  <button onClick={() => handleAcceptQuote(q.id)} className="p-1 hover:bg-green-50 rounded transition-colors" title="Accept Quote">
                                    <Check size={13} className="text-green-600" />
                                  </button>
                                )}
                                {q.status !== 'accepted' && q.status !== 'rejected' && (
                                  <button onClick={() => handleRejectQuote(q.id)} className="p-1 hover:bg-red-50 rounded transition-colors" title="Reject Quote">
                                    <XCircle size={13} className="text-red-500" />
                                  </button>
                                )}
                                <button onClick={() => handleEmailQuote(q.id)} className={`p-1 rounded transition-colors ${q.emailedToClient ? 'opacity-30 cursor-not-allowed' : 'hover:bg-blue-50'}`} title={q.emailedToClient ? 'Already Emailed' : 'Email Quote'}>
                                  <Mail size={13} className="text-blue-600" />
                                </button>
                                <button onClick={() => handleDeleteQuote(q.id)} className="p-1 hover:bg-red-50 rounded transition-colors" title="Delete">
                                  <Trash2 size={13} className="text-red-500" />
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
            </>
          )}

          {activeSection === 'products' && (
            <>
              <h4 className="text-sm font-bold text-slate-800 mb-3">Recommended Products for {member.firstName}</h4>
              {loadingNA ? (
                <div className="flex items-center gap-2 text-sm text-slate-500"><RefreshCw size={14} className="animate-spin" /> Loading...</div>
              ) : needAnalysis?.recommendedProducts?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                        <th className="py-2 pr-4">Product</th>
                        <th className="py-2 pr-4 text-right">Coverage Amount</th>
                        <th className="py-2 text-right">Proposed Premium</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {needAnalysis.recommendedProducts.map((r, i) => (
                        <tr key={i}>
                          <td className="py-2 pr-4 font-semibold text-slate-800">{r.product || '—'}</td>
                          <td className="py-2 pr-4 text-right text-slate-600">
                            {r.coverageAmount ? `CHF ${Number(r.coverageAmount).toLocaleString()}` : '—'}
                          </td>
                          <td className="py-2 text-right font-semibold">
                            {r.proposedPremium ? `CHF ${Number(r.proposedPremium).toLocaleString()}` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">No recommended products for this family member.</p>
              )}
            </>
          )}

          {activeSection === 'analysis' && (
            <>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-800">Need Analysis for {member.firstName}</h4>
                <button onClick={() => setShowNeedAnalysisForm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors">
                  <Edit3 size={12} />
                  {needAnalysis ? 'Edit' : 'Create'}
                </button>
              </div>
              {loadingNA ? (
                <div className="flex items-center gap-2 text-sm text-slate-500"><RefreshCw size={14} className="animate-spin" /> Loading...</div>
              ) : needAnalysis ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {needAnalysis.ownHouse !== undefined && (
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Own House</p>
                        <p className="text-sm font-semibold mt-0.5">{needAnalysis.ownHouse ? 'Yes' : 'No'}</p>
                      </div>
                    )}
                    {(needAnalysis.houseValue || needAnalysis.mortgageRemaining) && (
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">House Value / Mortgage</p>
                        <p className="text-sm font-semibold mt-0.5">
                          {needAnalysis.houseValue ? `CHF ${Number(needAnalysis.houseValue).toLocaleString()}` : 'N/A'}
                          {needAnalysis.mortgageRemaining ? ` / CHF ${Number(needAnalysis.mortgageRemaining).toLocaleString()}` : ''}
                        </p>
                      </div>
                    )}
                    {(needAnalysis.rrsp || needAnalysis.tfsa) && (
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">RRSP / TFSA</p>
                        <p className="text-sm font-semibold mt-0.5">
                          {needAnalysis.rrsp ? `CHF ${Number(needAnalysis.rrsp).toLocaleString()}` : '—'}
                          {needAnalysis.tfsa ? ` / CHF ${Number(needAnalysis.tfsa).toLocaleString()}` : ''}
                        </p>
                      </div>
                    )}
                    {(needAnalysis.annualIncomePrimary || needAnalysis.annualIncomePrimary !== null) && (
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Annual Income</p>
                        <p className="text-sm font-semibold mt-0.5">
                          {needAnalysis.annualIncomePrimary ? `CHF ${Number(needAnalysis.annualIncomePrimary).toLocaleString()}` : '—'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">No need analysis for this family member.</p>
              )}
            </>
          )}
        </div>
      </div>
      {showNeedAnalysisForm && (
        <FamilyMemberNeedAnalysisForm
          personId={personId}
          member={member}
          onClose={() => setShowNeedAnalysisForm(false)}
          onSaved={() => { reloadNA(); reloadQuotes() }}
        />
      )}
    </div>
  )
}