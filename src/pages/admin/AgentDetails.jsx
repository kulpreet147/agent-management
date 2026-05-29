import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Eye, Check, RotateCcw, XCircle, ArrowRight } from 'lucide-react'
import {
  getAgent,
  getAgentSignedDocuments,
  reviewAgentDocument,
  updateAgentOnboardingStatus,
} from '../../utils/agents.js'

const signedDocumentCatalog = [
  {
    id: 'advisor_contract',
    name: 'Advisor Contract',
    sampleFile: 'Signed_Contract_v2.pdf',
    title: 'Independent Advisor Agreement',
  },
  {
    id: 'code_of_conduct',
    name: 'Code of Conduct',
    sampleFile: 'CoC_Acknowledgement.pdf',
    title: 'Professional Code of Conduct',
  },
  {
    id: 'privacy_policy',
    name: 'Privacy Agreement',
    sampleFile: 'Privacy_Consent_Final.pdf',
    title: 'Privacy & Data Protection Policy',
  },
]

const actionMeta = {
  approved: { label: 'Approved', className: 'bg-emerald-100 text-emerald-700' },
  revision_requested: { label: 'Revision Requested', className: 'bg-amber-100 text-amber-700' },
  rejected: { label: 'Rejected', className: 'bg-rose-100 text-rose-700' },
  pending: { label: 'Pending Review', className: 'bg-slate-100 text-slate-700' },
}

function normalizeSignedDocuments(signedDocuments) {
  return signedDocumentCatalog.map((catalogDoc) => {
    const value = signedDocuments?.[catalogDoc.id]
    return {
      id: catalogDoc.id,
    type: 'signed',
      name: value?.documentName || catalogDoc.name,
      fileName: value?.metadata?.fileName || catalogDoc.sampleFile,
      title: value?.metadata?.title || catalogDoc.title,
    path: null,
    submittedAt: value?.submittedAt,
      accepted: Boolean(value?.accepted),
      signature: value?.signature || '',
      signatureType: value?.signatureType || '',
      acceptanceText: value?.acceptanceText || '',
    reviewAction: value?.metadata?.adminReview?.action || 'pending',
    }
  })
}

export default function AgentDetails() {
  const { agentId } = useParams()
  const navigate = useNavigate()
  const [agent, setAgent] = useState(null)
  const [signedDocuments, setSignedDocuments] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [savingDocumentId, setSavingDocumentId] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [previewDoc, setPreviewDoc] = useState(null)

  useEffect(() => {
    if (!agentId) return

    let mounted = true

    Promise.all([getAgent(agentId), getAgentSignedDocuments(agentId)])
      .then(([agentData, signedData]) => {
        if (!mounted) return
        if (Number(agentData?.onboardingStatus) >= 6) {
          navigate(`/admin/agents/${agentId}/mga-package`, { replace: true })
          return
        }
        setAgent(agentData)
        setSignedDocuments(signedData || {})
      })
      .catch((err) => {
        if (mounted) setError(err.message || 'Unable to load review data.')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [agentId, navigate])

  const documentRows = useMemo(() => normalizeSignedDocuments(signedDocuments), [signedDocuments])

  const approvedCount = documentRows.filter((row) => row.reviewAction === 'approved').length
  const totalCount = documentRows.length
  const approvalProgress = totalCount ? Math.round((approvedCount / totalCount) * 100) : 0

  const canProceedToMGA =
    totalCount > 0 &&
    documentRows.every((row) => row.submittedAt) &&
    documentRows.every((row) => row.reviewAction === 'approved')

  const handleReviewAction = async (row, action) => {
    if (!agentId) return
    setSavingDocumentId(`${row.type}:${row.id}`)
    try {
      await reviewAgentDocument(agentId, {
        documentType: row.type,
        documentId: row.id,
        action,
      })

      setSignedDocuments((prev) => ({
        ...prev,
        [row.id]: {
          ...prev[row.id],
          metadata: {
            ...(prev[row.id]?.metadata || {}),
            adminReview: { action },
          },
        },
      }))
    } catch (err) {
      window.alert(err.message || 'Unable to save review action.')
    } finally {
      setSavingDocumentId('')
    }
  }

  const handleProceed = async () => {
    if (!agentId || !canProceedToMGA) return
    setUpdatingStatus(true)
    try {
      await updateAgentOnboardingStatus(agentId, 6)
      navigate(`/admin/agents/${agentId}/mga-package`)
    } catch (err) {
      window.alert(err.message || 'Unable to proceed to MGA setup.')
    } finally {
      setUpdatingStatus(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Document Review</p>
            <h1 className="mt-1 text-3xl font-semibold text-slate-900">Document Review - {agent?.name || 'Agent'}</h1>
            <p className="mt-1 text-sm text-slate-500">Review submitted documents, take action, and move the onboarding to MGA setup.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin/agents')}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Back to Agents
          </button>
        </div>

        {loading ? (
          <div className="py-14 text-center text-sm text-slate-500">Loading review screen...</div>
        ) : error ? (
          <div className="py-14 text-center text-sm text-rose-600">{error}</div>
        ) : (
          <>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <MetricCard label="Total Documents" value={`${totalCount} Signed Files`} />
              <MetricCard label="Status" value={canProceedToMGA ? 'Ready for MGA' : 'Pending Review'} />
              <MetricCard label="Approved" value={`${approvedCount} of ${totalCount}`} />
            </div>

            <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">Document Name</th>
                    <th className="px-4 py-3">Submitted</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {documentRows.map((row) => {
                    const status = actionMeta[row.reviewAction] || actionMeta.pending
                    const isSaving = savingDocumentId === `${row.type}:${row.id}`
                    return (
                      <tr key={`${row.type}-${row.id}`}>
                        <td className="px-4 py-4">
                          <div className="font-semibold text-slate-900">{row.name}</div>
                          <div className="text-xs text-slate-500">{row.fileName}</div>
                        </td>
                        <td className="px-4 py-4 text-slate-600">
                          {row.submittedAt ? new Date(row.submittedAt).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setPreviewDoc(row)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              <Eye size={13} />
                              Preview
                            </button>
                            <ActionButton icon={Check} label="Approve" tone="approve" disabled={isSaving} onClick={() => handleReviewAction(row, 'approved')} />
                            <ActionButton icon={RotateCcw} label="Request Revision" tone="revise" disabled={isSaving} onClick={() => handleReviewAction(row, 'revision_requested')} />
                            <ActionButton icon={XCircle} label="Reject" tone="reject" disabled={isSaving} onClick={() => handleReviewAction(row, 'rejected')} />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Approval Progress</div>
                  <div className="text-xs text-slate-500">{approvedCount} of {totalCount} documents approved</div>
                </div>
                <button
                  type="button"
                  disabled={!canProceedToMGA || updatingStatus}
                  onClick={handleProceed}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {updatingStatus ? 'Proceeding...' : 'Proceed to MGA Setup'}
                  <ArrowRight size={15} />
                </button>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-brand-600" style={{ width: `${approvalProgress}%` }} />
              </div>
            </div>
          </>
        )}
      </div>
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <div className="text-sm font-semibold text-slate-900">{previewDoc.name}</div>
                <div className="text-xs text-slate-500">{previewDoc.fileName}</div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
            <div className="space-y-4 px-5 py-4 text-sm text-slate-700">
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500">Document Title</div>
                <div className="mt-1 font-semibold text-slate-900">{previewDoc.title || previewDoc.name}</div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">Submitted</div>
                  <div className="mt-1">{previewDoc.submittedAt ? new Date(previewDoc.submittedAt).toLocaleString() : 'Not submitted'}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">Accepted</div>
                  <div className="mt-1">{previewDoc.accepted ? 'Yes' : 'No'}</div>
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500">Acceptance Statement</div>
                <div className="mt-1 rounded-lg bg-slate-50 p-3 text-xs">{previewDoc.acceptanceText || 'No acceptance statement captured.'}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500">Signature</div>
                <div className="mt-1 rounded-lg bg-slate-50 p-3 text-sm">
                  {previewDoc.signature ? `${previewDoc.signature} (${previewDoc.signatureType || 'type'})` : 'No signature required for this document.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MetricCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-semibold text-slate-900">{value}</div>
    </div>
  )
}

function ActionButton({ icon: Icon, label, tone, onClick, disabled }) {
  const toneClasses = {
    approve: 'border-emerald-200 text-emerald-700 hover:bg-emerald-50',
    revise: 'border-amber-200 text-amber-700 hover:bg-amber-50',
    reject: 'border-rose-200 text-rose-700 hover:bg-rose-50',
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-60 ${toneClasses[tone] || ''}`}
    >
      <Icon size={13} />
      {label}
    </button>
  )
}
