import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  SlidersHorizontal,
  Plus
} from 'lucide-react'
import StatCard from '../components/StatCard.jsx'
import StatusPill from '../components/StatusPill.jsx'
import {
  adminStats,
  recentAgents
} from '../data/dummy.js'

const STAT_TONES = ['indigo', 'amber', 'slate', 'emerald', 'rose']

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="text-sm text-slate-500">Agent Management</div>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">Good Morning, John Doe <span className="text-xl">👋</span></h1>
          <p className="text-sm text-slate-500 mt-1">Here's what's happening with your agent network today.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              placeholder="Search agents, IDs, or documents..."
              className="w-72 bg-white border border-slate-200 rounded-lg pl-10 pr-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none shadow-sm"
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
          <button className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 text-sm font-semibold px-3.5 py-2.5 rounded-lg transition">
            <SlidersHorizontal size={15} />
            Filters
          </button>
          <button
            onClick={() => navigate('/admin/agent-record-creation')}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-sm transition"
          >
            <Plus size={16} />
            Add New Agent
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {adminStats.map((s, i) => (
          <StatCard key={s.label} label={s.label} value={s.value} delta={s.delta} tone={STAT_TONES[i]} compact />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <RecentAgentsPanel />
        </div>

        {/* RIGHT — side column (1/3) */}
        {/* <div className="space-y-6">
          <TrainingPanel />
        </div> */}
      </div>

    </div>
  )
}

function RecentAgentsPanel() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-slate-900 text-lg">Recent Agents <span className="text-sm text-slate-500">· 48 Total</span></h2>
        <div className="flex items-center gap-3">
          <button className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-md">Filter</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-[12px] tracking-wider text-slate-500 bg-white">
              <th className="text-left font-medium px-4 py-3">Agent Name</th>
              <th className="text-left font-medium px-4 py-3">Contact Info</th>
              <th className="text-left font-medium px-4 py-3">Status</th>
              <th className="text-left font-medium px-4 py-3">Onboarding Progress</th>
              <th className="text-left font-medium px-4 py-3">Licence Expiry</th>
              <th className="text-left font-medium px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {recentAgents.map((a) => (
              <tr key={a.email} className="hover:bg-slate-50/60 transition">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 grid place-items-center text-white text-sm font-bold">
                      {a.initials}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800">{a.name}</div>
                      <div className="text-xs text-slate-500">{a.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-slate-600">{a.app || a.contact || a.email}</td>
                <td className="px-4 py-4">
                  <StatusPill status={a.status} />
                </td>
                <td className="px-4 py-4">
                  <div className="w-40">
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: `${a.onboardingProgress || 60}%` }} />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-slate-500">{a.updated}</td>
                <td className="px-4 py-4 text-slate-500">...</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

