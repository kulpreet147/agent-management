import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  Search,
  Users,
  Flame,
  CheckCircle,
  Filter,
  ArrowUpDown,
  TrendingUp,
  Minus,
  Zap,
  Calendar,
  ChevronRight,
  CircleHelp,
} from 'lucide-react'
import { auth } from '../../utils/auth.js'
import AgentSidebar from '../../components/AgentSidebar.jsx'
import { useLeads } from '../../stores/leadStore.js'

const todayTasks = [
  { title: 'Call Marcus Richardson', desc: 'Discuss Wealth Mgmt Proposal', tags: ['HOT', 'BY 2:00 PM'] },
  { title: 'Verify documents for Jenkins', desc: 'Check Home Mortgage IDs', tags: ['REVIEW'] },
  { title: 'Follow up: Elena Moretti', desc: 'SME Loan Initial Inquiry', tags: ['MEDIUM'] },
]

const tomorrowTasks = [
  { title: 'Weekly Review Meeting', desc: 'General Team Performance', tags: ['9:00 AM'] },
  { title: 'In-person: David Miller', desc: 'Insurance Policy Closing', tags: ['SIGNATURE'] },
]

const priorityConfig = {
  hot: {
    label: 'HOT',
    class: 'bg-red-50 text-red-700',
    icon: Flame,
  },
  medium: {
    label: 'MEDIUM',
    class: 'bg-orange-50 text-orange-700',
    icon: TrendingUp,
  },
  low: {
    label: 'LOW',
    class: 'bg-slate-100 text-slate-600',
    icon: Minus,
  },
}

const statusClass = {
  'IN PROGRESS': 'bg-indigo-50 text-indigo-700',
  'NEW LEAD': 'bg-slate-100 text-slate-700',
  CONVERTED: 'bg-green-50 text-green-700',
  QUALIFYING: 'bg-indigo-50 text-indigo-700',
}

export default function AgentLeadManagement() {
  const navigate = useNavigate()
  const session = auth.get()
  const agentName = session?.name || 'Sarah Johnson'
  const initials = agentName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const [checkedTasks, setCheckedTasks] = useState({})
  const leads = useLeads()

  const toggleTask = (idx) => {
    setCheckedTasks((prev) => ({ ...prev, [idx]: !prev[idx] }))
  }

  return (
    <div className="min-h-screen bg-[#eef3f8] text-slate-950">
      <div className="flex h-screen overflow-hidden">
        <AgentSidebar agentName={agentName} initials={initials} />

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex h-14 shrink-0 items-center border-b border-slate-200 bg-white px-6">
            <div className="text-sm font-bold">Lead Management</div>
            <div className="relative ml-8 w-72">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="Search leads by name, email or phone..."
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
            <div className="mx-auto max-w-7xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-slate-500">Leads &gt; My Leads</div>
                  <h1 className="mt-1 text-2xl font-bold tracking-tight">My Leads Dashboard</h1>
                  <p className="mt-0.5 text-[13px] text-slate-500">Track your active pipeline and upcoming tasks.</p>
                </div>
                {/* <div className="flex gap-3">
                  <button className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50">
                    Export CSV
                  </button>
                  <button className="flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-[11px] font-bold text-white hover:bg-brand-800">
                    <Plus size={14} />
                    New Lead
                  </button>
                </div> */}
              </div>

              <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <StatCard icon={Users} label="Total Leads" value="28" change="+4%" changeClass="text-green-600" />
                <StatCard icon={Bell} label="Due Today" value="05" change="Alert" changeClass="text-orange-500" iconClass="text-orange-500" />
                <StatCard icon={Flame} label="Hot Leads" value="08" change="Urgent" changeClass="text-red-600" iconClass="text-red-500" />
                <StatCard icon={CheckCircle} label="Converted" value="06" change="Success" changeClass="text-green-600" iconClass="text-green-600" />
              </section>

              <div className="flex flex-col xl:flex-row gap-6">
                <section className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                    <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
                      {['All', 'New', 'Due Today', 'Hot'].map((tab) => (
                        <button
                          key={tab}
                          className={`rounded-md px-4 py-1.5 text-[10px] font-bold transition ${
                            tab === 'All' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button className="rounded-md border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
                        <Filter size={14} />
                      </button>
                      <button className="rounded-md border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
                        <ArrowUpDown size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-[11px]">
                      <thead className="bg-slate-50 text-[9px] uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-5 py-4 font-bold">Lead Details</th>
                          <th className="px-5 py-4 font-bold">Product</th>
                          <th className="px-5 py-4 font-bold">Priority</th>
                          <th className="px-5 py-4 font-bold">Status</th>
                          <th className="px-5 py-4 font-bold">Due Date</th>
                          <th className="px-5 py-4 text-right font-bold">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {leads.map((lead) => {
                          const pc = priorityConfig[lead.priority]
                          const PriorityIcon = pc.icon
                          return (
                            <tr key={lead.name} className="hover:bg-slate-50 transition-colors">
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-50 text-[11px] font-bold text-brand-700">
                                    {lead.initials}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900">{lead.name}</div>
                                    <div className="text-[10px] text-slate-500">{lead.phone}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-4 text-slate-700">{lead.product}</td>
                              <td className="px-5 py-4">
                                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${pc.class}`}>
                                  <PriorityIcon size={11} />
                                  {pc.label}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${statusClass[lead.status] || 'bg-slate-100 text-slate-600'}`}>
                                  {lead.status}
                                </span>
                              </td>
                              <td className={`px-5 py-4 font-semibold ${lead.due === 'Today' ? 'text-red-600' : 'text-slate-700'}`}>
                                {lead.due}
                              </td>
                              <td className="px-5 py-4 text-right">
                                <button
                                  onClick={() => navigate(`/agent/leads/${lead.name.toLowerCase().replace(/\s+/g, '-')}`)}
                                  className="text-[10px] font-bold text-brand-700 hover:underline decoration-2"
                                >
                                  VIEW
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-center border-t border-slate-100 p-4">
                    <button className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-brand-700">
                      View All Active Leads
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </section>

                <section className="w-full xl:w-[340px] space-y-6">
                  <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="bg-orange-500 px-5 py-4 flex items-center justify-between text-white">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <Zap size={16} />
                        Today's Action Items
                      </div>
                      <span className="rounded bg-white/20 px-2 py-0.5 text-[10px] font-bold">{todayTasks.length} TASKS</span>
                    </div>
                    <div className="p-4 space-y-3 max-h-[340px] overflow-y-auto">
                      {todayTasks.map((task, idx) => (
                        <label
                          key={idx}
                          className={`flex items-start gap-4 rounded-lg p-3 transition cursor-pointer ${
                            checkedTasks[idx] ? 'opacity-50' : 'hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={!!checkedTasks[idx]}
                            onChange={() => toggleTask(idx)}
                            className="mt-0.5 rounded border-slate-300 text-brand-700 focus:ring-brand-500"
                          />
                          <div className="min-w-0">
                            <p className={`text-[12px] font-bold text-slate-900 ${checkedTasks[idx] ? 'line-through' : ''}`}>
                              {task.title}
                            </p>
                            <p className={`text-[11px] text-slate-500 mt-0.5 ${checkedTasks[idx] ? 'line-through' : ''}`}>
                              {task.desc}
                            </p>
                            <div className="flex gap-2 mt-1.5">
                              {task.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className={`rounded px-2 py-0.5 text-[9px] font-bold ${
                                    tag === 'HOT'
                                      ? 'bg-red-50 text-red-700'
                                      : tag === 'MEDIUM'
                                        ? 'bg-orange-50 text-orange-700'
                                        : tag === 'REVIEW'
                                          ? 'bg-brand-50 text-brand-700'
                                          : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                    <div className="border-t border-slate-100 p-3">
                      <button
                        onClick={() => navigate('/agent/action-items')}
                        className="w-full text-center text-[11px] font-bold text-orange-500 hover:underline"
                      >
                        + Add New Task
                      </button>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="bg-brand-700 px-5 py-4 flex items-center justify-between text-white">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <Calendar size={16} />
                        Tomorrow
                      </div>
                      <span className="rounded bg-white/20 px-2 py-0.5 text-[10px] font-bold">{tomorrowTasks.length} TASKS</span>
                    </div>
                    <div className="p-4 space-y-3">
                      {tomorrowTasks.map((task, idx) => (
                        <div key={idx} className="flex items-start gap-4 rounded-lg p-3 opacity-70">
                          <input
                            type="checkbox"
                            disabled
                            className="mt-0.5 rounded border-slate-300 bg-slate-100 text-slate-400"
                          />
                          <div className="min-w-0">
                            <p className="text-[12px] font-bold text-slate-900">{task.title}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">{task.desc}</p>
                            <div className="flex gap-2 mt-1.5">
                              {task.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className={`rounded px-2 py-0.5 text-[9px] font-bold ${
                                    tag === 'SIGNATURE' ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, change, changeClass, iconClass }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold text-slate-500">{label}</span>
        <Icon size={18} className={iconClass || 'text-brand-700'} />
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold tracking-tight">{value}</span>
        <span className={`text-[11px] font-bold mb-0.5 ${changeClass}`}>{change}</span>
      </div>
    </div>
  )
}
