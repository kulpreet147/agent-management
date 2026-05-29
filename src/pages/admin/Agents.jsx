import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAgents, resendAgentInvite } from '../../utils/agents.js'
import { Eye, FilePlus } from 'lucide-react'

const ONBOARDING_STEPS = 6

const onboardingMeta = {
  1: { label: 'Invited', classes: 'bg-slate-100 text-slate-700', barColor: 'bg-slate-400' },
  2: { label: 'Account Setup', classes: 'bg-indigo-100 text-indigo-700', barColor: 'bg-indigo-600' },
  3: { label: 'Registration', classes: 'bg-sky-100 text-sky-700', barColor: 'bg-sky-500' },
  4: { label: 'Under Review', classes: 'bg-amber-100 text-amber-700', barColor: 'bg-amber-500' },
  5: { label: 'Ready for MGA', classes: 'bg-sky-100 text-sky-700', barColor: 'bg-sky-500' },
  6: { label: 'Under Review', classes: 'bg-amber-100 text-amber-700', barColor: 'bg-amber-500' },
}

function getDocumentProgress(agent) {
  const docs = agent?.documents || {}
  const requiredKeys = ['licenceDocument', 'transferDocument', 'eandODocument', 'apexDocument', 'creditReportDocument']
  const hasLicenceDoc = Boolean(docs.licenceDocument || docs.transferDocument)
  const completedCount = requiredKeys.reduce((count, key) => count + (docs[key] ? 1 : 0), 0) - (hasLicenceDoc && docs.licenceDocument && docs.transferDocument ? 1 : 0)
  const normalizedCount = hasLicenceDoc ? completedCount : Math.max(0, completedCount)
  const totalRequired = 4
  return Math.min(totalRequired, normalizedCount) / totalRequired
}

function getOnboardingView(agent) {
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
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [inviteMode, setInviteMode] = useState(false)
  const [selectedAgentIds, setSelectedAgentIds] = useState([])
  const [sendingInvites, setSendingInvites] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    let isMounted = true

    getAgents()
      .then((data) => {
        if (isMounted) {
          setAgents(data)
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Unable to load agents.')
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const invitedAgentIds = agents
    .filter((agent) => String(agent.status || '').toLowerCase() === 'invited')
    .map((agent) => agent.id)

  const toggleSelect = (agentId) => {
    setSelectedAgentIds((prev) =>
      prev.includes(agentId) ? prev.filter((id) => id !== agentId) : [...prev, agentId],
    )
  }

  const handleInviteAction = async () => {
    if (!inviteMode) {
      setInviteMode(true)
      return
    }

    if (selectedAgentIds.length === 0) {
      window.alert('Select at least one invited agent.')
      return
    }

    setSendingInvites(true)
    try {
      await Promise.all(selectedAgentIds.map((id) => resendAgentInvite(id)))
      window.alert(`Invite link sent to ${selectedAgentIds.length} agent(s).`)
      setInviteMode(false)
      setSelectedAgentIds([])
      const refreshed = await getAgents()
      setAgents(refreshed)
    } catch (err) {
      window.alert(err.message || 'Unable to send invite links.')
    } finally {
      setSendingInvites(false)
    }
  }

  return (
    <div className="max-w-full mx-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Agents</h1>
            <p className="mt-2 text-sm text-slate-500 max-w-2xl">
             View and manage all registered agents in your network.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* <button
              type="button"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              onClick={() => {
                window.alert('Under development - export functionality coming soon!')
              }}
            >
              <Download size={16} className="mr-2" />
              Export Report
            </button> */}
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
          </div>
        </div>

        {inviteMode && (
          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-medium text-blue-700">
            Select invited agents only. Selected: {selectedAgentIds.length} of {invitedAgentIds.length}
          </div>
        )}

        <div className="mt-6 overflow-x-auto">
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
              ) : (
                agents.map((agent) => {
                  const onboarding = getOnboardingView(agent)
                  const isInvited = String(agent.status || '').toLowerCase() === 'invited'
                  const selected = selectedAgentIds.includes(agent.id)

                  return (
                    <tr
                      key={agent.id}
                      className="cursor-pointer transition hover:bg-slate-50"
                      onClick={() => {
                        if (inviteMode) return
                        navigate(`/admin/agents/${agent.id}`)
                      }}
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
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                            {agent.name
                              ? agent.name
                                .split(' ')
                                .map((part) => part[0]?.toUpperCase())
                                .slice(0, 2)
                                .join('')
                              : 'AG'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{agent.name}</div>
                            <div className="text-xs text-slate-500">ID: {agent.agentId || 'N/A'}</div>
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
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            navigate(`/admin/agents/${agent.id}`)
                          }}
                          className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                        >
                          <Eye size={14} />
                          View
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {agents.length > 15 && (
          <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-slate-500">
              Showing 1-15 of {agents.length} results
            </div>
            <div className="flex items-center gap-2">
              <button className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">
                Previous
              </button>
              <button className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">
                1
              </button>
              <button className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">
                2
              </button>
              <button className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">
                3
              </button>
              <button className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

