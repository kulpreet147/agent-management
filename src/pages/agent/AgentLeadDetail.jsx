import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Bell, Search, CircleHelp, ChevronRight, ArrowLeft,
  Wallet, CreditCard, DollarSign, RefreshCw, BarChart3,
  FileText, Mail, Phone, Calendar, Clock, Plus, X
} from 'lucide-react'
import { auth } from '../../utils/auth.js'
import AgentSidebar from '../../components/AgentSidebar.jsx'
import { useLead, updateLeadStatus, addFollowUp } from '../../stores/leadStore.js'

const actionTypes = [
  'DISCOVERY', 'CONTACTED', 'CREATING NEED ANALYSIS',
  'QUOTE PRESENTED', 'CLOSED', 'IN PROGRESS',
]

export default function AgentLeadDetail() {
  const { leadId } = useParams()
  const navigate = useNavigate()
  const session = auth.get()
  const agentName = session?.name || 'Sarah Johnson'
  const initials = (agentName.split(' ').map((p) => p[0]).join('').slice(0, 2)).toUpperCase()
  const lead = useLead(leadId)

  const [activeTab, setActiveTab] = useState('need-analysis')
  const [leadStatus, setLeadStatus] = useState(lead?.status || 'IN PROGRESS')
  const [showFollowUpModal, setShowFollowUpModal] = useState(false)
  const [followUpForm, setFollowUpForm] = useState({
    type: 'CONTACTED', date: '', time: '', note: '', reminder: '',
  })
  const [localFollowUps, setLocalFollowUps] = useState(lead?.followUps || [])

  if (!lead) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#eef3f8]">
        <div className="text-center">
          <p className="text-lg font-bold text-slate-700">Lead not found</p>
          <button onClick={() => navigate('/agent/leads')} className="mt-4 text-brand-700 underline text-sm">
            Back to Leads
          </button>
        </div>
      </div>
    )
  }

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'need-analysis', label: 'Need Analysis' },
    { key: 'documents', label: 'Documents' },
    { key: 'timeline', label: 'Timeline' },
  ]

  const handleUpdateStatus = () => {
    updateLeadStatus(lead.name, leadStatus)
  }

  const handleAddFollowUp = (e) => {
    e.preventDefault()
    const entry = {
      type: followUpForm.type,
      date: followUpForm.date || new Date().toISOString().split('T')[0],
      time: followUpForm.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      note: followUpForm.note,
      reminder: followUpForm.reminder,
    }
    setLocalFollowUps((prev) => [...prev, entry])
    setLeadStatus(followUpForm.type)
    addFollowUp(lead.name, entry)
    updateLeadStatus(lead.name, followUpForm.type)
    setShowFollowUpModal(false)
    setFollowUpForm({ type: 'CONTACTED', date: '', time: '', note: '', reminder: '' })
  }

  const getStatusStyle = (s) => {
    const map = {
      'IN PROGRESS': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'DISCOVERY': 'bg-purple-100 text-purple-800 border-purple-200',
      'CONTACTED': 'bg-blue-100 text-blue-800 border-blue-200',
      'CREATING NEED ANALYSIS': 'bg-amber-100 text-amber-800 border-amber-200',
      'QUOTE PRESENTED': 'bg-orange-100 text-orange-800 border-orange-200',
      'CLOSED': 'bg-green-100 text-green-800 border-green-200',
      'NEW LEAD': 'bg-slate-100 text-slate-700 border-slate-200',
      'CONVERTED': 'bg-green-100 text-green-700 border-green-200',
      'QUALIFYING': 'bg-indigo-100 text-indigo-700 border-indigo-200',
    }
    return map[s] || 'bg-slate-100 text-slate-700 border-slate-200'
  }

  return (
    <div className="min-h-screen bg-[#f6fafe] text-slate-950">
      <div className="flex h-screen overflow-hidden">
        <AgentSidebar agentName={agentName} initials={initials} />

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex h-14 shrink-0 items-center border-b border-slate-200 bg-white px-6">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/agent/leads')} className="p-1 rounded hover:bg-slate-100 transition-colors">
                <ArrowLeft size={18} className="text-slate-500" />
              </button>
              <span className="text-sm font-bold">Lead Detail</span>
            </div>
            <div className="relative ml-8 w-72">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="Search leads, tasks, or files..."
                className="h-8 w-full rounded-md border border-slate-300 bg-slate-50 pl-9 pr-3 text-[11px] outline-none focus:border-brand-500 focus:bg-white"
              />
            </div>
            <div className="ml-auto flex items-center gap-4 text-slate-500">
              <Bell size={15} />
              <CircleHelp size={15} />
              <div className="grid h-8 w-8 place-items-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                {initials}
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="mx-auto max-w-7xl">
              {/* Breadcrumb + Lead Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <nav className="flex items-center gap-2 text-[12px] text-slate-400 mb-1">
                    <button onClick={() => navigate('/agent/leads')} className="hover:text-brand-700">My Leads</button>
                    <ChevronRight size={12} />
                    <span className="text-slate-700 font-semibold">{lead.name}</span>
                  </nav>
                  <h2 className="text-xl font-bold flex items-center gap-3">
                    {lead.name}
                    <span className={`px-3 py-0.5 rounded-full text-[11px] font-bold uppercase border ${getStatusStyle(leadStatus)}`}>
                      {leadStatus}
                    </span>
                  </h2>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Lead Score</p>
                  <p className="text-2xl font-bold text-brand-700">84/100</p>
                </div>
              </div>

              {/* Tabs + Status Indicators */}
              <div className="border-b border-slate-200 mb-6 flex items-center justify-between">
                <div className="flex gap-6">
                  {tabs.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`pb-3 text-[13px] font-semibold transition-colors ${
                        activeTab === tab.key
                          ? 'text-brand-700 border-b-2 border-brand-700'
                          : 'text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3 pb-3">
                  <span className="flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-full text-[11px] font-bold border border-green-200">
                    <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
                    Assets: Complete
                  </span>
                  <span className="flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-[11px] font-bold border border-amber-200">
                    <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                    Liabilities: Partial
                  </span>
                  <span className="flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-400 rounded-full text-[11px] font-bold border border-slate-200">
                    <span className="w-3 h-3 rounded-full bg-slate-300 inline-block" />
                    Income: Not Provided
                  </span>
                </div>
              </div>

              {/* Grid Content */}
              <div className="grid grid-cols-12 gap-6">
                {/* Left: Main Content */}
                <div className="col-span-8 space-y-6">
                  {activeTab === 'need-analysis' && (
                    <>
                      {/* Assets Section */}
                      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-base font-bold flex items-center gap-2">
                            <Wallet size={20} className="text-green-600" />
                            Assets
                          </h3>
                          <button className="text-[12px] font-bold text-brand-700 flex items-center gap-1 hover:underline">
                            <Plus size={14} /> Edit Section
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-5">
                            <div>
                              <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Primary Residence</p>
                              <div className="flex items-center gap-2">
                                <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-[11px] font-bold">YES</span>
                                <span className="text-[13px]">Estimated Value: $850,000</span>
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Liquid Savings</p>
                              <p className="text-lg font-bold">$124,500.00</p>
                            </div>
                          </div>
                          <div className="space-y-5 border-l border-slate-200 pl-8">
                            <div>
                              <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Kids' Investments (RESP/Trusts)</p>
                              <p className="text-[13px]">$45,000.00 Across 2 Accounts</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Other Assets</p>
                              <p className="text-[13px] italic text-slate-400">None listed</p>
                            </div>
                          </div>
                        </div>
                      </section>

                      {/* Liabilities Section */}
                      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-base font-bold flex items-center gap-2">
                            <CreditCard size={20} className="text-amber-600" />
                            Liabilities
                          </h3>
                          <button className="text-[12px] font-bold text-brand-700 flex items-center gap-1 hover:underline">
                            <Plus size={14} /> Add Liability
                          </button>
                        </div>
                        <table className="w-full text-left text-[13px]">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="p-3 text-[10px] text-slate-400 uppercase font-bold">Type</th>
                              <th className="p-3 text-[10px] text-slate-400 uppercase font-bold">Lender</th>
                              <th className="p-3 text-[10px] text-slate-400 uppercase font-bold">Remaining</th>
                              <th className="p-3 text-[10px] text-slate-400 uppercase font-bold">Rate</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            <tr>
                              <td className="p-3 font-bold">Mortgage</td>
                              <td className="p-3">TD Bank</td>
                              <td className="p-3">$412,000.00</td>
                              <td className="p-3">3.45%</td>
                            </tr>
                            <tr>
                              <td className="p-3 font-bold">Line of Credit</td>
                              <td className="p-3">Scotiabank</td>
                              <td className="p-3 text-amber-600 font-bold">Pending Update</td>
                              <td className="p-3">—</td>
                            </tr>
                            <tr className="bg-red-50/30">
                              <td className="p-3 font-bold">Credit Card Debt</td>
                              <td className="p-3">Amex / Visa</td>
                              <td className="p-3">$14,200.00</td>
                              <td className="p-3">19.99%</td>
                            </tr>
                          </tbody>
                        </table>
                      </section>

                      {/* Income Section */}
                      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 relative overflow-hidden opacity-60 grayscale-[0.5]">
                        <div className="absolute top-0 left-0 w-1 h-full bg-slate-300" />
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-base font-bold flex items-center gap-2">
                            <DollarSign size={20} className="text-slate-400" />
                            Income Details
                          </h3>
                          <button className="bg-brand-700 text-white px-4 py-2 rounded-lg text-[11px] font-bold hover:bg-brand-800 transition-colors">
                            Request Data via Portal
                          </button>
                        </div>
                        <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50/50 rounded-lg border border-dashed border-slate-300">
                          <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center mb-3">
                            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                            </svg>
                          </div>
                          <p className="text-base font-bold">Income Verification Required</p>
                          <p className="text-[12px] text-slate-400 px-12 mt-1">
                            Self and Spouse income data has not been provided or verified yet.
                          </p>
                        </div>
                      </section>
                    </>
                  )}

                  {activeTab === 'overview' && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
                      <p className="text-slate-400 text-sm">Overview content coming soon.</p>
                    </div>
                  )}

                  {activeTab === 'documents' && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
                      <p className="text-slate-400 text-sm">Documents content coming soon.</p>
                    </div>
                  )}

                  {activeTab === 'timeline' && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
                      <p className="text-slate-400 text-sm">Timeline content coming soon.</p>
                    </div>
                  )}

                  {/* Follow-Up History */}
                  <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-800">Follow-Up History</h3>
                      {localFollowUps.length > 0 && (
                        <span className="text-[10px] text-slate-400">{localFollowUps.length} entries</span>
                      )}
                    </div>
                    {localFollowUps.length === 0 ? (
                      <div className="p-6 text-center">
                        <p className="text-[12px] text-slate-400">No follow-ups recorded yet.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-slate-50 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                              <th className="px-6 py-3">Type</th>
                              <th className="px-6 py-3">Date & Time</th>
                              <th className="px-6 py-3">Note</th>
                              <th className="px-6 py-3">Reminder</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {localFollowUps.map((f, i) => (
                              <tr key={i} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${getStatusStyle(f.type)}`}>
                                    {f.type}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2 text-[13px]">
                                    <Calendar size={14} className="text-slate-400" />
                                    {f.date}
                                    <Clock size={14} className="text-slate-400 ml-1" />
                                    {f.time}
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-[13px] text-slate-600">{f.note || '—'}</td>
                                <td className="px-6 py-4 text-[13px] text-slate-600">{f.reminder || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                </div>

                {/* Right: Action Panel */}
                <aside className="col-span-4 space-y-6">
                  {/* Action Center */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-slate-200">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Action Center</h4>
                    </div>
                    <div className="p-4 space-y-3">
                      <button
                        onClick={() => setShowFollowUpModal(true)}
                        className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-brand-50 border border-slate-200 rounded-lg transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <RefreshCw size={18} className="text-brand-700 group-hover:scale-110 transition-transform" />
                          <span className="font-bold text-[13px]">Add Follow-Up</span>
                        </div>
                        <ChevronRight size={16} className="text-slate-300" />
                      </button>
                      <button className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-brand-50 border border-slate-200 rounded-lg transition-all group">
                        <div className="flex items-center gap-3">
                          <BarChart3 size={18} className="text-brand-700 group-hover:scale-110 transition-transform" />
                          <span className="font-bold text-[13px]">Create Analysis Report</span>
                        </div>
                        <ChevronRight size={16} className="text-slate-300" />
                      </button>
                      <button className="w-full flex items-center justify-between p-3 bg-brand-700 text-white border border-brand-700 rounded-lg shadow-sm hover:brightness-110 transition-all group">
                        <div className="flex items-center gap-3">
                          <FileText size={18} className="group-hover:rotate-12 transition-transform" />
                          <span className="font-bold text-[13px]">Run Quote</span>
                        </div>
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </button>

                      <hr className="border-slate-200 my-4" />

                      <div className="space-y-3">
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Status Pipeline</p>
                        <select
                          value={leadStatus}
                          onChange={(e) => setLeadStatus(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg text-[13px] focus:ring-brand-500 focus:border-brand-500 py-2.5 px-3 outline-none"
                        >
                          {actionTypes.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                        <button
                          onClick={handleUpdateStatus}
                          className="w-full py-2.5 bg-slate-900 text-white rounded-lg font-bold text-[12px] hover:bg-black transition-colors"
                        >
                          Update Status
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Client Profile */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white text-lg font-bold">
                        {lead.initials}
                      </div>
                      <div>
                        <h5 className="text-base font-bold">{lead.name}</h5>
                        <p className="text-[12px] text-slate-400">Toronto, Ontario</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50">
                        <Mail size={16} className="text-brand-700" />
                        <span className="text-[13px]">{lead.name.toLowerCase().replace(/\s+/g, '.')}@email.com</span>
                      </div>
                      <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50">
                        <Phone size={16} className="text-brand-700" />
                        <span className="text-[13px]">{lead.phone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bento Notes */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col justify-between min-h-[100px]">
                      <p className="text-[10px] text-blue-700 font-bold uppercase">Family</p>
                      <p className="text-[12px] text-blue-900 leading-tight">Married, 2 kids (4, 7). College planning priority.</p>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex flex-col justify-between min-h-[100px]">
                      <p className="text-[10px] text-amber-700 font-bold uppercase">Risk</p>
                      <p className="text-[12px] text-amber-900 leading-tight">Conservative profile. Prefers fixed rates.</p>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Add Follow-Up Modal */}
      {showFollowUpModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) { setShowFollowUpModal(false) } }}
        >
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-base font-semibold text-slate-900">Add Follow-Up</h3>
              <button
                type="button"
                onClick={() => setShowFollowUpModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors"
              >
                <X size={18} className="text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleAddFollowUp} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Action Type</label>
                <select
                  value={followUpForm.type}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, type: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg py-2.5 px-3 text-[13px] focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                  required
                >
                  {actionTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Date</label>
                  <input
                    type="date"
                    value={followUpForm.date}
                    onChange={(e) => setFollowUpForm({ ...followUpForm, date: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg py-2.5 px-3 text-[13px] focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Time</label>
                  <input
                    type="time"
                    value={followUpForm.time}
                    onChange={(e) => setFollowUpForm({ ...followUpForm, time: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg py-2.5 px-3 text-[13px] focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Note</label>
                <textarea
                  value={followUpForm.note}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, note: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg py-2.5 px-3 text-[13px] focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                  rows={3}
                  placeholder="Add a note about this follow-up..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Reminder</label>
                <input
                  type="datetime-local"
                  value={followUpForm.reminder}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, reminder: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg py-2.5 px-3 text-[13px] focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFollowUpModal(false)}
                  className="px-5 py-2.5 text-slate-600 text-[13px] font-semibold rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-brand-700 text-white text-[13px] font-semibold rounded-lg hover:bg-brand-800 transition-colors shadow-sm"
                >
                  Add Follow-Up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
