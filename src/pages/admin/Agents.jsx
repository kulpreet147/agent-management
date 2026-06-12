import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Eye, FilePlus, Search, Plus, MoreVertical, KeyRound, X } from 'lucide-react'
import StatCard from '../../components/StatCard.jsx'
import AgentAvatar from '../../components/AgentAvatar.jsx'
import { formatAccountId } from '../../utils/accountId.js'
import { adminSetAgentPassword } from '../../utils/agents.js'
import { getAllAgentsAsync, resendAgentInviteAsync } from '../../redux/agentSlice.js'
import { ShowRealtimeAlert } from '../../redux/realtimeSlice.js'

const ONBOARDING_STEPS = 6

const onboardingMeta = {
  1: { label: 'Invited', classes: 'bg-slate-100 text-slate-700', barColor: 'bg-slate-400' },
  2: { label: 'Account Setup', classes: 'bg-indigo-100 text-indigo-700', barColor: 'bg-indigo-600' },
  3: { label: 'Registration', classes: 'bg-sky-100 text-sky-700', barColor: 'bg-sky-500' },
  4: { label: 'Under Review', classes: 'bg-amber-100 text-amber-700', barColor: 'bg-amber-500' },
  5: { label: 'Ready for MGA', classes: 'bg-sky-100 text-sky-700', barColor: 'bg-sky-500' },
  6: { label: 'Under Review', classes: 'bg-amber-100 text-amber-700', barColor: 'bg-amber-500' },
}

const STAT_TONES = ['indigo', 'amber', 'slate', 'emerald']

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

function getDocumentProgress(agent) {
  const docs = agent?.documents || {}
  const hasTransferWorkflow = Boolean(docs.transferDocument || docs.eandODocument)
  const requiredKeys = hasTransferWorkflow
    ? ['governmentId', 'transferDocument', 'eandODocument', 'creditReportDocument']
    : ['governmentId', 'creditReportDocument']
  const completedCount = requiredKeys.reduce((count, key) => count + (docs[key] ? 1 : 0), 0)
  const totalRequired = requiredKeys.length
  if (totalRequired === 0) return 0
  return Math.min(totalRequired, completedCount) / totalRequired
}

// Admin-set lifecycle states that should override the onboarding/activation
// badge (kept in sync with the agent detail header, which reads lifecycleStatus).
const lifecycleOverrideMeta = {
  inactive: { label: 'Inactive', classes: 'bg-slate-100 text-slate-600', barColor: 'bg-slate-400' },
  suspended: { label: 'Suspended', classes: 'bg-amber-100 text-amber-700', barColor: 'bg-amber-500' },
  terminated: { label: 'Terminated', classes: 'bg-rose-100 text-rose-700', barColor: 'bg-rose-500' },
}

function getOnboardingView(agent) {
  // An admin can deactivate/suspend/terminate an agent independently of their
  // activation status. Honor that here so the list matches the detail page.
  const lifecycle = String(agent?.lifecycleStatus || '').toLowerCase()
  if (lifecycleOverrideMeta[lifecycle]) {
    const activated = Number(agent?.accountActivationStatus) === 1
    const safeStep = Math.min(ONBOARDING_STEPS, Math.max(1, Number(agent?.onboardingStatus || 1)))
    const percent = activated ? 100 : Math.round((safeStep / ONBOARDING_STEPS) * 100)
    return { status: lifecycleOverrideMeta[lifecycle], percent, text: `${percent}%` }
  }

  if (Number(agent?.accountActivationStatus) === 1) {
    return {
      status: { label: 'Active', classes: 'bg-emerald-100 text-emerald-700', barColor: 'bg-emerald-500' },
      percent: 100,
      text: '100%',
    }
  }

  if (Number(agent?.accountActivationStatus) === 2) {
    return {
      status: { label: 'Expired', classes: 'bg-rose-100 text-rose-700', barColor: 'bg-rose-500' },
      percent: 100,
      text: 'Expired',
    }
  }

  const step = Number(agent?.onboardingStatus || 1)
  const safeStep = Math.min(ONBOARDING_STEPS, Math.max(1, step))
  const status = onboardingMeta[safeStep] || onboardingMeta[1]
  const stepProgress = (safeStep / ONBOARDING_STEPS) * 100

  if (safeStep >= 4) {
    const docsProgress = getDocumentProgress(agent) * 100
    const blended = Math.max(stepProgress, docsProgress)
    return {
      status,
      percent: Math.round(blended),
      text: `${Math.round(blended)}%`,
    }
  }

  return {
    status,
    percent: Math.round(stepProgress),
    text: `${Math.round(stepProgress)}%`,
  }
}

export default function Agents() {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [inviteMode, setInviteMode] = useState(false)
  const [selectedAgentIds, setSelectedAgentIds] = useState([])
  const [sendingInvites, setSendingInvites] = useState(false)
  const [openActionMenuId, setOpenActionMenuId] = useState(null)
  const [passwordAgent, setPasswordAgent] = useState(null)
  const [passwordValue, setPasswordValue] = useState('')
  const [confirmPasswordValue, setConfirmPasswordValue] = useState('')
  const [settingPassword, setSettingPassword] = useState(false)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { allAgentsData, getAllAgentsLoading, getAllAgentsFailed } = useSelector((state) => state.agent)
  const agents = allAgentsData
  const loading = getAllAgentsLoading
  const error = getAllAgentsFailed || null
  const pageSize = 8

  useEffect(() => {
    dispatch(getAllAgentsAsync())
  }, [dispatch])

  useEffect(() => {
    const handleCloseMenu = () => setOpenActionMenuId(null)
    window.addEventListener('click', handleCloseMenu)
    return () => window.removeEventListener('click', handleCloseMenu)
  }, [])

  const invitedAgentIds = agents
    .filter((agent) => String(agent.status || '').toLowerCase() === 'invited')
    .map((agent) => agent.id)

  const filteredAgents = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return agents

    return agents.filter((agent) => {
      const haystack = [
        agent?.name,
        agent?.email,
        agent?.agentId,
        agent?.insuranceCompany,
        agent?.publicId,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(q)
    })
  }, [agents, searchTerm])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const totalPages = Math.max(1, Math.ceil(filteredAgents.length / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedAgents = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize
    return filteredAgents.slice(startIndex, startIndex + pageSize)
  }, [filteredAgents, safeCurrentPage])

  const stats = useMemo(() => {
    const now = new Date()
    const in30 = new Date()
    in30.setDate(now.getDate() + 30)

    const onboardingInProgress = agents.filter((agent) => {
      const activation = Number(agent?.accountActivationStatus)
      const step = Number(agent?.onboardingStatus || 1)
      return activation !== 1 && activation !== 2 && step > 1 && step < 6
    }).length

    const pendingApprovals = agents.filter((agent) => {
      const activation = Number(agent?.accountActivationStatus)
      const step = Number(agent?.onboardingStatus || 1)
      const status = String(agent?.status || '').toLowerCase()
      return activation === 0 && (step >= 6 || status === 'under_review')
    }).length

    const licencesExpiring = agents.filter((agent) => {
      const expiry = parseLicenceExpiry(agent)
      return expiry && expiry >= now && expiry <= in30
    }).length

    return [
      { label: 'Total Agents', value: agents.length, tone: STAT_TONES[0] },
      { label: 'Onboarding In Progress', value: onboardingInProgress, tone: STAT_TONES[1] },
      { label: 'Pending Approvals', value: pendingApprovals, tone: STAT_TONES[2] },
      { label: 'Licences Expiring', value: licencesExpiring, tone: STAT_TONES[3] },
    ]
  }, [agents])

  const toggleSelect = (agentId) => {
    setSelectedAgentIds((prev) =>
      prev.includes(agentId) ? prev.filter((id) => id !== agentId) : [...prev, agentId],
    )
  }

  const handleAgentView = (agent) => {
    if (inviteMode) return

    const activation = Number(agent?.accountActivationStatus)

    if (activation === 1) {
      navigate(`/admin/agents/${agent.id}/profile`)
      return
    }

    navigate(`/admin/agents/${agent.id}`)
  }

  const canSetPassword = (agent) => {
    return !Boolean(agent?.hasPassword || agent?.activatedAt || agent?.inviteUsedAt)
  }

  const openPasswordModal = (agent) => {
    setPasswordAgent(agent)
    setPasswordValue('')
    setConfirmPasswordValue('')
    setOpenActionMenuId(null)
  }

  const closePasswordModal = () => {
    if (settingPassword) return
    setPasswordAgent(null)
    setPasswordValue('')
    setConfirmPasswordValue('')
  }

  const handleSetPassword = async () => {
    if (!passwordAgent?.id) return

    if (!passwordValue.trim()) {
      dispatch(ShowRealtimeAlert({ variant: 'warning', title: 'Password Required', message: 'Enter a password before saving.' }))
      return
    }

    if (passwordValue !== confirmPasswordValue) {
      dispatch(ShowRealtimeAlert({ variant: 'warning', title: 'Passwords Do Not Match', message: 'Password and confirm password must match.' }))
      return
    }

    setSettingPassword(true)
    try {
      await adminSetAgentPassword(passwordAgent.id, passwordValue)
      dispatch(
        ShowRealtimeAlert({
          variant: 'success',
          title: 'Password Set',
          message: 'Agent credentials were set by admin and onboarding was moved to account setup complete.',
        }),
      )
      closePasswordModal()
      dispatch(getAllAgentsAsync())
    } catch (error) {
      dispatch(
        ShowRealtimeAlert({
          variant: 'danger',
          title: 'Unable to Set Password',
          message: error.message || 'Unable to set agent password.',
        }),
      )
    } finally {
      setSettingPassword(false)
    }
  }

  const handleInviteAction = async () => {
    if (!inviteMode) {
      setInviteMode(true)
      return
    }

    if (selectedAgentIds.length === 0) {
      dispatch(
        ShowRealtimeAlert({
          variant: 'warning',
          title: 'No Agents Selected',
          message: 'Select at least one invited agent.',
        }),
      )
      return
    }

    setSendingInvites(true)
    try {
      const responses = await Promise.all(
        selectedAgentIds.map((id) => dispatch(resendAgentInviteAsync(id))),
      )
      const failed = responses.find(
        (response) =>
          response instanceof Error ||
          response?.message === 'Unable to save agent changes.',
      )
      if (failed) {
        throw failed
      }
      dispatch(
        ShowRealtimeAlert({
          variant: 'success',
          title: 'Invitation Sent',
          message: `Invite link sent to ${selectedAgentIds.length} agent(s).`,
        }),
      )
      setInviteMode(false)
      setSelectedAgentIds([])
      dispatch(getAllAgentsAsync())
    } catch (err) {
      dispatch(
        ShowRealtimeAlert({
          variant: 'danger',
          title: 'Invite Send Failed',
          message: err.message || 'Unable to send invite links.',
        }),
      )
    } finally {
      setSendingInvites(false)
    }
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

  const displayStart = filteredAgents.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1
  const displayEnd = filteredAgents.length === 0 ? 0 : Math.min(safeCurrentPage * pageSize, filteredAgents.length)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-full min-h-0 flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Agents</h1>
            <p className="mt-2 text-sm text-slate-500 max-w-2xl">
             View and manage all registered agents in your network.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-72">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search agents..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <button
              type="button"
              onClick={handleInviteAction}
              disabled={sendingInvites}
              className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-brand-600/20 hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
            >
              <FilePlus size={16} className="mr-2" />
              {inviteMode
                ? sendingInvites
                  ? 'Sending...'
                  : 'Send Selected Invite Links'
                : 'Invite New Agent'}
            </button>
            {inviteMode && (
              <button
                type="button"
                onClick={() => {
                  setInviteMode(false)
                  setSelectedAgentIds([])
                }}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel Selection
                </button>
            )}
            <button
              type="button"
              onClick={() => navigate('/admin/agent-record-creation')}
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Plus size={16} className="mr-2" />
              Add New Agent
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat, index) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              tone={STAT_TONES[index]}
              compact
            />
          ))}
        </div>

        {inviteMode && (
          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-medium text-blue-700">
            Select invited agents only. Selected: {selectedAgentIds.length} of {invitedAgentIds.length}
          </div>
        )}

        <div className="mt-6 min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200">
          <div className="h-full overflow-x-auto overflow-y-auto">
            <table className="min-w-full text-sm">
            <thead>
              <tr className="border-y border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-4">Agent Name</th>
                <th className="px-4 py-4">Contact Info</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Onboarding Progress</th>
                <th className="px-4 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-4 py-10 text-center text-sm text-slate-500">
                    Loading agents...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="5" className="px-4 py-10 text-center text-sm text-rose-600">
                    {error}
                  </td>
                </tr>
              ) : agents.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-10 text-center text-sm text-slate-500">
                    No agents found.
                  </td>
                </tr>
              ) : filteredAgents.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-10 text-center text-sm text-slate-500">
                    No agents match your search.
                  </td>
                </tr>
              ) : (
                paginatedAgents.map((agent) => {
                  const onboarding = getOnboardingView(agent)
                  const isInvited = String(agent.status || '').toLowerCase() === 'invited'
                  const selected = selectedAgentIds.includes(agent.id)

                  return (
                    <tr
                      key={agent.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-4 py-5">
                        <div className="flex items-center gap-3">
                          {inviteMode && (
                            <input
                              type="checkbox"
                              checked={selected}
                              disabled={!isInvited}
                              onChange={(event) => {
                                event.stopPropagation()
                                toggleSelect(agent.id)
                              }}
                              className="h-4 w-4"
                            />
                          )}
                          <div className="relative shrink-0">
                            <button
                              type="button"
                              onClick={() => handleAgentView(agent)}
                              disabled={inviteMode}
                              className="block rounded-full ring-2 ring-white shadow-sm transition hover:scale-105 disabled:cursor-default disabled:hover:scale-100"
                              aria-label={`View ${agent.name || 'agent'} details`}
                              title={inviteMode ? '' : `View ${agent.name || 'agent'} profile`}
                            >
                              <AgentAvatar agent={agent} size={44} />
                            </button>
                            {Number(agent?.accountActivationStatus) === 1 && (
                              <span
                                className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500"
                                title="Active"
                              />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{agent.name}</div>
                            <div className="text-xs text-slate-500">
                              ID: {formatAccountId('AG', agent.publicId) || agent.displayId || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-5">
                        <div>
                          <div className="text-sm text-slate-700">{agent.email || 'N/A'}</div>
                          <div className="text-xs text-slate-500">{agent.insuranceCompany || 'No company'}</div>
                        </div>
                      </td>
                      <td className="px-4 py-5">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${onboarding.status.classes}`}>
                          {onboarding.status.label}
                        </span>
                      </td>
                      <td className="px-4 py-5">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full ${onboarding.status.barColor}`}
                              style={{ width: `${onboarding.percent}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-700">{onboarding.text}</span>
                        </div>
                      </td>
                      <td className="px-4 py-5 text-right">
                        <div className="relative inline-flex">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              setOpenActionMenuId((prev) => (prev === agent.id ? null : agent.id))
                            }}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200"
                            aria-label={`Open actions for ${agent.name}`}
                          >
                            <MoreVertical size={15} />
                          </button>

                          {openActionMenuId === agent.id && (
                            <div
                              className="absolute right-0 top-11 z-20 min-w-[170px] overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg"
                              onClick={(event) => event.stopPropagation()}
                            >
                              {canSetPassword(agent) ? (
                                <button
                                  type="button"
                                  onClick={() => openPasswordModal(agent)}
                                  className="flex w-full items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                  <KeyRound size={14} />
                                  Set Password
                                </button>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenActionMenuId(null)
                                  handleAgentView(agent)
                                }}
                                className="flex w-full items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                              >
                                <Eye size={14} />
                                View
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-slate-500">
            Showing {displayStart}-{displayEnd} of {filteredAgents.length} results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(safeCurrentPage - 1)}
              disabled={safeCurrentPage === 1}
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
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
                  className={`rounded-md border px-3 py-2 text-xs font-semibold transition ${
                    page === safeCurrentPage
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {page}
                </button>
              ),
            )}
            <button
              onClick={() => goToPage(safeCurrentPage + 1)}
              disabled={safeCurrentPage === totalPages}
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {passwordAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Set Agent Password</h2>
                <p className="mt-1 text-xs text-slate-500">
                  This bypasses the email invite password setup step for {passwordAgent.name}.
                </p>
              </div>
              <button
                type="button"
                onClick={closePasswordModal}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-4 px-5 py-5">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordValue}
                  onChange={(event) => setPasswordValue(event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Minimum 8 chars, uppercase, number, special"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPasswordValue}
                  onChange={(event) => setConfirmPasswordValue(event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Re-enter password"
                />
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs leading-5 text-amber-900">
                Admin-set credentials mark the agent account as password-ready and move onboarding to account setup complete.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-5 py-4">
              <button
                type="button"
                onClick={closePasswordModal}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={settingPassword}
                onClick={handleSetPassword}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {settingPassword ? 'Saving...' : 'Save Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

