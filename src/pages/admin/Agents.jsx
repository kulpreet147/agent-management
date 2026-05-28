import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAgents } from '../../utils/agents.js'
import { Eye, Mail, ArrowRight, FilePlus, Download } from 'lucide-react'

const statusMeta = {
  active: { label: 'Active', classes: 'bg-emerald-100 text-emerald-700' },
  approved: { label: 'Approved', classes: 'bg-emerald-100 text-emerald-700' },
  submitted: { label: 'Submitted', classes: 'bg-sky-100 text-sky-700' },
  incomplete: { label: 'Incomplete', classes: 'bg-rose-100 text-rose-700' },
  under_review: { label: 'Under Review', classes: 'bg-slate-100 text-slate-700' },
}

function getProgress(agent) {
  if (agent.status === 'approved') {
    return { label: 'Complete', percent: 100, color: 'bg-emerald-500' }
  }

  if (agent.status === 'submitted') {
    return { label: 'Step 6/6', percent: 100, color: 'bg-sky-500' }
  }

  if (agent.status === 'incomplete') {
    return { label: 'Step 1/6', percent: 18, color: 'bg-rose-500' }
  }

  if (agent.status === 'under_review') {
    return { label: 'Step 4/6', percent: 65, color: 'bg-slate-500' }
  }

  return { label: 'Step 3/6', percent: 45, color: 'bg-brand-600' }
}

export default function Agents() {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
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
              onClick={() =>
                window.alert('Under development - export functionality coming soon!')
              }
              className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-brand-600/20 hover:bg-brand-700"
            >
              <FilePlus size={16} className="mr-2" />
              Invite New Agent
            </button>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-4 py-4">Registered Agents</th>
                <th className="px-4 py-4">Step / Progress</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-4 py-10 text-center text-sm text-slate-500">
                    Loading agents...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="4" className="px-4 py-10 text-center text-sm text-rose-600">
                    {error}
                  </td>
                </tr>
              ) : agents.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-4 py-10 text-center text-sm text-slate-500">
                    No agents found.
                  </td>
                </tr>
              ) : (
                agents.map((agent) => {
                  const progress = getProgress(agent)
                  const status = statusMeta[agent.status] || {
                    label: agent.status || 'Unknown',
                    classes: 'bg-slate-100 text-slate-700',
                  }

                  return (
                    <tr
                      key={agent.id}
                      className="cursor-pointer transition hover:bg-slate-50"
                      onClick={() => navigate(`/admin/agents/${agent.id}`)}
                    >
                      <td className="px-4 py-5">
                        <div className="flex items-center gap-3">
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
                            <div className="text-xs text-slate-500">{agent.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-5">
                        <div className="flex flex-col gap-2">
                          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                            {progress.label}
                          </div>
                          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${progress.color}`}
                              style={{ width: `${progress.percent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-5">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status.classes}`}>
                          {status.label}
                        </span>
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

