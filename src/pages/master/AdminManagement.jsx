import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, ShieldCheck, ShieldOff, UserPlus, Copy, Mail } from 'lucide-react'
import StatCard from '../../components/StatCard.jsx'
import StatusPill from '../../components/StatusPill.jsx'
import { listAccounts, setAccountBlocked } from '../../utils/admins.js'

export default function AdminManagement() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let mounted = true

    setLoading(true)
    listAccounts('admin')
      .then((data) => {
        if (!mounted) return
        setAdmins(Array.isArray(data) ? data : data?.items || [])
      })
      .catch((err) => {
        if (!mounted) return
        setMessage(err.message || 'Unable to load admins.')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [refreshKey])

  const filteredAdmins = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return admins

    return admins.filter((admin) => {
      const haystack = [
        admin.firstName,
        admin.lastName,
        admin.email,
        admin.phone,
        admin.address,
        admin.zipcode,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(q)
    })
  }, [admins, searchTerm])

  const stats = useMemo(() => {
    const total = admins.length
    const active = admins.filter((admin) => admin.inviteStatus === 'active' && !admin.isBlocked).length
    const blocked = admins.filter((admin) => admin.isBlocked).length
    const invited = admins.filter((admin) => admin.inviteStatus === 'invited').length

    return [
      { label: 'Total Admins', value: total, tone: 'blue' },
      { label: 'Active Admins', value: active, tone: 'emerald' },
      { label: 'Invited Pending', value: invited, tone: 'indigo' },
      { label: 'Blocked', value: blocked, tone: 'rose' },
    ]
  }, [admins])

  const copyInvite = async (link) => {
    try {
      await navigator.clipboard.writeText(link)
      setMessage('Invite link copied.')
      window.setTimeout(() => setMessage(''), 2500)
    } catch {
      setMessage('Could not copy link. Please copy it manually.')
      window.setTimeout(() => setMessage(''), 2500)
    }
  }

  const toggleBlock = (admin) => {
    setAccountBlocked('admin', admin.id, !admin.isBlocked)
      .then(() => {
        setRefreshKey((value) => value + 1)
        setMessage(`${admin.firstName} ${admin.lastName} ${admin.isBlocked ? 'unblocked' : 'blocked'}.`)
        window.setTimeout(() => setMessage(''), 2500)
      })
      .catch((err) => {
        setMessage(err.message || 'Unable to update admin access.')
        window.setTimeout(() => setMessage(''), 2500)
      })
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-full min-h-0 flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Admin Management</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Create admin access, manage invite links, and control access blocking.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-72">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search admins..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <button
              type="button"
              onClick={() => navigate('/master/admin-management/new')}
              className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
            >
              <UserPlus size={16} className="mr-2" />
              New Administrator
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              tone={stat.tone}
              compact
            />
          ))}
        </div>

        {message && (
          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            {message}
          </div>
        )}

        <div className="mt-6 min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200">
          <div className="h-full overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-4">Admin</th>
                  <th className="px-4 py-4">Contact</th>
                  <th className="px-4 py-4">Invite</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Access</th>
                  <th className="px-4 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-10 text-center text-sm text-slate-500">
                      Loading admins...
                    </td>
                  </tr>
                ) : filteredAdmins.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-10 text-center text-sm text-slate-500">
                      No admins found.
                    </td>
                  </tr>
                ) : (
                  filteredAdmins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-sm font-semibold text-white">
                            {(admin.firstName?.[0] || 'A') + (admin.lastName?.[0] || '')}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">
                              {admin.firstName} {admin.lastName}
                            </div>
                            <div className="text-xs text-slate-500">ID: {admin.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-5">
                        <div className="space-y-1 text-slate-700">
                          <div className="flex items-center gap-2">
                            <Mail size={14} className="text-slate-400" />
                            <span>{admin.email}</span>
                          </div>
                          <div className="text-xs text-slate-500">{admin.phone || 'No phone provided'}</div>
                          <div className="text-xs text-slate-500">{admin.address || 'No address provided'}</div>
                          <div className="text-xs text-slate-500">{admin.zipcode || 'No zipcode provided'}</div>
                        </div>
                      </td>
                      <td className="px-4 py-5">
                        {admin.inviteLink ? (
                          <button
                            type="button"
                            onClick={() => copyInvite(admin.inviteLink)}
                            className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                          >
                            <Copy size={14} />
                            Copy Link
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">Activated</span>
                        )}
                      </td>
                      <td className="px-4 py-5">
                        <StatusPill status={admin.isBlocked ? 'Critical' : admin.inviteStatus === 'invited' ? 'Processing' : 'Success'} />
                      </td>
                      <td className="px-4 py-5">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${admin.isBlocked ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                          {admin.isBlocked ? 'Blocked' : 'Allowed'}
                        </span>
                      </td>
                      <td className="px-4 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to="/master/admin-management/new"
                            className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                          >
                            Invite Again
                          </Link>
                          <button
                            type="button"
                            onClick={() => toggleBlock(admin)}
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ${
                              admin.isBlocked
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-red-50 text-red-700 hover:bg-red-100'
                            }`}
                          >
                            {admin.isBlocked ? <ShieldCheck size={14} /> : <ShieldOff size={14} />}
                            {admin.isBlocked ? 'Unblock' : 'Block'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
