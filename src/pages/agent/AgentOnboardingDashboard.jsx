import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, CheckCircle2, Clock3, FileText, LockKeyhole, Mail } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { auth } from '../../utils/auth.js'
import { getAgent, getAgentSignedDocuments, updateAgentOnboardingStatus } from '../../utils/agents.js'

const AGREEMENT_DOC_IDS = ['advisor_contract', 'code_of_conduct', 'privacy_policy']

export default function AgentOnboardingDashboard() {
  const session = auth.get()
  const navigate = useNavigate()
  const [agent, setAgent] = useState(null)
  const [signedDocuments, setSignedDocuments] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let mounted = true
    if (!session?.id) return

    Promise.all([getAgent(session.id), getAgentSignedDocuments(session.id)])
      .then(([agentData, signedData]) => {
        if (!mounted) return
        setAgent(agentData)
        setSignedDocuments(signedData || {})
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [session?.id])

  const agreementPackage = agent?.documents?.agreementPackage || null
  const agreementsTriggered = Boolean(agreementPackage?.triggeredAt)
  const managerRequired = Boolean(agreementPackage?.managerEmail)
  const agentSignedAll = AGREEMENT_DOC_IDS.every((id) => Boolean(signedDocuments?.[id]))
  const managerSigned = Boolean(agreementPackage?.managerSignedAt)
  const readyForReview = agentSignedAll && (!managerRequired || managerSigned)
  const adminApproved = Number(agent?.onboardingStatus || 0) >= 4
  const onboardingReadyForPortal = Number(agent?.onboardingStatus || 0) >= 5

  const flow = useMemo(() => {
    if (!agreementsTriggered) {
      return {
        title: 'Waiting for Admin Trigger',
        summary: 'The admin team is preparing your Step-2 agreements package.',
        note: 'You will be notified when your agreement documents are ready for signature.',
        actionLabel: null,
        action: null,
        progress: 35,
        checklist: [
          { label: 'Account Created', status: 'completed' },
          { label: 'Registration Complete', status: 'completed' },
          { label: 'Agreements Triggered by Admin', status: 'in-progress' },
          { label: 'Agent Signature', status: 'locked' },
          { label: 'Admin Review & MGA Submission', status: 'locked' },
        ],
        badge: 'Awaiting Admin',
        icon: Mail,
      }
    }

    if (!agentSignedAll) {
      return {
        title: 'Documents Ready for Signature',
        summary: 'Your agreement package is ready. Please review and sign the required documents.',
        note: 'This step is part of Step-2 Digital Agreements & E-signature.',
        actionLabel: 'Open Agreement Package',
        action: () => navigate('/agent/sign-documents'),
        progress: 55,
        checklist: [
          { label: 'Account Created', status: 'completed' },
          { label: 'Registration Complete', status: 'completed' },
          { label: 'Agreements Triggered by Admin', status: 'completed' },
          { label: 'Agent Signature', status: 'in-progress' },
          { label: 'Admin Review & MGA Submission', status: 'locked' },
        ],
        badge: 'Action Required',
        icon: FileText,
      }
    }

    if (managerRequired && !managerSigned) {
      return {
        title: 'Waiting for Manager Signature',
        summary: 'Your signatures are complete. The package is now waiting for the manager signature.',
        note: `Manager notification sent to ${agreementPackage.managerEmail}.`,
        actionLabel: null,
        action: null,
        progress: 70,
        checklist: [
          { label: 'Account Created', status: 'completed' },
          { label: 'Registration Complete', status: 'completed' },
          { label: 'Agreements Triggered by Admin', status: 'completed' },
          { label: 'Agent Signature', status: 'completed' },
          { label: 'Manager Signature', status: 'in-progress' },
        ],
        badge: 'Waiting for Manager',
        icon: Clock3,
      }
    }

    if (!adminApproved) {
      return {
        title: 'Pending Admin Review',
        summary: 'All Step-2 signatures are complete. The admin team is now reviewing your agreements.',
        note: 'After review, your onboarding package will move to MGA submission.',
        actionLabel: null,
        action: null,
        progress: 82,
        checklist: [
          { label: 'Account Created', status: 'completed' },
          { label: 'Registration Complete', status: 'completed' },
          { label: 'Agreements Triggered by Admin', status: 'completed' },
          { label: 'Agent Signature', status: 'completed' },
          { label: 'Admin Review', status: 'in-progress' },
        ],
        badge: 'In Review',
        icon: LockKeyhole,
      }
    }

    return {
      title: 'Onboarding Moving Forward',
      summary: onboardingReadyForPortal
        ? 'Your onboarding is ready to continue into the portal.'
        : 'Your agreements are approved and the package is moving through the next onboarding steps.',
      note: onboardingReadyForPortal
        ? 'You can continue to your dashboard.'
        : 'The MGA submission process is in progress.',
      actionLabel: onboardingReadyForPortal ? 'Continue to Dashboard' : null,
      action: onboardingReadyForPortal
        ? async () => {
            if (!session?.id || submitting) return
            setSubmitting(true)
            try {
              await updateAgentOnboardingStatus(session.id, 5)
              auth.update({ onboardingStatus: 5 })
              navigate('/agent/dashboard')
            } finally {
              setSubmitting(false)
            }
          }
        : null,
      progress: onboardingReadyForPortal ? 100 : 90,
      checklist: [
        { label: 'Account Created', status: 'completed' },
        { label: 'Registration Complete', status: 'completed' },
        { label: 'Agreements & Signatures', status: 'completed' },
        { label: 'Admin Review', status: 'completed' },
        { label: onboardingReadyForPortal ? 'Portal Access' : 'MGA Submission', status: onboardingReadyForPortal ? 'completed' : 'in-progress' },
      ],
      badge: onboardingReadyForPortal ? 'Ready' : 'MGA In Progress',
      icon: CheckCircle2,
    }
  }, [
    adminApproved,
    agreementPackage?.managerEmail,
    agreementsTriggered,
    agentSignedAll,
    managerRequired,
    managerSigned,
    navigate,
    onboardingReadyForPortal,
    session?.id,
    submitting,
  ])

  const Icon = flow.icon
  const displayName = session?.name || agent?.name || 'Agent'

  if (loading) {
    return <div className="py-16 text-center text-sm text-slate-500">Loading onboarding progress...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <main className="mx-auto max-w-3xl px-6 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Welcome, {displayName.split(' ')[0]}</h1>
          <p className="mt-2 text-sm text-slate-500">Track your onboarding progress and complete the next required step.</p>
        </div>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-700">
                <Icon size={26} />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{flow.badge}</div>
                <h2 className="mt-1 text-2xl font-bold text-slate-900">{flow.title}</h2>
                <p className="mt-2 text-sm text-slate-600">{flow.summary}</p>
                <p className="mt-1 text-xs text-slate-500">{flow.note}</p>
              </div>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
              {flow.progress}%
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Overall Progress</span>
              <span>{flow.progress}% complete</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-500" style={{ width: `${flow.progress}%` }} />
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">Onboarding Checklist</div>
            <div className="mt-4 space-y-3">
              {flow.checklist.map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                    item.status === 'completed'
                      ? 'border-emerald-200 bg-emerald-50'
                      : item.status === 'in-progress'
                        ? 'border-amber-200 bg-amber-50'
                        : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`grid h-8 w-8 place-items-center rounded-full ${
                        item.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : item.status === 'in-progress'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {item.status === 'completed' ? <CheckCircle2 size={16} /> : <Clock3 size={16} />}
                    </div>
                    <span className="text-sm font-medium text-slate-800">{item.label}</span>
                  </div>
                  <span
                    className={`text-xs font-bold uppercase tracking-wide ${
                      item.status === 'completed'
                        ? 'text-emerald-700'
                        : item.status === 'in-progress'
                          ? 'text-amber-700'
                          : 'text-slate-400'
                    }`}
                  >
                    {item.status === 'completed' ? 'Completed' : item.status === 'in-progress' ? 'In Progress' : 'Locked'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {flow.actionLabel && (
            <button
              type="button"
              onClick={flow.action}
              disabled={submitting}
              className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {submitting ? 'Opening...' : flow.actionLabel}
              <ArrowRight size={16} />
            </button>
          )}

          {!flow.actionLabel && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
              The next action is currently with the admin team. You will receive updates here as your onboarding progresses.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
