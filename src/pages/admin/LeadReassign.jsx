import { useState } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  UserPlus,
  ChevronDown,
  History,
  Package,
  RefreshCw,
  CheckCircle,
  X
} from 'lucide-react'

const LEAD_FALLBACK = {
  leadId: 'LM-8422',
  id: '#LM-8422',
  name: 'Sarah Miller',
  phone: '+1 (555) 0456',
  email: 's.miller@provider.com',
  product: 'Cloud Infrastructure',
  agent: 'M. Chen',
  agentInitials: 'MC',
  priority: 'Warm',
  status: 'In Progress'
}

export default function LeadReassign() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { leadId } = useParams()
  const lead = state?.lead || LEAD_FALLBACK

  const [reassignState, setReassignState] = useState('idle')

  const handleConfirm = () => {
    setReassignState('processing')
    setTimeout(() => {
      setReassignState('success')
      setTimeout(() => {
        navigate(`/admin/leads/${leadId}`, { state: { lead } })
      }, 800)
    }, 1500)
  }

  const goBack = () => navigate(`/admin/leads/${leadId}`, { state: { lead } })
  const initials = lead.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <button type="button" onClick={goBack} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div>
            <nav className="flex text-xs text-slate-500 mb-1">
              <span>Leads</span>
              <span className="mx-2">/</span>
              <span>Active Pipeline</span>
              <span className="mx-2">/</span>
              <span className="text-blue-600 font-medium">Reassign Lead</span>
            </nav>
            <h2 className="text-lg font-bold text-slate-900">Lead Reassignment</h2>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-blue-600 text-white flex items-center justify-center text-2xl font-bold">
              {initials}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{lead.name}</h3>
              <p className="text-sm text-slate-500">Senior Lead &bull; Tech Acquisition Hub &bull; Created Oct 12, 2023</p>
            </div>
          </div>
          <button className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors">
            Edit Lead
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h4 className="text-sm font-bold text-slate-800 mb-4">Activity Timeline</h4>
          <div className="space-y-6 relative before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
            <div className="flex gap-4 relative">
              <div className="w-6 h-6 rounded-full bg-blue-600 z-10 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-blue-600">TODAY, 10:45 AM</p>
                <p className="text-sm font-medium text-slate-800">Call attempted by Sarah Miller</p>
                <p className="text-xs text-slate-500">No answer, left a voicemail regarding the Q4 service agreement.</p>
              </div>
            </div>
            <div className="flex gap-4 relative">
              <div className="w-6 h-6 rounded-full bg-slate-300 z-10 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-slate-500" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500">YESTERDAY</p>
                <p className="text-sm font-medium text-slate-800">Email opened: &quot;Introduction to LeadMaster&quot;</p>
                <p className="text-xs text-slate-500">Recipient opened the document 3 times from a desktop device.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h4 className="text-sm font-bold text-slate-800 mb-4">Lead Score</h4>
          <div className="flex items-center justify-center py-4">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
                <circle className="text-slate-200" cx="64" cy="64" fill="transparent" r="58" stroke="currentColor" strokeWidth="8" />
                <circle className="text-blue-600" cx="64" cy="64" fill="transparent" r="58" stroke="currentColor" strokeDasharray="364" strokeDashoffset="50" strokeWidth="8" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-slate-800">84</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Very Hot</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="text-base font-bold text-slate-900">Reassign Lead</h3>
          <button type="button" onClick={goBack} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <section>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Current Assignment</h4>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border border-blue-200 bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">
                  SM
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Sarah Miller</p>
                  <p className="text-xs text-slate-500">Senior Account Executive</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-500 uppercase">COMMISSION</p>
                <p className="text-base font-bold text-blue-600">15%</p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">New Assignment</h4>
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

          <section className="space-y-3 py-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
              <span className="text-sm text-slate-700 group-hover:text-blue-600 transition-colors">Notify current agent (Sarah Miller)</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
              <span className="text-sm text-slate-700 group-hover:text-blue-600 transition-colors">Notify new agent via Email &amp; Slack</span>
            </label>
          </section>

          <section className="pt-4 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Assignment History</h4>
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

        <div className="px-6 py-5 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button type="button" onClick={goBack} className="px-6 py-2.5 text-slate-600 text-sm font-semibold rounded-lg hover:bg-slate-200 transition-colors">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={reassignState !== 'idle'}
            className={`px-6 py-2.5 text-white text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center gap-2 ${reassignState === 'success' ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {reassignState === 'processing' ? (
              <><RefreshCw size={16} className="animate-spin" /> Processing...</>
            ) : reassignState === 'success' ? (
              <><CheckCircle size={16} /> Success</>
            ) : (
              'Confirm Reassignment'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
