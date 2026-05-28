import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  Clock,
  FileCheck,
  AlertTriangle,
  Search,
  UserPlus,
  Eye,
  PenLine,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  BarChart3,
  AlertCircle
} from 'lucide-react'
import { recentAgents } from '../data/dummy.js'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')

  const filteredAgents = recentAgents.filter((a) =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const statusBadge = (status) => {
    const styles = {
      Active: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
      Pending: 'bg-amber-50 text-amber-700 border border-amber-100'
    }
    return styles[status] || 'bg-slate-100 text-slate-600 border border-slate-200'
  }

  return (
    <div className="max-w-[1750px] mx-auto w-full">
      <div className="mb-10">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Administrative Overview</h2>
        <p className="text-base text-slate-500 font-medium">
          Real-time performance metrics and workforce compliance monitoring.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
          <div className="flex justify-between items-center mb-6">
            <div className="w-12 h-12 flex items-center justify-center bg-blue-50 text-blue-600 rounded-xl">
              <Users size={24} />
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
              <TrendingUp size={14} /> 4%
            </span>
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Agents</p>
          <p className="text-2xl font-extrabold text-slate-900">{recentAgents.length}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
          <div className="flex justify-between items-center mb-6">
            <div className="w-12 h-12 flex items-center justify-center bg-amber-50 text-amber-600 rounded-xl">
              <Clock size={24} />
            </div>
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Onboarding</p>
          <p className="text-2xl font-extrabold text-slate-900">12</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
          <div className="flex justify-between items-center mb-6">
            <div className="w-12 h-12 flex items-center justify-center bg-rose-50 text-rose-600 rounded-xl">
              <FileCheck size={24} />
            </div>
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pending Approvals</p>
          <p className="text-2xl font-extrabold text-slate-900">5</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
          <div className="flex justify-between items-center mb-6">
            <div className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-600 rounded-xl">
              <AlertTriangle size={24} />
            </div>
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Licences Expiring</p>
          <p className="text-2xl font-extrabold text-slate-900">3</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-12">
        <div className="px-8 py-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Workforce Registry</h3>
            <p className="text-sm text-slate-500">Manage active agents and track their lifecycle progress.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search agents..."
                className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-56"
              />
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            <button
              onClick={() => navigate('/admin/agent-record-creation')}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2"
            >
              <UserPlus size={18} />
              Add New Agent
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-8 py-5 text-xs font-extrabold text-slate-500 uppercase tracking-widest">Agent Name</th>
                <th className="px-6 py-5 text-xs font-extrabold text-slate-500 uppercase tracking-widest">Contact</th>
                <th className="px-6 py-5 text-xs font-extrabold text-slate-500 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-5 text-xs font-extrabold text-slate-500 uppercase tracking-widest">Onboarding</th>
                <th className="px-6 py-5 text-xs font-extrabold text-slate-500 uppercase tracking-widest">Licence Expiry</th>
                <th className="px-8 py-5 text-xs font-extrabold text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAgents.map((a) => {
                const initials = a.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                return (
                  <tr key={a.email} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm border border-blue-100">
                          {initials}
                        </div>
                        <div>
                          <p className="text-base font-bold text-slate-900">{a.name}</p>
                          <p className="text-xs text-slate-500 font-medium">ID: {a.agentId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <p className="text-sm font-semibold text-slate-700">{a.email}</p>
                      <p className="text-xs text-slate-400">{a.phone}</p>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <span className={`inline-flex items-center justify-center px-3 py-1 text-xs font-bold rounded-full leading-none ${statusBadge(a.status)}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <div className="w-full bg-slate-100 rounded-full h-1.5 max-w-[140px]">
                        <div
                          className={`h-1.5 rounded-full ${a.onboardingProgress === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                          style={{ width: `${a.onboardingProgress}%` }}
                        />
                      </div>
                      <p className={`text-xs mt-2 font-bold uppercase tracking-wider ${a.onboardingProgress === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {a.onboardingLabel}
                      </p>
                    </td>
                    <td className="px-6 py-6">
                      <p className={`text-sm font-medium ${a.licenceExpiry.includes('2024') ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                        {a.licenceExpiry}
                      </p>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-3">
                        <button className="text-slate-400 hover:text-blue-600 transition-colors">
                          <Eye size={18} />
                        </button>
                        <button className="text-slate-400 hover:text-slate-700 transition-colors">
                          <PenLine size={18} />
                        </button>
                        <button className="text-slate-400 hover:text-rose-600 transition-colors">
                          <MoreHorizontal size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-sm text-slate-500 font-medium">
            Showing <span className="text-slate-900 font-bold">{filteredAgents.length}</span> of {recentAgents.length} agents
          </p>
          <div className="flex items-center gap-1">
            <button
              disabled
              className="p-2 rounded-lg hover:bg-slate-200 disabled:opacity-20 text-slate-600 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button className="w-9 h-9 flex items-center justify-center bg-blue-600 text-white rounded-lg text-sm font-bold shadow-sm shadow-blue-600/20">
              1
            </button>
            <button className="w-9 h-9 flex items-center justify-center hover:bg-slate-200 rounded-lg text-sm font-semibold text-slate-600 transition-colors">
              2
            </button>
            <button className="w-9 h-9 flex items-center justify-center hover:bg-slate-200 rounded-lg text-sm font-semibold text-slate-600 transition-colors">
              3
            </button>
            <button className="p-2 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      
    </div>
  )
}
