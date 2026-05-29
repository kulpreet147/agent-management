import { useState } from 'react'
import { BarChart3, Download, Filter, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'

const statCards = [
  { label: 'Total Created', value: '1,482', change: '+12%', changeClass: 'text-blue-600' },
  { label: 'Converted', value: '342', change: '+8%', changeClass: 'text-blue-600' },
  { label: 'Conv. Rate %', value: '23.1%', change: '+2.4%', changeClass: 'text-blue-600' },
  { label: 'Avg Time (Days)', value: '4.2', change: '-0.5', changeClass: 'text-red-500' },
  { label: 'Active Agents', value: '48', change: '--', changeClass: 'text-slate-400' },
  { label: 'Unworked', value: '89', change: '+14', changeClass: 'text-red-500' },
]

const agents = [
  { name: 'Sarah Jenkins', assigned: 140, converted: 50, rate: '35%' },
  { name: 'Michael Chen', assigned: 130, converted: 56, rate: '43%' },
  { name: 'Elena Rodriguez', assigned: 160, converted: 40, rate: '25%' },
  { name: 'James Wilson', assigned: 110, converted: 64, rate: '58%' },
]

const maxAssigned = Math.max(...agents.map(a => a.assigned))

const agingLeads = [
  { name: 'Global Dynamics Corp', agent: 'Sarah Jenkins', initials: 'SJ', bg: 'bg-blue-500', days: '18', daysClass: 'text-red-500 font-bold', status: 'Contacted', statusClass: 'bg-blue-50 text-blue-700', priority: 'High', priorityDot: 'bg-red-500', action: 'Reassign', actionClass: 'text-blue-600' },
  { name: 'Apex Logistics Solutions', agent: 'Michael Chen', initials: 'MC', bg: 'bg-slate-400', days: '21', daysClass: 'text-red-500 font-bold', status: 'New Lead', statusClass: 'bg-orange-50 text-orange-700', priority: 'High', priorityDot: 'bg-red-500', action: 'Reassign', actionClass: 'text-blue-600' },
  { name: 'Blue Horizon Ventures', agent: 'Elena Rodriguez', initials: 'ER', bg: 'bg-amber-400', days: '4', daysClass: 'text-slate-500', status: 'Qualified', statusClass: 'bg-indigo-50 text-indigo-700', priority: 'Medium', priorityDot: 'bg-slate-400', action: 'View', actionClass: 'text-slate-500' },
  { name: 'Starlight Enterprises', agent: 'James Wilson', initials: 'JW', bg: 'bg-green-500', days: '15', daysClass: 'text-red-500 font-bold', status: 'Follow-up', statusClass: 'bg-blue-50 text-blue-700', priority: 'High', priorityDot: 'bg-red-500', action: 'Reassign', actionClass: 'text-blue-600' },
]

const tabs = ['Today', '7 Days', '30 Days', 'Custom']

export default function Analytics() {
  const [activeTab, setActiveTab] = useState('Today')

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Lead Reports &amp; Analytics</h2>
          <p className="text-[13px] text-slate-500 mt-1">Real-time enterprise performance metrics and aging analysis.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-[11px] font-bold rounded-md transition ${
                activeTab === tab
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-blue-400 transition-all">
            <p className="text-[11px] text-slate-500 font-semibold mb-2">{card.label}</p>
            <div className="flex items-baseline justify-between">
              <h3 className="text-xl font-bold text-slate-900">{card.value}</h3>
              <span className={`text-[11px] font-bold ${card.changeClass}`}>{card.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Status Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-base font-bold">Lead Status Distribution</h4>
            <MoreHorizontal size={18} className="text-slate-400" />
          </div>
          <div className="flex items-center gap-8">
            {/* Donut */}
            <div className="relative w-48 h-48">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#eaeef2" strokeWidth="12" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#00288e" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset="138.16" strokeLinecap="round" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#dae2fd" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset="213.52" strokeLinecap="round" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#ffb59a" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset="241.15" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-2xl font-bold text-blue-600 block">1.4k</span>
                  <span className="text-[10px] text-slate-500">Total</span>
                </div>
              </div>
            </div>
            {/* Legend */}
            <div className="flex-1 space-y-3">
              {[
                { color: 'bg-blue-600', label: 'New Leads', pct: '45%' },
                { color: 'bg-indigo-200', label: 'Contacted', pct: '28%' },
                { color: 'bg-orange-200', label: 'Converted', pct: '23%' },
                { color: 'bg-slate-300', label: 'Qualified Out', pct: '4%' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className="text-[13px]">{item.label}</span>
                  </div>
                  <span className="text-[13px] font-bold">{item.pct}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Leads by Source */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-base font-bold">Leads by Source</h4>
            <MoreHorizontal size={18} className="text-slate-400" />
          </div>
          <div className="flex items-end gap-6 h-48">
            {[
              { label: 'LinkedIn', h: '80%' },
              { label: 'Website', h: '60%' },
              { label: 'Referral', h: '45%' },
              { label: 'Cold Email', h: '95%' },
              { label: 'Events', h: '30%' },
            ].map((source) => (
              <div key={source.label} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-blue-600 rounded-t-lg transition-all hover:opacity-80"
                  style={{ height: source.h }}
                />
                <span className="text-[11px] text-slate-500">{source.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Agent Performance Overview */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h4 className="text-base font-bold">Agent Performance Overview</h4>
            <p className="text-[12px] text-slate-500 mt-0.5">Leads Assigned vs. Converted per top performing agent.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-600" />
              <span className="text-[11px] font-semibold">Assigned</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-indigo-200" />
              <span className="text-[11px] font-semibold">Converted</span>
            </div>
          </div>
        </div>
        <div className="space-y-5">
          {agents.map((a) => (
            <div key={a.name} className="flex items-center gap-6">
              <div className="w-32 text-[13px] font-semibold">{a.name}</div>
              <div className="flex-1 h-8 flex gap-0.5 rounded overflow-hidden bg-slate-100">
                <div className="h-full bg-blue-600 transition-all" style={{ width: `${(a.assigned / maxAssigned) * 100}%` }} title={`Assigned: ${a.assigned}`} />
                <div className="h-full bg-indigo-200 transition-all" style={{ width: `${(a.converted / maxAssigned) * 100}%` }} title={`Converted: ${a.converted}`} />
              </div>
              <div className="w-14 text-right text-[13px] font-bold text-blue-600">{a.rate}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Lead Aging Report Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <h4 className="text-base font-bold">Lead Aging Report</h4>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              <Filter size={14} /> Filter
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              <Download size={14} /> Export
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                <th className="px-6 py-4">Lead Name</th>
                <th className="px-6 py-4">Assigned Agent</th>
                <th className="px-6 py-4">Last Activity</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {agingLeads.map((lead) => (
                <tr key={lead.name} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-[13px] font-semibold">{lead.name}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full ${lead.bg} text-white text-[10px] flex items-center justify-center font-bold`}>
                        {lead.initials}
                      </div>
                      <span className="text-[13px]">{lead.agent}</span>
                    </div>
                  </td>
                  <td className={`px-6 py-4 text-[13px] ${lead.daysClass}`}>{lead.days} Days</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${lead.statusClass}`}>{lead.status}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5 text-[13px]">
                      <span className={`w-2 h-2 rounded-full ${lead.priorityDot}`} />
                      {lead.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className={`text-[11px] font-bold hover:underline ${lead.actionClass}`}>{lead.action}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[12px] text-slate-500">Showing 4 of 89 unworked leads</span>
          <div className="flex gap-2">
            <button className="p-1.5 border border-slate-200 rounded hover:bg-white transition-colors opacity-50 cursor-not-allowed">
              <ChevronLeft size={16} className="text-slate-400" />
            </button>
            <button className="p-1.5 border border-slate-200 rounded hover:bg-white transition-colors">
              <ChevronRight size={16} className="text-slate-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
