import {
  CalendarClock,
  CheckCircle2,
  FileText,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { auth } from '../../utils/auth.js'
import AgentSidebar from '../../components/AgentSidebar.jsx'
import CommonHeader from '../../components/CommonHeader.jsx'
import { getAgentSignedDocuments } from '../../utils/agents.js'

const documentCatalog = [
  { id: 'advisor_contract', name: 'Advisor Contract' },
  { id: 'code_of_conduct', name: 'Code of Conduct' },
  { id: 'privacy_policy', name: 'Privacy Agreement' },
]

const nextTasks = [
  { label: 'Complete profile verification', status: 'Ready' },
  { label: 'Start compliance training', status: 'Next' },
  { label: 'Review carrier appointment', status: 'Pending' }
]

export default function AgentDashboard() {
  const session = auth.get()
  const agentName = session?.name || 'Agent'
  const accountActivationStatus = Number(session?.accountActivationStatus || 0)
  const onboardingStatus = Number(session?.onboardingStatus || 1)
  const initials = agentName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const [signedDocs, setSignedDocs] = useState({})
  const [headerSearch, setHeaderSearch] = useState('')

  useEffect(() => {
    if (!session?.id) return

    const loadSignedDocuments = () => {
      getAgentSignedDocuments(session.id)
        .then((data) => setSignedDocs(data || {}))
        .catch(() => setSignedDocs({}))
    }

    loadSignedDocuments()

    const handleRealtimeRefresh = () => {
      loadSignedDocuments()
    }

    window.addEventListener('agent:realtime-update', handleRealtimeRefresh)

    return () => {
      window.removeEventListener('agent:realtime-update', handleRealtimeRefresh)
    }
  }, [session?.id])

  const documents = useMemo(() => {
    return documentCatalog.map((doc) => {
      const signed = signedDocs?.[doc.id]
      const reviewAction = signed?.metadata?.adminReview?.action || null

      let status = 'Pending Signature'
      if (signed?.submittedAt) status = 'Under Review'
      if (reviewAction === 'approved') status = 'Approved'
      if (reviewAction === 'rejected') status = 'Rejected'
      if (reviewAction === 'revision_requested') status = 'Revision Requested'

      const updated = signed?.submittedAt
        ? new Date(signed.submittedAt).toLocaleDateString()
        : 'Not signed yet'

      return {
        id: doc.id,
        name: doc.name,
        updated,
        status,
        action: signed?.submittedAt ? 'View' : 'Pending',
      }
    })
  }, [signedDocs])

  const approvedCount = documents.filter((d) => d.status === 'Approved').length
  const rejectedCount = documents.filter((d) => d.status === 'Rejected').length
  const underReviewCount = documents.filter((d) => d.status === 'Under Review').length

  const onboardingSummary = useMemo(() => {
    if (accountActivationStatus === 1) {
      return {
        statusLabel: 'Active',
        statusTone: 'emerald',
        nextStep: 'Lead Management',
        progress: 100,
        progressNote: 'Your account is active and all agent tools are available.',
      }
    }

    if (accountActivationStatus === 2) {
      return {
        statusLabel: 'Expired',
        statusTone: 'rose',
        nextStep: 'Contact Admin',
        progress: 100,
        progressNote: 'Your access has expired. Please contact your administrator.',
      }
    }

    if (onboardingStatus >= 6 || session?.status === 'under_review') {
      return {
        statusLabel: 'Under Review',
        statusTone: 'amber',
        nextStep: 'Admin Review',
        progress: 90,
        progressNote: 'Your documents are under admin review. Extra tools unlock after approval.',
      }
    }

    if (onboardingStatus >= 5 || session?.status === 'ready_for_mga') {
      return {
        statusLabel: 'Ready for MGA',
        statusTone: 'blue',
        nextStep: 'MGA Review',
        progress: 80,
        progressNote: 'Your onboarding package is ready and waiting for MGA review.',
      }
    }

    return {
      statusLabel: 'Onboarding In Progress',
      statusTone: 'blue',
      nextStep: 'Complete Onboarding',
      progress: Math.max(20, Math.min(75, onboardingStatus * 20)),
      progressNote: 'Complete the remaining onboarding steps to unlock your full account.',
    }
  }, [accountActivationStatus, onboardingStatus, session?.status])

  const overallReviewStatus =
    rejectedCount > 0
      ? 'Rejected'
      : approvedCount === documents.length
        ? 'Approved'
        : underReviewCount > 0
          ? 'Under Review'
          : 'Pending'

  return (
    <div className="min-h-screen bg-[#eef3f8] text-slate-1500">
      <div className="flex h-screen overflow-hidden">
        <AgentSidebar agentName={agentName} initials={initials} />

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <CommonHeader
            title="Agent Dashboard"
            searchValue={headerSearch}
            onSearchChange={setHeaderSearch}
            searchPlaceholder="Search documents, training..."
            compact
          />

          <div className="flex-1 overflow-y-auto p-6">
            <div className="mx-auto max-w-6xl space-y-5">
              <div>
                <div className="text-xs font-semibold text-slate-500">Agents &gt; Dashboard</div>
                <h1 className="mt-1 text-2xl font-bold tracking-tight">Welcome back, {agentName}</h1>
              </div>

              <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Metric icon={CheckCircle2} label="Onboarding Status" value={onboardingSummary.statusLabel} tone={onboardingSummary.statusTone} />
                <Metric icon={FileText} label="Signed Documents" value={`${Object.keys(signedDocs || {}).length} Files`} tone="blue" />
                <Metric icon={CalendarClock} label="Next Step" value={onboardingSummary.nextStep} tone="amber" />
              </section>

              <section className="rounded-lg border border-slate-300 bg-white shadow-card">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <div>
                    <h2 className="text-sm font-bold">Document Review</h2>
                    <p className="mt-0.5 text-[10px] text-slate-500">Track per-document review status from admin actions.</p>
                  </div>
                  <span className={`rounded px-2 py-1 text-[10px] font-bold uppercase ${
                    overallReviewStatus === 'Approved'
                      ? 'bg-emerald-50 text-emerald-700'
                      : overallReviewStatus === 'Rejected'
                        ? 'bg-rose-50 text-rose-700'
                        : overallReviewStatus === 'Under Review'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-slate-100 text-slate-700'
                  }`}>
                    {overallReviewStatus}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-5 py-3 font-bold">Document Name</th>
                        <th className="px-5 py-3 font-bold">Updated</th>
                        <th className="px-5 py-3 font-bold">Status</th>
                        <th className="px-5 py-3 text-right font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {documents.map((document) => (
                        <tr key={document.name} className="hover:bg-slate-50">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="grid h-9 w-9 place-items-center rounded-md bg-brand-50 text-brand-700">
                                <FileText size={16} />
                              </div>
                              <div>
                                <div className="font-bold text-slate-900">{document.name}</div>
                                <div className="text-xs text-slate-500">Agent onboarding document</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-slate-600">{document.updated}</td>
                          <td className="px-5 py-4">
                            <span className={`rounded px-2 py-1 text-[9px] font-bold uppercase ${
                              document.status === 'Approved'
                                ? 'bg-emerald-50 text-emerald-700'
                                : document.status === 'Rejected'
                                  ? 'bg-rose-50 text-rose-700'
                                  : document.status === 'Revision Requested'
                                    ? 'bg-orange-50 text-orange-700'
                                    : document.status === 'Under Review'
                                      ? 'bg-amber-50 text-amber-700'
                                      : 'bg-slate-100 text-slate-700'
                            }`}>
                              {document.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              disabled={document.action === 'Pending'}
                              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-[10px] font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {document.action}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-lg border border-slate-300 bg-white p-5 shadow-card">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-base font-bold">Onboarding Progress</h2>
                    <span className="text-xs font-bold text-brand-700">{onboardingSummary.progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-brand-600" style={{ width: `${onboardingSummary.progress}%` }} />
                  </div>
                  <div className="mt-3 text-xs text-slate-500">{onboardingSummary.progressNote}</div>
                </div>

                <div className="rounded-lg border border-slate-300 bg-white p-5 shadow-card">
                  <h2 className="text-base font-bold">Next Tasks</h2>
                  <div className="mt-4 space-y-2">
                    {nextTasks.map((task) => (
                      <div key={task.label} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
                        <span className="text-sm font-semibold text-slate-700">{task.label}</span>
                        <span className="text-xs font-bold text-slate-500">{task.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function Metric({ icon: Icon, label, value, tone }) {
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-brand-50 text-brand-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
  }

  return (
    <div className="rounded-lg border border-slate-300 bg-white p-4 shadow-card">
      <div className="flex items-center gap-3">
        <div className={`grid h-10 w-10 place-items-center rounded-full ${tones[tone]}`}>
          <Icon size={19} />
        </div>
        <div>
          <div className="text-xs font-semibold text-slate-500">{label}</div>
          <div className="text-base font-bold text-slate-950">{value}</div>
        </div>
      </div>
    </div>
  )
}
