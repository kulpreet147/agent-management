import { useEffect, useMemo, useState } from 'react'
import StatCard from '../components/StatCard.jsx'
import StatusPill from '../components/StatusPill.jsx'
import { getAgents } from '../utils/agents.js'
import { auth } from '../utils/auth.js'
import { dashboardModuleCounts } from '../data/dummy.js'

const STAT_TONES = ['indigo', 'amber', 'emerald', 'slate']
const ONBOARDING_STEPS = 6

function getDisplayStatus(agent) {
  if (Number(agent?.accountActivationStatus) === 1) return 'Active'
  if (Number(agent?.accountActivationStatus) === 2) return 'Expired'
  const step = Number(agent?.onboardingStatus || 1)
  if (step >= 6 || String(agent?.status || '').toLowerCase() === 'under_review') return 'Under Review'
  if (step <= 1) return 'Invited'
  return 'Pending'
}

function getProgressPercent(agent) {
  if (Number(agent?.accountActivationStatus) === 1) return 100
  const step = Number(agent?.onboardingStatus || 1)
  const safeStep = Math.min(ONBOARDING_STEPS, Math.max(1, step))
  return Math.round((safeStep / ONBOARDING_STEPS) * 100)
}

function parseLicenceExpiry(agent) {
  const raw =
    agent?.licenceExpiry ||
    agent?.licenseExpiry ||
    agent?.licenseExpDate ||
    agent?.licenceExpDate ||
    null

  if (!raw) return null
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? null : date
}

function toInitials(name) {
  return String(name || 'A')
    .split(' ')
    .map((part) => part[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function AdminDashboard() {
  const session = auth.get()
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    getAgents()
      .then((data) => {
        if (!mounted) return
        setAgents(Array.isArray(data) ? data : [])
      })
      .catch((err) => {
        if (!mounted) return
        setError(err.message || 'Unable to load dashboard data.')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  const stats = useMemo(() => {
    const totalAgents = agents.length

    return [
      { label: 'Total Agents', value: totalAgents, tone: STAT_TONES[0] },
      { label: 'Total Leads', value: dashboardModuleCounts.totalLeads, tone: STAT_TONES[1] },
      { label: 'Total Clients', value: dashboardModuleCounts.totalClients, tone: STAT_TONES[2] },
      { label: 'Policies', value: dashboardModuleCounts.totalPolicies, tone: STAT_TONES[3] },
    ]
  }, [agents])

  const recentAgents = useMemo(() => {
    return [...agents]
      .sort((a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime())
      .slice(0, 5)
      .map((agent) => ({
        id: agent.id,
        name: agent.name || 'Unknown Agent',
        email: agent.email || '-',
        contact: agent.phone || agent.email || '-',
        status: getDisplayStatus(agent),
        onboardingProgress: getProgressPercent(agent),
        licenceExpiry: parseLicenceExpiry(agent),
        initials: toInitials(agent.name),
      }))
  }, [agents])

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col items-start gap-2">
        <div>
          <div className="text-sm text-slate-500">Agent Management</div>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">Good Morning, {session?.name || 'Admin'}</h1>
          <p className="text-sm text-slate-500 mt-1">Here's what's happening with your agent network today.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <StatCard key={s.label} label={s.label} value={s.value} tone={STAT_TONES[i]} compact />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <RecentAgentsPanel agents={recentAgents} total={agents.length} loading={loading} error={error} />
        </div>
      </div>
    </div>
  )
}

function RecentAgentsPanel({ agents, total, loading, error }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-slate-900 text-lg">
          Recent Agents <span className="text-sm text-slate-500">· {total} Total</span>
        </h2>
        <div className="flex items-center gap-3">
          <button className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-md">
            Filter
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-10 text-center text-sm text-slate-500">Loading agents...</div>
      ) : error ? (
        <div className="py-10 text-center text-sm text-rose-600">{error}</div>
      ) : (
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
              {agents.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/60 transition">
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
                  <td className="px-4 py-4 text-slate-600">{a.contact}</td>
                  <td className="px-4 py-4">
                    <StatusPill status={a.status} />
                  </td>
                  <td className="px-4 py-4">
                    <div className="w-40">
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500" style={{ width: `${a.onboardingProgress}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-500">{a.licenceExpiry ? a.licenceExpiry.toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-4 text-slate-500">...</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
