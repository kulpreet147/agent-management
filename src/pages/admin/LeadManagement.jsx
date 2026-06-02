import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  UserPlus,
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreVertical
} from 'lucide-react'
import StatCard from '../../components/StatCard.jsx'

const leadData = [
  { id: '#LM-8421', name: 'Johnathan Doe', phone: '+1 (555) 0123', email: 'john.doe@provider.com', product: 'Enterprise SaaS', agent: 'S. Jenkins', agentInitials: 'SJ', priority: 'Hot', priorityStyle: 'bg-red-100 text-red-700 border-red-200', status: 'Interested', statusStyle: 'bg-blue-50 text-blue-700', lastActivity: '2h ago', followUp: 'Today, 4:00 PM', followUpUrgent: true },
  { id: '#LM-8422', name: 'Sarah Miller', phone: '+1 (555) 0456', email: 's.miller@provider.com', product: 'Cloud Infrastructure', agent: 'M. Chen', agentInitials: 'MC', priority: 'Warm', priorityStyle: 'bg-orange-100 text-orange-700 border-orange-200', status: 'In Progress', statusStyle: 'bg-amber-50 text-amber-700', lastActivity: '5h ago', followUp: 'Tomorrow, 10:00 AM', followUpUrgent: false },
  { id: '#LM-8423', name: 'Bruce Wayne', phone: '+1 (555) 0912', email: 'b.wayne@provider.com', product: 'Security Suite', agent: 'E. Wilson', agentInitials: 'EW', priority: 'Cold', priorityStyle: 'bg-blue-100 text-blue-700 border-blue-200', status: 'New', statusStyle: 'bg-gray-100 text-gray-700', lastActivity: '1d ago', followUp: 'Oct 24, 2023', followUpUrgent: false },
  { id: '#LM-8424', name: 'Diana Prince', phone: '+1 (555) 0777', email: 'd.prince@provider.com', product: 'Premium ERP', agent: 'S. Jenkins', agentInitials: 'SJ', priority: 'Hot', priorityStyle: 'bg-red-100 text-red-700 border-red-200', status: 'Converted', statusStyle: 'bg-green-100 text-green-700', lastActivity: '3h ago', followUp: 'Completed', followUpUrgent: false },
  { id: '#LM-8425', name: 'Arthur Knight', phone: '+1 (555) 0331', email: 'a.knight@provider.com', product: 'AI Analytics', agent: 'E. Wilson', agentInitials: 'EW', priority: 'Warm', priorityStyle: 'bg-orange-100 text-orange-700 border-orange-200', status: 'Quote Sent', statusStyle: 'bg-blue-50 text-blue-700', lastActivity: '12h ago', followUp: 'Oct 26, 2023', followUpUrgent: false },
  { id: '#LM-8426', name: 'Tony Lewis', phone: '+1 (555) 0552', email: 't.lewis@provider.com', product: 'Data Warehouse', agent: 'M. Chen', agentInitials: 'MC', priority: 'Hot', priorityStyle: 'bg-red-100 text-red-700 border-red-200', status: 'Negotiation', statusStyle: 'bg-amber-50 text-amber-700', lastActivity: '1h ago', followUp: 'Overdue (2d)', followUpUrgent: true },
  { id: '#LM-8427', name: 'Rebecca Vance', phone: '+1 (555) 0119', email: 'r.vance@provider.com', product: 'SaaS Pro', agent: 'S. Jenkins', agentInitials: 'SJ', priority: 'Cold', priorityStyle: 'bg-blue-100 text-blue-700 border-blue-200', status: 'Lost', statusStyle: 'bg-red-50 text-red-700', lastActivity: '3d ago', followUp: 'N/A', followUpUrgent: false },
  { id: '#LM-8428', name: 'Kevin Smith', phone: '+1 (555) 0884', email: 'k.smith@provider.com', product: 'ERP Module', agent: 'E. Wilson', agentInitials: 'EW', priority: 'Warm', priorityStyle: 'bg-orange-100 text-orange-700 border-orange-200', status: 'Contacted', statusStyle: 'bg-amber-50 text-amber-700', lastActivity: '45m ago', followUp: 'Today, 5:30 PM', followUpUrgent: false }
]

const initialsBg = {
  SJ: 'bg-purple-500',
  MC: 'bg-cyan-500',
  EW: 'bg-pink-500'
}

export default function LeadManagement() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [agentFilter, setAgentFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 8

  const filteredLeads = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()

    return leadData.filter((lead) => {
      const matchesSearch =
        !q ||
        lead.name.toLowerCase().includes(q) ||
        lead.id.toLowerCase().includes(q) ||
        lead.email.toLowerCase().includes(q)
      const matchesStatus = statusFilter === 'All' || lead.status === statusFilter
      const matchesAgent = agentFilter === 'All' || lead.agent.includes(agentFilter)
      const matchesPriority = priorityFilter === 'All' || lead.priority === priorityFilter

      return matchesSearch && matchesStatus && matchesAgent && matchesPriority
    })
  }, [agentFilter, priorityFilter, searchTerm, statusFilter])

  useEffect(() => {
    setCurrentPage(1)
  }, [agentFilter, priorityFilter, searchTerm, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedLeads = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize
    return filteredLeads.slice(startIndex, startIndex + pageSize)
  }, [filteredLeads, safeCurrentPage])

  const leadStats = useMemo(() => {
    const total = filteredLeads.length
    const countByStatus = (status) => filteredLeads.filter((lead) => lead.status === status).length
    const closedCount = filteredLeads.filter((lead) => ['Lost', 'Closed'].includes(lead.status)).length

    return [
      { label: 'Total Leads', value: total, tone: 'blue' },
      { label: 'New', value: countByStatus('New'), tone: 'indigo' },
      { label: 'In Progress', value: countByStatus('In Progress'), tone: 'amber' },
      { label: 'Converted', value: countByStatus('Converted'), tone: 'emerald' },
      { label: 'Closed', value: closedCount, tone: 'slate' },
    ]
  }, [filteredLeads])

  const clearFilters = () => {
    setStatusFilter('All')
    setAgentFilter('All')
    setPriorityFilter('All')
    setSearchTerm('')
    setCurrentPage(1)
  }

  const goToPage = (page) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages)
    setCurrentPage(nextPage)
  }

  const paginationPages = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1)
    }

    if (safeCurrentPage <= 3) {
      return [1, 2, 3, 4, 'ellipsis', totalPages]
    }

    if (safeCurrentPage >= totalPages - 2) {
      return [1, 'ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    }

    return [1, 'ellipsis', safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, 'ellipsis', totalPages]
  }, [safeCurrentPage, totalPages])

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-full min-h-0 flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Lead Management</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              View and manage all leads across your sales pipeline.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-72">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search leads..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <button
              type="button"
              onClick={() => navigate('/admin/leads/new')}
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <UserPlus size={16} className="mr-2" />
              Add New Lead
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {leadStats.map((stat) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              tone={stat.tone}
              compact
            />
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-slate-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Filters:</span>
              </div>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="min-w-[130px] rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
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
                onChange={(event) => setAgentFilter(event.target.value)}
                className="min-w-[130px] rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option>Agent: All</option>
                <option>Sarah Jenkins</option>
                <option>Michael Chen</option>
                <option>Emma Wilson</option>
              </select>
              <select
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value)}
                className="min-w-[130px] rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option>Priority: All</option>
                <option>Hot</option>
                <option>Warm</option>
                <option>Cold</option>
              </select>
              <input
                className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                type="date"
              />
            </div>
            <button
              onClick={clearFilters}
              className="text-xs font-bold uppercase tracking-wider text-blue-600 hover:underline"
            >
              Clear All
            </button>
          </div>
        </div>

        <div className="mt-6 min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200">
          <div className="h-full overflow-x-auto overflow-y-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">Lead ID</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Agent</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Last Activity</th>
                  <th className="px-6 py-4">Follow-up Due</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedLeads.map((lead) => (
                  <tr key={lead.id} className="group transition hover:bg-slate-50">
                    <td className="px-6 py-4 text-slate-500">{lead.id}</td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/leads/${lead.id.replace('#', '')}`, { state: { lead } })}
                        className="flex items-center gap-3 text-left transition-opacity hover:opacity-80"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-blue-200 bg-blue-100 text-xs font-bold text-blue-700">
                          {lead.name.split(' ').map((part) => part[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{lead.name}</p>
                          <p className="text-xs text-slate-500">{lead.phone}</p>
                        </div>
                      </button>
                    </td>
                    <td className="px-6 py-4">{lead.product}</td>
                    <td className="px-6 py-4">
                      <div className="flex w-fit items-center gap-2 rounded-full bg-slate-100 px-2 py-1">
                        <div className={`flex h-5 w-5 items-center justify-center rounded-full ${initialsBg[lead.agentInitials] || 'bg-blue-500'} text-[8px] font-bold text-white`}>
                          {lead.agentInitials}
                        </div>
                        <span className="text-xs">{lead.agent}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${lead.priorityStyle}`}>
                        {lead.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`${lead.statusStyle} rounded-md px-2.5 py-1 text-xs font-medium`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{lead.lastActivity}</td>
                    <td className={`px-6 py-4 ${lead.followUpUrgent ? 'font-semibold text-red-600' : 'text-slate-500'}`}>
                      {lead.followUp}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="rounded p-1 opacity-0 transition-colors group-hover:opacity-100 hover:bg-slate-100">
                        <MoreVertical size={18} className="text-slate-400 group-hover:text-blue-600" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
          <p className="text-sm text-slate-500">
            Showing {(safeCurrentPage - 1) * pageSize + 1}-{Math.min(safeCurrentPage * pageSize, filteredLeads.length)} of {filteredLeads.length} leads
          </p>
          <div className="flex items-center gap-2">
            <button
              className="rounded border border-slate-200 p-2 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={safeCurrentPage === 1}
              onClick={() => goToPage(safeCurrentPage - 1)}
            >
              <ChevronLeft size={18} className="text-slate-500" />
            </button>
            {paginationPages.map((page, index) =>
              page === 'ellipsis' ? (
                <span key={`ellipsis-${index}`} className="px-1 text-slate-400">
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`h-8 w-8 rounded text-xs font-bold ${
                    page === safeCurrentPage
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {page}
                </button>
              ),
            )}
            <button
              className="rounded border border-slate-200 p-2 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={safeCurrentPage === totalPages}
              onClick={() => goToPage(safeCurrentPage + 1)}
            >
              <ChevronRight size={18} className="text-slate-500" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
