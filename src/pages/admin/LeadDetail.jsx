import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  ArrowLeft,
  Flame,
  Info,
  Brain,
  ShieldCheck,
  Heart,
  Umbrella,
  ClipboardList,
  Pencil,
  Settings,
  Globe,
  UserCheck,
  ExternalLink,
  Phone,
  Mail,
  MessageSquare,
  ClipboardCheck,
  FileText,
  Calculator,
  Star,
  TrendingUp,
  X,
  UserPlus,
  ChevronDown,
  History,
  Package,
  RefreshCw,
  CheckCircle
} from 'lucide-react'

export default function LeadDetail() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const lead = state?.lead

  const [activeTab, setActiveTab] = useState(0)
  const [showReassign, setShowReassign] = useState(false)
  const [reassignState, setReassignState] = useState('idle')

  if (!lead) {
    navigate('/admin/leads', { replace: true })
    return null
  }

  const tabs = [
    { label: 'Basic Info', icon: Info, to: null },
    { label: 'Need Analysis', icon: Brain, to: 'need-analysis' },
    { label: 'Existing Insurance', icon: ShieldCheck, to: null },
    { label: 'Family Details', icon: Heart, to: null },
    { label: 'Coverage Needs', icon: Umbrella, to: null },
    { label: 'Activity Log', icon: ClipboardList, to: null }
  ]

  const followups = [
    { date: 'Oct 26, 2023', time: '10:30 AM', action: 'Inbound Call', actionIcon: Phone, actionColor: 'text-blue-600', outcome: 'Scheduled Demo', outcomeStyle: 'bg-green-100 text-green-800', agent: 'Marcus R.' },
    { date: 'Oct 25, 2023', time: '02:15 PM', action: 'Brochure Sent', actionIcon: Mail, actionColor: 'text-slate-500', outcome: 'Opened', outcomeStyle: 'bg-blue-100 text-blue-800', agent: 'Marcus R.' },
    { date: 'Oct 24, 2023', time: '09:00 AM', action: 'System SMS', actionIcon: MessageSquare, actionColor: 'text-slate-400', outcome: 'Delivered', outcomeStyle: 'bg-slate-200 text-slate-600', agent: 'Automated' }
  ]

  const priorityStyle =
    lead.priority === 'Hot' ? 'bg-red-100 text-red-700 border-red-200' :
    lead.priority === 'Warm' ? 'bg-orange-100 text-orange-700 border-orange-200' :
    'bg-blue-100 text-blue-700 border-blue-200'

  const handleConfirmReassign = () => {
    setReassignState('processing')
    setTimeout(() => {
      setReassignState('success')
      setTimeout(() => {
        setShowReassign(false)
        setTimeout(() => setReassignState('idle'), 300)
      }, 800)
    }, 1500)
  }

  return (
    <div className="space-y-6">
      {/* Back + title + badges + actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/admin/leads')}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-900">{lead.name}</h2>
            <span className="px-3 py-1 bg-amber-50 text-amber-700 text-[11px] font-bold rounded-full uppercase tracking-tight border border-amber-200">
              {lead.status === 'In Progress' ? 'In Progress' : lead.status}
            </span>
            <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-tight flex items-center gap-1 border ${priorityStyle}`}>
              <Flame size={14} />
              {lead.priority}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg flex items-center gap-2 hover:bg-slate-50 transition-colors">
            <Pencil size={14} />
            Edit
          </button>
          <button
            type="button"
            onClick={() => setShowReassign(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-opacity"
          >
            Reassign
          </button>
        </div>
      </div>

      {/* Summary Bar */}
      <section className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <div className="grid grid-cols-5 gap-8">
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Lead ID</p>
            <p className="text-base font-bold text-blue-600">{lead.id}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Phone</p>
            <p className="text-sm font-semibold text-slate-800">{lead.phone}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Email</p>
            <p className="text-sm font-semibold text-slate-800">{lead.email || 'j.smith@provider.com'}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Assigned Agents</p>
            <div className="flex -space-x-2 mt-1">
              <div className="w-6 h-6 rounded-full border-2 border-white bg-purple-500 flex items-center justify-center text-white text-[8px] font-bold">SJ</div>
              <div className="w-6 h-6 rounded-full border-2 border-white bg-cyan-500 flex items-center justify-center text-white text-[8px] font-bold">MC</div>
              <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-300 flex items-center justify-center text-[8px] font-bold text-slate-600">+1</div>
            </div>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Created Date</p>
            <p className="text-sm font-semibold text-slate-800">Oct 24, 2023</p>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <nav className="flex border-b border-slate-200 gap-8 overflow-x-auto">
        {tabs.map((tab, i) => {
          const Icon = tab.icon
          const isActive = i === activeTab
          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => tab.to ? navigate(`/admin/leads/${lead.id.replace('#', '')}/${tab.to}`, { state: { lead } }) : setActiveTab(i)}
              className={`pb-4 px-1 flex items-center gap-2 whitespace-nowrap text-sm font-semibold transition-colors ${
                isActive ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-blue-600'
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          )
        })}
      </nav>

      {/* Main Lead Info Grid */}
      <div className="grid grid-cols-12 gap-8">
        {/* Left: Customer Details */}
        <div className="col-span-12 lg:col-span-6 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800">Customer Details</h3>
            <Pencil size={16} className="text-blue-600 cursor-pointer" />
          </div>
          <div className="p-6 grid grid-cols-2 gap-y-6 gap-x-8">
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase mb-1">Full Name</p>
              <p className="text-sm text-slate-800">{lead.name}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase mb-1">Date of Birth</p>
              <p className="text-sm text-slate-800">May 12, 1985 (38 years)</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase mb-1">Gender</p>
              <p className="text-sm text-slate-800">Male</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase mb-1">Marital Status</p>
              <p className="text-sm text-slate-800">Married</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-slate-500 font-bold uppercase mb-1">Residential Address</p>
              <p className="text-sm text-slate-800">4522 Oakwood Drive, Ste 400, Austin, TX 78701</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase mb-1">Occupation</p>
              <p className="text-sm text-slate-800">Software Engineering Manager</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase mb-1">Annual Income</p>
              <p className="text-sm text-slate-800">$165,000 - $180,000</p>
            </div>
          </div>
        </div>

        {/* Right: Lead Meta Data */}
        <div className="col-span-12 lg:col-span-6 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800">Lead Meta Data</h3>
            <Settings size={16} className="text-blue-600 cursor-pointer" />
          </div>
          <div className="p-6 space-y-6">
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase mb-3">Interested Products</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-200">Term Life Insurance</span>
                <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-200">Critical Illness</span>
                <span className="px-3 py-1 bg-slate-200 text-slate-600 text-xs font-bold rounded-full">+2 More</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase mb-1">Lead Source</p>
                <div className="flex items-center gap-2">
                  <Globe size={18} className="text-orange-600" />
                  <p className="text-sm text-slate-800">Web Campaign - Google Ads</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase mb-1">Commission Split</p>
                <p className="text-sm text-slate-800">Agent A (60%) / Agency (40%)</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase mb-1">Campaign ID</p>
              <p className="text-sm text-slate-800 font-mono">CMP-2023-TX-FALL</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <UserCheck size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-500">Primary Handling Agent</p>
                  <p className="text-sm font-semibold text-slate-800">Marcus Richardson (Senior Partner)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Left: Follow-Up History */}
        <div className="col-span-12 lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Follow-Up History</h3>
            <button className="text-blue-600 text-xs font-bold flex items-center gap-1">
              View All <ExternalLink size={14} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                  <th className="px-6 py-3">Date & Time</th>
                  <th className="px-6 py-3">Action</th>
                  <th className="px-6 py-3">Outcome</th>
                  <th className="px-6 py-3">Agent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {followups.map((f, i) => {
                  const ActionIcon = f.actionIcon
                  return (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-slate-800">{f.date}</p>
                        <p className="text-[11px] text-slate-500">{f.time}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <ActionIcon size={16} className={f.actionColor} />
                          <span className="text-sm text-slate-700">{f.action}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${f.outcomeStyle}`}>
                          {f.outcome}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">{f.agent}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Right: Quick Actions + Lead Health */}
        <div className="col-span-12 lg:col-span-5 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-800 mb-6">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <button className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-blue-500 hover:text-blue-600 transition-all group">
                <ClipboardCheck size={28} className="mb-2 text-slate-500 group-hover:text-blue-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-slate-600 group-hover:text-blue-600">Add Follow-Up</span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-blue-500 hover:text-blue-600 transition-all group">
                <FileText size={28} className="mb-2 text-slate-500 group-hover:text-blue-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-slate-600 group-hover:text-blue-600">Create Report</span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-blue-500 hover:text-blue-600 transition-all group">
                <Calculator size={28} className="mb-2 text-slate-500 group-hover:text-blue-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-slate-600 group-hover:text-blue-600">Run Quote</span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md">
                <Star size={28} className="mb-2" />
                <span className="text-xs font-semibold">Mark Converted</span>
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-700 to-blue-800 p-6 rounded-xl text-white relative overflow-hidden shadow-lg">
            <div className="relative z-10">
              <h4 className="text-base font-bold mb-2">Lead Health: Excellent</h4>
              <p className="text-sm text-white/80 mb-4">
                The customer has engaged with 3 out of 4 communications and requested a term life quote.
              </p>
              <div className="w-full bg-white/20 h-2 rounded-full mb-2">
                <div className="bg-white h-full rounded-full" style={{ width: '85%' }} />
              </div>
              <span className="text-xs font-bold">85% Conversion Probability</span>
            </div>
            <TrendingUp
              size={120}
              className="absolute -right-4 -bottom-4 text-white/10 rotate-12"
            />
          </div>
        </div>
      </div>

      {/* ==================== REASSIGN MODAL ==================== */}
      {showReassign && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) { setShowReassign(false); setReassignState('idle') } }}
          onKeyDown={(e) => { if (e.key === 'Escape') { setShowReassign(false); setReassignState('idle') } }}
        >
          <div className="bg-white w-full max-w-[500px] rounded-xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-base font-semibold text-slate-900">Reassign Lead</h3>
              <button
                type="button"
                onClick={() => { setShowReassign(false); setReassignState('idle') }}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors"
              >
                <X size={18} className="text-slate-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[716px] overflow-y-auto">
              {/* Current Assignment */}
              <section>
                <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Current Assignment</h4>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-blue-200/50">
                      <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold">SM</div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Sarah Miller</p>
                      <p className="text-xs text-slate-500">Senior Account Executive</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase">COMMISSION</p>
                    <p className="text-base font-bold text-blue-600">15%</p>
                  </div>
                </div>
              </section>

              {/* New Assignment */}
              <section className="space-y-4">
                <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">New Assignment</h4>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-600">Select New Agent</label>
                  <div className="relative">
                    <UserPlus size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select className="w-full bg-white border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none">
                      <option disabled selected>Choose an agent...</option>
                      <option>David Chen (Mid-Market)</option>
                      <option>Elena Rodriguez (Enterprise)</option>
                      <option>Marcus Thorne (Strategic)</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-600">Current Agent Split %</label>
                    <div className="relative">
                      <input className="w-full bg-white border border-slate-200 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" type="number" defaultValue={5} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-600">New Agent Split %</label>
                    <div className="relative">
                      <input className="w-full bg-white border border-slate-200 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" type="number" defaultValue={10} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Reason & Notes */}
              <section className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-600">Reason for Reassignment</label>
                  <select className="w-full bg-white border border-slate-200 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none">
                    <option>Account Scaled to Enterprise</option>
                    <option>Agent Performance Review</option>
                    <option>Geographic Territory Shift</option>
                    <option>Agent Departure / Leave</option>
                    <option>Other (Specify below)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-600">Internal Transfer Notes</label>
                  <textarea className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" placeholder="Provide context for the new agent..." rows={3} />
                </div>
              </section>

              {/* Notifications */}
              <section className="space-y-3 py-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input type="checkbox" defaultChecked className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-slate-300 checked:bg-blue-600 checked:border-blue-600 transition-all" />
                    <CheckCircle size={12} className="absolute text-white opacity-0 peer-checked:opacity-100 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <span className="text-sm text-slate-700 group-hover:text-blue-600 transition-colors">Notify current agent (Sarah Miller)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input type="checkbox" defaultChecked className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-slate-300 checked:bg-blue-600 checked:border-blue-600 transition-all" />
                    <CheckCircle size={12} className="absolute text-white opacity-0 peer-checked:opacity-100 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <span className="text-sm text-slate-700 group-hover:text-blue-600 transition-colors">Notify new agent via Email &amp; Slack</span>
                </label>
              </section>

              {/* Assignment History Timeline */}
              <section className="pt-4 border-t border-slate-200">
                <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-4">Assignment History</h4>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <History size={14} className="text-slate-500" />
                    </div>
                    <div className="text-sm">
                      <p className="text-slate-800"><span className="font-semibold">Sarah Miller</span> was assigned this lead</p>
                      <p className="text-slate-500 text-xs">Oct 12, 2023 &bull; System Automatic Allocation</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <Package size={14} className="text-slate-500" />
                    </div>
                    <div className="text-sm">
                      <p className="text-slate-800">Lead created in <span className="font-semibold">Unassigned Pool</span></p>
                      <p className="text-slate-500 text-xs">Oct 11, 2023 &bull; Marketing Webform</p>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-5 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setShowReassign(false); setReassignState('idle') }}
                className="px-6 py-2.5 text-slate-600 text-sm font-semibold rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReassign}
                disabled={reassignState !== 'idle'}
                className={`px-6 py-2.5 text-white text-sm font-semibold rounded-lg shadow-sm transition-all active:scale-95 flex items-center gap-2 ${
                  reassignState === 'success' ? 'bg-green-600' : 'bg-blue-600 hover:opacity-90'
                }`}
              >
                {reassignState === 'processing' ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" /> Processing...
                  </>
                ) : reassignState === 'success' ? (
                  <>
                    <CheckCircle size={16} /> Success
                  </>
                ) : (
                  'Confirm Reassignment'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
