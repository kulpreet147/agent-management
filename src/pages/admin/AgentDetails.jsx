import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getAgent } from '../../utils/agents.js'

export default function AgentDetails() {
  const { agentId } = useParams()
  const navigate = useNavigate()
  const [agent, setAgent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!agentId) return

    let isMounted = true

    getAgent(agentId)
      .then((data) => {
        if (isMounted) {
          setAgent(data)
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Unable to load agent details.')
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
  }, [agentId])

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Agent details</h1>
            <p className="mt-1 text-sm text-slate-500">
              This page shows selected agent detail data. Full details and workflows will be completed on the dedicated details screen.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin/agents')}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Back to agents
          </button>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="py-10 text-center text-sm text-slate-500">Loading agent details...</div>
          ) : error ? (
            <div className="py-10 text-center text-sm text-red-600">{error}</div>
          ) : !agent ? (
            <div className="py-10 text-center text-sm text-slate-500">Agent not found.</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-slate-500 text-xs uppercase tracking-wide">Name</div>
                <div className="mt-2 text-lg font-semibold text-slate-900">{agent.name}</div>
                <div className="mt-1 text-sm text-slate-500">{agent.email}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-slate-500 text-xs uppercase tracking-wide">Status</div>
                <div className="mt-2 text-lg font-semibold text-slate-900">{agent.status}</div>
                <div className="mt-1 text-sm text-slate-500">{agent.agentLevel} / {agent.licenceType}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-slate-500 text-xs uppercase tracking-wide">Agent code</div>
                <div className="mt-2 text-lg font-semibold text-slate-900">{agent.agentCode}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-slate-500 text-xs uppercase tracking-wide">Insurance Company</div>
                <div className="mt-2 text-lg font-semibold text-slate-900">{agent.insuranceCompany}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
