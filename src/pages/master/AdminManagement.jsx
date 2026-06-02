import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, ShieldCheck, ShieldOff, UserPlus, Mail, Phone, MapPin } from 'lucide-react'
import StatCard from '../../components/StatCard.jsx'
import { listAccounts, setAccountBlocked } from '../../utils/admins.js'
import { formatAccountId } from '../../utils/accountId.js'

function formatUsCaPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '')
  const normalized = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits
  if (normalized.length !== 10) return phone || 'No phone provided'
  return `+1 (${normalized.slice(0, 3)}) ${normalized.slice(3, 6)}-${normalized.slice(6)}`
}

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
        admin.publicId,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(q)
    })
  }, [admins, searchTerm])

  const stats = useMemo(() => {
    const total = admins.length
    const active = admins.filter((admin) => (admin.adminStatus || (admin.isActive ? 'active' : 'pending')) === 'active').length
    const blocked = admins.filter((admin) => (admin.adminStatus || (admin.isBlocked ? 'blocked' : 'pending')) === 'blocked').length
    const invited = admins.filter((admin) => (admin.adminStatus || 'pending') === 'pending').length

    return [
      { label: 'Total Admins', value: total, tone: 'blue' },
      { label: 'Active Admins', value: active, tone: 'emerald' },
      { label: 'Invited Pending', value: invited, tone: 'indigo' },
      { label: 'Blocked', value: blocked, tone: 'rose' },
    ]
  }, [admins])

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

        <div className="mt-6 min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/40">
          <div className="h-full overflow-auto p-4">
            {loading ? (
              <div className="flex h-full min-h-[260px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-sm text-slate-500">
                Loading admins...
              </div>
            ) : filteredAdmins.length === 0 ? (
              <div className="flex h-full min-h-[260px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-sm text-slate-500">
                No admins found.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-2 2xl:grid-cols-3">
                {filteredAdmins.map((admin) => {
                  const fullName = `${admin.firstName || ''} ${admin.lastName || ''}`.trim() || admin.name || 'Admin User'
                  const displayId = formatAccountId('AD', admin.publicId) || admin.displayId || admin.id
                  const isBlocked = Boolean(admin.isBlocked)
                  const adminStatus = admin.adminStatus || (isBlocked ? 'blocked' : admin.isActive ? 'active' : 'pending')
                  const isPending = adminStatus === 'pending'
                  const statusLabel =
                    adminStatus === 'blocked' ? 'Blocked' : adminStatus === 'active' ? 'Active' : 'Pending'

                  return (
                    <div
                      key={admin.id}
                      className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-semibold text-white shadow-sm">
                            {(admin.firstName?.[0] || 'A') + (admin.lastName?.[0] || '')}
                          </div>
                          <div className="min-w-0">
                            <h3 className="truncate text-[13px] font-semibold text-slate-900">{fullName}</h3>
                            <p className="mt-0.5 text-[10px] font-medium text-slate-500">ID: {displayId}</p>
                          
                          </div>
                        </div>

                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${adminStatus === 'blocked'
                              ? 'bg-red-50 text-red-700'
                              : adminStatus === 'active'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                        >
                          {statusLabel}
                        </span>
                      </div>

                      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2.5">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Contact</p>
                          <div className="mt-1.5 space-y-1.5 text-sm font-semibold text-slate-800">
                            <div className="flex items-start gap-2 break-all">
                              <Mail size={12} className="mt-1 shrink-0 text-slate-400" />
                              <span className="text-[11px] leading-5">{admin.email}</span>
                            </div>
                            <div className="flex items-start gap-2 break-all">
                              <Phone size={12} className="mt-1 shrink-0 text-slate-400" />
                              <span className="text-[11px] leading-5">{formatUsCaPhone(admin.phone)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2.5">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Location</p>
                          <div className="mt-1.5 space-y-1.5 text-sm font-semibold text-slate-800">
                            <div className="flex items-start gap-2 break-all">
                              <MapPin size={12} className="mt-1 shrink-0 text-slate-400" />
                              <span className="text-[11px] leading-5">{admin.address || 'No address provided'}</span>
                            </div>
                            <p className="pl-5 text-[11px] leading-5">{admin.zipcode || 'No zipcode provided'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2">
                        <div className="text-[11px] text-slate-500">
                          {adminStatus === 'blocked'
                            ? 'Blocked by master admin'
                            : adminStatus === 'active'
                              ? 'Admin account active'
                              : 'Invite pending activation'}
                        </div>
                        <div className="flex items-center gap-2">
                          {isPending ? (
                            <Link
                              to="/master/admin-management/new"
                              className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-700 transition hover:bg-slate-200"
                            >
                              Invite Again
                            </Link>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => toggleBlock(admin)}
                            className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[10px] font-semibold transition ${isBlocked
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-red-50 text-red-700 hover:bg-red-100'
                              }`}
                          >
                            {isBlocked ? <ShieldCheck size={14} /> : <ShieldOff size={14} />}
                            {isBlocked ? 'Unblock' : 'Block'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
