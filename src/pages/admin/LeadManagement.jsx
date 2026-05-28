import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

const leadData = [
  { id: '#LM-8421', name: 'Johnathan Doe', phone: '+1 (555) 0123', product: 'Enterprise SaaS', agent: 'S. Jenkins', agentInitials: 'SJ', priority: 'Hot', priorityStyle: 'bg-red-100 text-red-700 border-red-200', status: 'Interested', statusStyle: 'bg-blue-50 text-blue-700', lastActivity: '2h ago', followUp: 'Today, 4:00 PM', followUpUrgent: true },
  { id: '#LM-8422', name: 'Sarah Miller', phone: '+1 (555) 0456', product: 'Cloud Infrastructure', agent: 'M. Chen', agentInitials: 'MC', priority: 'Warm', priorityStyle: 'bg-orange-100 text-orange-700 border-orange-200', status: 'In Progress', statusStyle: 'bg-amber-50 text-amber-700', lastActivity: '5h ago', followUp: 'Tomorrow, 10:00 AM', followUpUrgent: false },
  { id: '#LM-8423', name: 'Bruce Wayne', phone: '+1 (555) 0912', product: 'Security Suite', agent: 'E. Wilson', agentInitials: 'EW', priority: 'Cold', priorityStyle: 'bg-blue-100 text-blue-700 border-blue-200', status: 'New', statusStyle: 'bg-gray-100 text-gray-700', lastActivity: '1d ago', followUp: 'Oct 24, 2023', followUpUrgent: false },
  { id: '#LM-8424', name: 'Diana Prince', phone: '+1 (555) 0777', product: 'Premium ERP', agent: 'S. Jenkins', agentInitials: 'SJ', priority: 'Hot', priorityStyle: 'bg-red-100 text-red-700 border-red-200', status: 'Converted', statusStyle: 'bg-green-100 text-green-700', lastActivity: '3h ago', followUp: 'Completed', followUpUrgent: false },
  { id: '#LM-8425', name: 'Arthur Knight', phone: '+1 (555) 0331', product: 'AI Analytics', agent: 'E. Wilson', agentInitials: 'EW', priority: 'Warm', priorityStyle: 'bg-orange-100 text-orange-700 border-orange-200', status: 'Quote Sent', statusStyle: 'bg-blue-50 text-blue-700', lastActivity: '12h ago', followUp: 'Oct 26, 2023', followUpUrgent: false },
  { id: '#LM-8426', name: 'Tony Lewis', phone: '+1 (555) 0552', product: 'Data Warehouse', agent: 'M. Chen', agentInitials: 'MC', priority: 'Hot', priorityStyle: 'bg-red-100 text-red-700 border-red-200', status: 'Negotiation', statusStyle: 'bg-amber-50 text-amber-700', lastActivity: '1h ago', followUp: 'Overdue (2d)', followUpUrgent: true },
  { id: '#LM-8427', name: 'Rebecca Vance', phone: '+1 (555) 0119', product: 'SaaS Pro', agent: 'S. Jenkins', agentInitials: 'SJ', priority: 'Cold', priorityStyle: 'bg-blue-100 text-blue-700 border-blue-200', status: 'Lost', statusStyle: 'bg-red-50 text-red-700', lastActivity: '3d ago', followUp: 'N/A', followUpUrgent: false },
  { id: '#LM-8428', name: 'Kevin Smith', phone: '+1 (555) 0884', product: 'ERP Module', agent: 'E. Wilson', agentInitials: 'EW', priority: 'Warm', priorityStyle: 'bg-orange-100 text-orange-700 border-orange-200', status: 'Contacted', statusStyle: 'bg-amber-50 text-amber-700', lastActivity: '45m ago', followUp: 'Today, 5:30 PM', followUpUrgent: false }
]

const initialsBg = {
  'SJ': 'bg-purple-500',
  'MC': 'bg-cyan-500',
  'EW': 'bg-pink-500'
}

export default function LeadManagement() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [agentFilter, setAgentFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')

  const filteredLeads = leadData.filter((lead) => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.id.toLowerCase().includes(searchTerm.toLowerCase())
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
            <h3 className="text-3xl font-bold text-blue-600">124</h3>
            <span className="text-xs font-bold flex items-center text-green-600">
              <TrendingUp size={16} /> +12%
            </span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-500 transition-colors">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">New</p>
          <h3 className="text-3xl font-bold text-slate-800">18</h3>
          <div className="h-1 w-full bg-slate-100 mt-3 rounded-full overflow-hidden">
            <div className="bg-blue-500 h-full w-[15%]" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-500 transition-colors">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">In Progress</p>
          <h3 className="text-3xl font-bold text-slate-800">45</h3>
          <div className="h-1 w-full bg-slate-100 mt-3 rounded-full overflow-hidden">
            <div className="bg-amber-500 h-full w-[36%]" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-500 transition-colors">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Converted</p>
          <h3 className="text-3xl font-bold text-slate-800">23</h3>
          <div className="h-1 w-full bg-slate-100 mt-3 rounded-full overflow-hidden">
            <div className="bg-green-500 h-full w-[18%]" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-500 transition-colors">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Closed</p>
          <h3 className="text-3xl font-bold text-slate-800">12</h3>
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
          <option>Status: All</option>
          <option>New</option>
          <option>Interested</option>
          <option>In Progress</option>
          <option>Quote Sent</option>
          <option>Negotiation</option>
          <option>Converted</option>
          <option>Lost</option>
          <option>Contacted</option>
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
                  <td className="px-6 py-4 text-sm text-slate-500">{lead.id}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold border border-blue-200">
                        {lead.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{lead.name}</p>
                        <p className="text-xs text-slate-500">{lead.phone}</p>
                      </div>
                    </div>
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
          <p className="text-sm text-slate-500">Showing {filteredLeads.length} of 124 leads</p>
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
