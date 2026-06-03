import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell, Search, Users, Flame, CheckCircle, Filter, ArrowUpDown,
  TrendingUp, Minus, Zap, Calendar, ChevronRight, CircleHelp, RefreshCw,
} from 'lucide-react'
import { auth } from '../../utils/auth.js'
import AgentSidebar from '../../components/AgentSidebar.jsx'
import { getLeads, getTodayFollowUps, getTomorrowFollowUps } from '../../utils/leads.js'

const priorityConfig = {
  hot: { label: 'HOT', class: 'bg-red-50 text-red-700', icon: Flame },
  warm: { label: 'WARM', class: 'bg-orange-50 text-orange-700', icon: TrendingUp },
  cold: { label: 'COLD', class: 'bg-slate-100 text-slate-600', icon: Minus },
}

const statusClass = {
  new: 'bg-slate-100 text-slate-700',
  assigned: 'bg-blue-50 text-blue-700',
  contacted: 'bg-amber-50 text-amber-700',
  follow_up: 'bg-purple-50 text-purple-700',
  in_progress: 'bg-indigo-50 text-indigo-700',
  converted: 'bg-green-50 text-green-700',
  closed_lost: 'bg-red-50 text-red-700',
}

export default function AgentLeadManagement() {
  const navigate = useNavigate()
  const session = auth.get()
  const agentName = session?.name || 'Agent'
  const agentId = session?.id || ''
  const initials = agentName.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()

  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [todayFollowUps, setTodayFollowUps] = useState([])
  const [tomorrowFollowUps, setTomorrowFollowUps] = useState([])
  const [checkedTasks, setCheckedTasks] = useState({})
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!agentId) {
      setLoading(false)
      return
    }
    Promise.all([
      getLeads({ agentId }).catch(() => ({ leads: [] })),
      getTodayFollowUps().catch(() => []),
      getTomorrowFollowUps().catch(() => []),
    ])
      .then(([leadData, todayData, tomorrowData]) => {
        setLeads(leadData?.leads || [])
        setTodayFollowUps(Array.isArray(todayData) ? todayData : [])
        setTomorrowFollowUps(Array.isArray(tomorrowData) ? tomorrowData : [])
      })
      .finally(() => setLoading(false))
  }, [agentId])

  const toggleTask = (idx) => {
    setCheckedTasks((prev) => ({ ...prev, [idx]: !prev[idx] }))
  }

  const toTitleCase = (s) => s ? s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : ''

  const filteredLeads = leads.filter((l) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      `${l.firstName} ${l.lastName}`.toLowerCase().includes(search) ||
      l.email?.toLowerCase().includes(search) ||
      l.phone?.includes(search)
    )
  })

  const totalLeads = leads.length
  const hotLeads = leads.filter((l) => l.leadPriority === 'hot').length
  const convertedLeads = leads.filter((l) => l.status === 'converted').length

  const getLeadDisplay = (task) => {
    const lead = leads.find((l) => l.id === task.leadId || l.uuid === task.leadId)
    if (lead) {
      const name = `${lead.firstName || ''} ${lead.lastName || ''}`.trim()
      return name || lead.leadId || 'Lead'
    }
    return task.leadName || 'Lead'
  }

  const getTaskTitle = (task) => {
    const leadLabel = getLeadDisplay(task)
    const typeLabel = toTitleCase(task.type || 'Follow-Up')
    return `${typeLabel} — ${leadLabel}`
  }

  return (
    <div className="min-h-screen bg-[#eef3f8] text-slate-950">
      <div className="flex h-screen overflow-hidden">
        <AgentSidebar agentName={agentName} initials={initials} />
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex h-16 shrink-0 items-center border-b border-slate-200 bg-white px-6">
            <div className="text-base font-bold">Lead Management</div>
            <div className="relative ml-8 w-72">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search leads by name, email or phone..."
                className="h-9 w-full rounded-md border border-slate-300 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
            <div className="ml-auto flex items-center gap-4 text-slate-500">
              <Bell size={17} />
              <CircleHelp size={17} />
              <div className="grid h-9 w-9 place-items-center rounded-full bg-slate-900 text-xs font-bold text-white">
                {initials}
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="mx-auto max-w-7xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-500">Leads &gt; My Leads</div>
                  <h1 className="mt-1 text-2xl font-bold tracking-tight">My Leads Dashboard</h1>
                  <p className="mt-0.5 text-sm text-slate-500">Track your active pipeline and upcoming tasks.</p>
                </div>
              </div>

              <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <StatCard icon={Users} label="Total Leads" value={loading ? '...' : totalLeads} change="" changeClass="text-slate-500" />
                <StatCard icon={Bell} label="Due Today" value={loading ? '...' : todayFollowUps.length} change="Alert" changeClass={todayFollowUps.length > 0 ? 'text-orange-500' : 'text-green-600'} iconClass={todayFollowUps.length > 0 ? 'text-orange-500' : 'text-green-600'} />
                <StatCard icon={Flame} label="Hot Leads" value={loading ? '...' : hotLeads} change={hotLeads > 0 ? 'Urgent' : ''} changeClass="text-red-600" iconClass="text-red-500" />
                <StatCard icon={CheckCircle} label="Converted" value={loading ? '...' : convertedLeads} change={convertedLeads > 0 ? 'Success' : ''} changeClass="text-green-600" iconClass="text-green-600" />
              </section>

              <div className="flex flex-col xl:flex-row gap-6">
                <section className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                    <div className="text-base font-bold text-slate-800">My Assigned Leads</div>
                  </div>

                  {loading ? (
                    <div className="p-12 text-center">
                      <RefreshCw size={20} className="animate-spin text-blue-600 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">Loading leads...</p>
                    </div>
                  ) : filteredLeads.length === 0 ? (
                    <div className="p-12 text-center">
                      <p className="text-sm text-slate-400">No leads assigned to you yet.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                          <tr>
                            <th className="px-6 py-4 font-bold">Lead Details</th>
                            <th className="px-6 py-4 font-bold">Product</th>
                            <th className="px-6 py-4 font-bold">Priority</th>
                            <th className="px-6 py-4 font-bold">Status</th>
                            <th className="px-6 py-4 font-bold">Last Activity</th>
                            <th className="px-6 py-4 text-right font-bold">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredLeads.map((lead) => {
                            const pc = priorityConfig[lead.leadPriority] || priorityConfig.cold
                            const PriorityIcon = pc.icon
                            const leadName = `${lead.firstName} ${lead.lastName}`
                            const leadInitials = leadName.split(' ').map(n => n[0]).join('')
                            const products = lead.productInterest ? Object.entries(lead.productInterest).filter(([,v]) => v).map(([k]) => k).join(', ') : '-'

                            return (
                              <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="grid h-8 w-8 place-items-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                                      {leadInitials}
                                    </div>
                                    <div>
                                      <div className="font-semibold text-slate-900">{leadName}</div>
                                      <div className="text-xs text-slate-500">{lead.phone}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-700">{products}</td>
                                <td className="px-6 py-4">
                                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${pc.class}`}>
                                    <PriorityIcon size={12} />
                                    {pc.label}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${statusClass[lead.status] || 'bg-slate-100 text-slate-600'}`}>
                                    {toTitleCase(lead.status)}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-500">
                                  {lead.lastActivityDate ? new Date(lead.lastActivityDate).toLocaleDateString() : 'N/A'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <button
                                    onClick={() => navigate(`/agent/leads/${lead.id}`)}
                                    className="text-xs font-bold text-blue-700 hover:underline decoration-2"
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
                  )}
                </section>

                <section className="w-full xl:w-[340px] space-y-6">
                  <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="bg-orange-500 px-5 py-4 flex items-center justify-between text-white">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <Zap size={16} />
                        Today's Action Items
                      </div>
                      <span className="rounded bg-white/20 px-2 py-0.5 text-xs font-bold">{todayFollowUps.length} TASKS</span>
                    </div>
                    <div className="p-4 space-y-3 max-h-[340px] overflow-y-auto">
                      {todayFollowUps.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-4">No tasks for today.</p>
                      ) : (
                        todayFollowUps.map((task, idx) => (
                          <label
                            key={task.id || idx}
                            className={`flex items-start gap-4 rounded-lg p-3 transition cursor-pointer ${
                              checkedTasks[idx] ? 'opacity-50' : 'hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={!!checkedTasks[idx]}
                              onChange={() => toggleTask(idx)}
                              className="mt-0.5 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                            />
                            <div className="min-w-0">
                              <p className={`text-sm font-bold text-slate-900 ${checkedTasks[idx] ? 'line-through' : ''}`}>
                                {getTaskTitle(task)}
                              </p>
                              <p className={`text-xs text-slate-500 mt-0.5 ${checkedTasks[idx] ? 'line-through' : ''}`}>
                                {task.notes || 'No notes'}
                              </p>
                              <div className="flex gap-2 mt-1.5">
                                <span className="rounded px-2 py-0.5 text-[10px] font-bold bg-orange-50 text-orange-700">
                                  {new Date(task.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="bg-blue-700 px-5 py-4 flex items-center justify-between text-white">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <Calendar size={16} />
                        Tomorrow
                      </div>
                      <span className="rounded bg-white/20 px-2 py-0.5 text-xs font-bold">{tomorrowFollowUps.length} TASKS</span>
                    </div>
                    <div className="p-4 space-y-3">
                      {tomorrowFollowUps.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-4">No tasks for tomorrow.</p>
                      ) : (
                        tomorrowFollowUps.map((task, idx) => (
                          <div key={task.id || idx} className="flex items-start gap-4 rounded-lg p-3 opacity-70">
                            <input type="checkbox" disabled className="mt-0.5 rounded border-slate-300 bg-slate-100 text-slate-400" />
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-900">{getTaskTitle(task)}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{task.notes || 'No notes'}</p>
                              <div className="flex gap-2 mt-1.5">
                                <span className="rounded px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700">
                                  {new Date(task.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
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
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</span>
        <Icon size={20} className={iconClass || 'text-blue-700'} />
      </div>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold tracking-tight">{value}</span>
        {change && <span className={`text-xs font-bold mb-0.5 ${changeClass}`}>{change}</span>}
      </div>
    </div>
  )
}
