import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  BadgeCheck,
  BookOpenCheck,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileText,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'
import AgentSidebar from '../../components/AgentSidebar.jsx'
import CommonHeader from '../../components/CommonHeader.jsx'
import { auth } from '../../utils/auth.js'
import { getAgent } from '../../utils/agents.js'

function formatDate(value) {
  if (!value) return 'Not set'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function daysUntil(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function valueOrDash(value) {
  return value === null || value === undefined || value === '' ? '-' : String(value)
}

function getDocumentStatus(doc) {
  const action = doc?.adminReview?.action
  if (!doc) return 'Missing'
  if (action) return action.replace(/_/g, ' ')
  return 'Uploaded'
}

function buildDocumentRows(agent) {
  const docs = agent?.documents || {}
  const rows = [
    { key: 'transferDocument', label: 'Licence Copy', category: 'Licensing' },
    { key: 'licenceDocument', label: 'Licence Document', category: 'Licensing' },
    { key: 'eandODocument', label: 'E&O Policy Certificate', category: 'Coverage' },
    { key: 'creditReportDocument', label: 'Credit Report', category: 'Compliance' },
  ]

  const seen = new Set()
  return rows
    .map((row) => {
      const doc = docs[row.key]
      const fingerprint = doc?.fileName || doc?.path || row.key
      if (doc && seen.has(fingerprint)) return null
      if (doc) seen.add(fingerprint)
      return {
        ...row,
        name: doc?.originalName || doc?.fileName || row.label,
        status: getDocumentStatus(doc),
        uploaded: doc ? formatDate(doc.uploadedAt || agent?.createdAt) : 'Not uploaded',
        available: Boolean(doc),
      }
    })
    .filter(Boolean)
}

function getRenewalTone(days) {
  if (days === null) return 'slate'
  if (days < 0) return 'rose'
  if (days <= 30) return 'amber'
  return 'emerald'
}

function getRenewalLabel(days) {
  if (days === null) return 'Expiry not set'
  if (days < 0) return `${Math.abs(days)} days overdue`
  if (days === 0) return 'Expires today'
  return `${days} days remaining`
}

export default function AgentLicensing() {
  const session = auth.get()
  const [agent, setAgent] = useState(null)
  const [headerSearch, setHeaderSearch] = useState('')

  useEffect(() => {
    if (!session?.id) return
    getAgent(session.id)
      .then((data) => setAgent(data || null))
      .catch(() => setAgent(null))
  }, [session?.id])

  const agentName = agent?.name || session?.name || 'Agent'
  const initials = agentName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const licenceExpiry =
    agent?.licenceExpiryDate ||
    agent?.licenceExpiry ||
    agent?.licenseExpiry ||
    agent?.licenseExpDate ||
    agent?.licenceExpDate ||
    ''
  const eoExpiry = agent?.eoPolicyExpiryDate || ''
  const licenceDays = daysUntil(licenceExpiry)
  const eoDays = daysUntil(eoExpiry)
  const documentRows = useMemo(() => buildDocumentRows(agent), [agent])
  const uploadedDocuments = documentRows.filter((doc) => doc.available).length

  const ceCredits = agent?.documents?.profile?.licensing?.ceCredits || {}
  const ceRequired = Number(ceCredits.required || 30)
  const ceCompleted = Number(ceCredits.completed || 0)
  const ceProgress = Math.max(0, Math.min(100, Math.round((ceCompleted / ceRequired) * 100)))
  const ceRecords = Array.isArray(ceCredits.records) ? ceCredits.records : []

  const renewalTasks = [
    {
      label: 'Confirm licence expiry date',
      status: licenceExpiry ? 'Complete' : 'Needed',
      tone: licenceExpiry ? 'emerald' : 'amber',
    },
    {
      label: 'Track continuing education credits',
      status: ceCompleted >= ceRequired ? 'Complete' : `${ceRequired - ceCompleted} credits left`,
      tone: ceCompleted >= ceRequired ? 'emerald' : 'amber',
    },
    {
      label: 'Review E&O policy coverage',
      status: eoExpiry ? getRenewalLabel(eoDays) : 'Expiry not set',
      tone: getRenewalTone(eoDays),
    },
    {
      label: 'Submit renewal package',
      status: licenceDays !== null && licenceDays <= 60 ? 'Prepare' : 'Upcoming',
      tone: licenceDays !== null && licenceDays <= 60 ? 'amber' : 'slate',
    },
  ]

  return (
    <div className="min-h-screen bg-[#eef3f8] text-slate-950">
      <div className="flex h-screen overflow-hidden">
        <AgentSidebar agentName={agentName} initials={initials} />

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <CommonHeader
            title="Licensing"
            searchValue={headerSearch}
            onSearchChange={setHeaderSearch}
            searchPlaceholder="Search licensing records..."
            compact
          />

          <div className="flex-1 overflow-y-auto p-6">
            <div className="mx-auto max-w-6xl space-y-5">
              <div>
                <div className="text-xs font-semibold text-slate-500">Agents &gt; Licensing</div>
                <h1 className="mt-1 text-2xl font-bold tracking-tight">Licensing Management</h1>
              </div>

              <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <Metric icon={ShieldCheck} label="Licence Status" value={Number(agent?.accountActivationStatus) === 1 ? 'Active' : 'In Review'} tone={Number(agent?.accountActivationStatus) === 1 ? 'emerald' : 'amber'} />
                <Metric icon={CalendarClock} label="Licence Renewal" value={getRenewalLabel(licenceDays)} tone={getRenewalTone(licenceDays)} />
                <Metric icon={BookOpenCheck} label="CE Credits" value={`${ceCompleted}/${ceRequired}`} tone={ceCompleted >= ceRequired ? 'emerald' : 'blue'} />
                <Metric icon={FileText} label="Documents" value={`${uploadedDocuments}/${documentRows.length}`} tone="blue" />
              </section>

              <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.05fr_0.95fr]">
                <Panel title="Onboarding Licensing Information" icon={BadgeCheck}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Licence Number" value={agent?.agentId} mono />
                    <Field label="Licence Type" value={agent?.licenceType} />
                    <Field label="Workflow" value={agent?.licenceWorkflow === 'new' ? 'New licence application' : agent?.licenceWorkflow === 'transfer' ? 'Existing licence transfer' : agent?.licenceWorkflow} />
                    <Field label="Licence Expiry" value={formatDate(licenceExpiry)} />
                    <Field label="MGA" value={agent?.mga} />
                    <Field label="Contract Company" value={agent?.insuranceCompany} />
                    <Field label="Sponsorship Required" value={agent?.requireSponsorship ? 'Yes' : 'No'} />
                    <Field label="APEXA" value={agent?.haveApexa ? `Yes, ${valueOrDash(agent?.apexaId)}` : 'Not provided'} />
                  </div>
                </Panel>

                <Panel title="Licence Renewal Management" icon={RefreshCw}>
                  <div className="space-y-3">
                    {renewalTasks.map((task) => (
                      <div key={task.label} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5">
                        <div className="flex items-center gap-3">
                          <span className={`grid h-7 w-7 place-items-center rounded-full ${task.tone === 'emerald' ? 'bg-emerald-50 text-emerald-700' : task.tone === 'amber' ? 'bg-amber-50 text-amber-700' : task.tone === 'rose' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-500'}`}>
                            {task.tone === 'emerald' ? <CheckCircle2 size={14} /> : task.tone === 'rose' ? <AlertTriangle size={14} /> : <Clock size={14} />}
                          </span>
                          <span className="text-sm font-semibold text-slate-700">{task.label}</span>
                        </div>
                        <span className={`text-xs font-bold ${task.tone === 'emerald' ? 'text-emerald-600' : task.tone === 'amber' ? 'text-amber-600' : task.tone === 'rose' ? 'text-rose-600' : 'text-slate-500'}`}>
                          {task.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </Panel>
              </section>

              <section className="grid grid-cols-1 gap-4 lg:grid-cols-[0.85fr_1.15fr]">
                <Panel title="CE Credits Tracking" icon={BookOpenCheck}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-slate-950">{ceCompleted}</div>
                      <div className="text-xs font-semibold text-slate-500">of {ceRequired} required credits completed</div>
                    </div>
                    <span className="rounded bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">{ceProgress}%</span>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-blue-600" style={{ width: `${ceProgress}%` }} />
                  </div>
                  <div className="mt-4 space-y-2">
                    {ceRecords.length ? ceRecords.map((record, index) => (
                      <div key={`${record.title}-${index}`} className="rounded-lg border border-slate-200 px-3 py-2">
                        <div className="text-sm font-bold text-slate-800">{record.title}</div>
                        <div className="mt-0.5 text-xs text-slate-500">{valueOrDash(record.credits)} credits, completed {formatDate(record.completedAt)}</div>
                      </div>
                    )) : (
                      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                        CE credits are not tracked yet for this agent. Future uploaded CE certificates can be listed here.
                      </div>
                    )}
                  </div>
                </Panel>

                <Panel title="Licensing Documents" icon={FileText}>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-4 py-3 font-bold">Document</th>
                          <th className="px-4 py-3 font-bold">Category</th>
                          <th className="px-4 py-3 font-bold">Uploaded</th>
                          <th className="px-4 py-3 font-bold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {documentRows.map((doc) => (
                          <tr key={doc.key}>
                            <td className="px-4 py-3 font-semibold text-slate-800">{doc.name}</td>
                            <td className="px-4 py-3 text-slate-600">{doc.category}</td>
                            <td className="px-4 py-3 text-slate-600">{doc.uploaded}</td>
                            <td className="px-4 py-3">
                              <span className={`rounded px-2 py-1 text-[10px] font-bold uppercase ${doc.available ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                {doc.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Panel>
              </section>

              <Panel title="E&O Coverage" icon={Building2}>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Policy Number" value={agent?.eoPolicyNumber} mono />
                  <Field label="Policy Company" value={agent?.eoPolicyCompany} />
                  <Field label="Policy Expiry" value={formatDate(eoExpiry)} />
                </div>
              </Panel>
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
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
    slate: 'bg-slate-100 text-slate-600',
  }

  return (
    <div className="rounded-lg border border-slate-300 bg-white p-4 shadow-card">
      <div className="flex items-center gap-3">
        <div className={`grid h-10 w-10 place-items-center rounded-full ${tones[tone] || tones.slate}`}>
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-slate-500">{label}</div>
          <div className="truncate text-base font-bold text-slate-950">{value}</div>
        </div>
      </div>
    </div>
  )
}

function Panel({ title, icon: Icon, children }) {
  return (
    <section className="rounded-lg border border-slate-300 bg-white shadow-card">
      <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
        <div className="grid h-8 w-8 place-items-center rounded-md bg-blue-50 text-blue-700">
          <Icon size={16} />
        </div>
        <h2 className="text-sm font-bold text-slate-900">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

function Field({ label, value, mono }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</div>
      <div className={`mt-1 text-sm font-semibold text-slate-800 ${mono ? 'font-mono' : ''}`}>
        {valueOrDash(value)}
      </div>
    </div>
  )
}
