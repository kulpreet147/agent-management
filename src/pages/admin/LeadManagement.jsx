import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLeads } from '../../utils/leads.js'
import {
  Search,
  Upload,
  UserPlus,
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  TrendingUp
} from 'lucide-react'

const priorityStyles = {
  Hot: 'bg-red-100 text-red-700 border-red-200',
  Warm: 'bg-orange-100 text-orange-700 border-orange-200',
  Cold: 'bg-blue-100 text-blue-700 border-blue-200',
}
const statusStyles = {
  New: 'bg-gray-100 text-gray-700',
  Assigned: 'bg-blue-50 text-blue-700',
  Contacted: 'bg-amber-50 text-amber-700',
  FollowUp: 'bg-purple-50 text-purple-700',
  InProgress: 'bg-amber-50 text-amber-700',
  Converted: 'bg-green-100 text-green-700',
  ClosedLost: 'bg-red-50 text-red-700',
}

const initialsBg = {
  'SJ': 'bg-purple-500',
  'MC': 'bg-cyan-500',
  'EW': 'bg-pink-500'
}

export default function LeadManagement() {
  const navigate = useNavigate()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [agentFilter, setAgentFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')

  useEffect(() => {
    getLeads()
      .then((data) => {
        const leadList = Array.isArray(data) ? data : (data?.leads || [])
        setLeads(leadList)
      })
      .catch((err) => {
        console.error('Failed to fetch leads:', err)
        setLeads([])
      })
      .finally(() => setLoading(false))
  }, [])

  const toTitleCase = (s) => s ? s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : ''
  const initials = (name) => name ? name.split(' ').map((n) => n[0]).join('') : ''
  const formatActivityDate = (d) => {
    if (!d) return 'N/A'
    const diff = Date.now() - new Date(d).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  const leadData = loading ? [] : leads.length > 0 ? leads.map((l) => ({
    id: l.id,
    leadId: l.leadId,
    name: `${l.firstName} ${l.lastName}`,
    phone: l.phone,
    email: l.email || '',
    product: l.productInterest ? Object.keys(l.productInterest).filter((k) => l.productInterest[k]).join(', ') : '',
    agent: (() => {
      const active = (l.assignments || []).filter(a => a.isActive);
      if (active.length === 0) return 'Unassigned';
      return active.map(a => a.agentName || a.agentId).join(' / ');
    })(),
    agentInitials: (() => {
      const active = (l.assignments || []).filter(a => a.isActive);
      if (active.length === 0) return '--';
      return active.map(a => initials(a.agentName || a.agentId)).join('/');
    })(),
    priority: l.leadPriority ? toTitleCase(l.leadPriority) : 'Cold',
    priorityStyle: priorityStyles[l.leadPriority ? toTitleCase(l.leadPriority) : 'Cold'] || priorityStyles.Cold,
    status: l.status ? toTitleCase(l.status) : 'New',
    statusStyle: statusStyles[l.status ? toTitleCase(l.status) : 'New'] || statusStyles.New,
    lastActivity: formatActivityDate(l.lastActivityDate),
    followUp: '',
    followUpUrgent: false,
  })) : []

  const filteredLeads = leadData.filter((lead) => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.leadId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'All' || lead.status === statusFilter
    const matchesAgent = agentFilter === 'All' || lead.agent.includes(agentFilter)
    const matchesPriority = priorityFilter === 'All' || lead.priority === priorityFilter
    return matchesSearch && matchesStatus && matchesAgent && matchesPriority
  })

  const clearFilters = () => {
    setStatusFilter('All')
    setAgentFilter('All')
    setPriorityFilter('All')
    setSearchTerm('')
  }

  const newCount = leadData.filter((l) => l.status === 'New').length
  const inProgressCount = leadData.filter((l) => l.status === 'In Progress' || l.status === 'Assigned' || l.status === 'Contacted').length
  const convertedCount = leadData.filter((l) => l.status === 'Converted').length
  const closedCount = leadData.filter((l) => l.status === 'Closed Lost').length

  return (
    <div>
      <section className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="relative w-full max-w-[300px]">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm transition-all"
            placeholder="Search by name, ID..."
            type="text"
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="px-5 py-2.5 border border-slate-300 text-slate-700 text-xs font-bold tracking-wider rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 uppercase">
            <Upload size={16} />
            Import Leads
          </button>
          <button
            onClick={() => navigate('/admin/leads/new')}
            className="px-5 py-2.5 bg-blue-600 text-white text-xs font-bold tracking-wider rounded-lg hover:bg-blue-700 shadow-md transition-all active:scale-95 flex items-center gap-2 uppercase"
          >
            <UserPlus size={16} />
            Add New Lead
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-500 transition-colors">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Leads</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-bold text-blue-600">{leadData.length}</h3>
            <span className="text-xs font-bold flex items-center text-green-600">
              <TrendingUp size={16} /> +12%
            </span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-500 transition-colors">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">New</p>
          <h3 className="text-3xl font-bold text-slate-800">{newCount}</h3>
          <div className="h-1 w-full bg-slate-100 mt-3 rounded-full overflow-hidden">
            <div className="bg-blue-500 h-full w-[15%]" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-500 transition-colors">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">In Progress</p>
          <h3 className="text-3xl font-bold text-slate-800">{inProgressCount}</h3>
          <div className="h-1 w-full bg-slate-100 mt-3 rounded-full overflow-hidden">
            <div className="bg-amber-500 h-full w-[36%]" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-500 transition-colors">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Converted</p>
          <h3 className="text-3xl font-bold text-slate-800">{convertedCount}</h3>
          <div className="h-1 w-full bg-slate-100 mt-3 rounded-full overflow-hidden">
            <div className="bg-green-500 h-full w-[18%]" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-500 transition-colors">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Closed</p>
          <h3 className="text-3xl font-bold text-slate-800">{closedCount}</h3>
          <div className="h-1 w-full bg-slate-100 mt-3 rounded-full overflow-hidden">
            <div className="bg-gray-400 h-full w-[10%]" />
          </div>
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-slate-500" />
          <span className="text-xs font-bold text-slate-700 tracking-wider">Filters:</span>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-blue-500 min-w-[120px] outline-none"
        >
          <option value="All">Status: All</option>
          <option value="New">New</option>
          <option value="Assigned">Assigned</option>
          <option value="Contacted">Contacted</option>
          <option value="Follow Up">Follow Up</option>
          <option value="In Progress">In Progress</option>
          <option value="Converted">Converted</option>
          <option value="Closed Lost">Closed Lost</option>
        </select>
        <select
          value={agentFilter}
          onChange={(e) => setAgentFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-blue-500 min-w-[120px] outline-none"
        >
          <option>Agent: All</option>
          <option>Sarah Jenkins</option>
          <option>Michael Chen</option>
          <option>Emma Wilson</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-blue-500 min-w-[120px] outline-none"
        >
          <option>Priority: All</option>
          <option>Hot</option>
          <option>Warm</option>
          <option>Cold</option>
        </select>
        <div className="relative">
          <input
            className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
            type="date"
          />
        </div>
        <button onClick={clearFilters} className="ml-auto text-blue-600 text-xs font-bold tracking-wider hover:underline uppercase">
          Clear All
        </button>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Lead ID</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Agent</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Last Activity</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Follow-up Due</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 text-sm text-slate-500">{lead.leadId}</td>
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/leads/${lead.id}`, { state: { lead } })}
                      className="flex items-center gap-3 hover:opacity-80 transition-opacity text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold border border-blue-200">
                        {lead.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{lead.name}</p>
                        <p className="text-xs text-slate-500">{lead.phone}</p>
                      </div>
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm">{lead.product}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 bg-slate-100 px-2 py-1 rounded-full w-fit">
                      <div className={`w-5 h-5 rounded-full ${initialsBg[lead.agentInitials] || 'bg-blue-500'} flex items-center justify-center text-white text-[8px] font-bold`}>
                        {lead.agentInitials}
                      </div>
                      <span className="text-xs">{lead.agent}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest border ${lead.priorityStyle}`}>
                      {lead.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`${lead.statusStyle} px-2.5 py-1 rounded-md text-xs font-medium`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{lead.lastActivity}</td>
                  <td className={`px-6 py-4 text-sm ${lead.followUpUrgent ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
                    {lead.followUp}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-1 hover:bg-slate-100 rounded transition-colors opacity-0 group-hover:opacity-100">
                      <MoreVertical size={18} className="text-slate-400 group-hover:text-blue-600" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-white">
          <p className="text-sm text-slate-500">Showing {filteredLeads.length} of {loading ? '...' : leadData.length} leads</p>
          <div className="flex items-center gap-2">
            <button className="p-2 border border-slate-200 rounded hover:bg-slate-50 transition-colors disabled:opacity-50" disabled>
              <ChevronLeft size={18} className="text-slate-500" />
            </button>
            <button className="w-8 h-8 rounded bg-blue-600 text-white text-xs font-bold">1</button>
            <button className="w-8 h-8 rounded hover:bg-slate-50 text-xs font-bold text-slate-600">2</button>
            <button className="w-8 h-8 rounded hover:bg-slate-50 text-xs font-bold text-slate-600">3</button>
            <span className="px-1 text-slate-400">...</span>
            <button className="w-8 h-8 rounded hover:bg-slate-50 text-xs font-bold text-slate-600">16</button>
            <button className="p-2 border border-slate-200 rounded hover:bg-slate-50 transition-colors">
              <ChevronRight size={18} className="text-slate-500" />
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
