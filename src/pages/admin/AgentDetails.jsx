import { useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { Eye, Check, RotateCcw, XCircle, ArrowRight } from 'lucide-react'
import { ShowRealtimeAlert } from '../../redux/realtimeSlice.js'
import {
  getAgent,
  getAgentAgreementPreview,
  getAgentSignedDocuments,
  rejectAgentDocument,
  reviewAgentDocument,
  triggerAgentAgreements,
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
  const dispatch = useDispatch()
  const [agent, setAgent] = useState(null)
  const [signedDocuments, setSignedDocuments] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [savingDocumentId, setSavingDocumentId] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [previewState, setPreviewState] = useState({
    row: null,
    pdfUrl: '',
    loading: false,
    error: '',
  })
  const [triggeringAgreements, setTriggeringAgreements] = useState(false)
  const [managerEmail, setManagerEmail] = useState('')

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
  const agreementPackage = agent?.documents?.agreementPackage || null
  const agreementsTriggered = Boolean(agreementPackage?.triggeredAt)
  const agentSigned = Boolean(agreementPackage?.agentSignedAt)
  const managerSigned = Boolean(agreementPackage?.managerSignedAt)
  const managerRequired = Boolean(agreementPackage?.managerEmail || managerEmail.trim())
  const awaitingSignatures = agreementsTriggered && (!agentSigned || (agreementPackage?.managerEmail && !managerSigned))
  const readyForReview = agreementsTriggered && agentSigned && (!agreementPackage?.managerEmail || managerSigned)
  const managerStatusLabel = !managerRequired
    ? 'Not configured'
    : managerSigned
      ? 'Completed'
      : agreementsTriggered
        ? 'Signature link sent'
        : 'Pending trigger'
  const hasCompletedSignaturePackage = readyForReview || managerSigned

  const approvedCount = documentRows.filter((row) => row.reviewAction === 'approved').length
  const totalCount = documentRows.length
  const approvalProgress = totalCount ? Math.round((approvedCount / totalCount) * 100) : 0

  const canProceedToMGA =
    readyForReview &&
    totalCount > 0 &&
    documentRows.every((row) => row.submittedAt) &&
    documentRows.every((row) => row.reviewAction === 'approved')

  const handleTriggerAgreements = async () => {
    if (!agentId) return
    const normalizedManagerEmail = managerEmail.trim()
    if (!normalizedManagerEmail) {
      dispatch(
        ShowRealtimeAlert({
          variant: 'warning',
          title: 'Manager Email Required',
          message: 'Manager email is required before sending the Step-2 agreement package.',
        }),
      )
      return
    }

    setTriggeringAgreements(true)
    try {
      const response = await triggerAgentAgreements(agentId, {
        managerEmail: normalizedManagerEmail,
      })
      if (response?.agent) {
        setAgent(response.agent)
      } else {
        const refreshed = await getAgent(agentId)
        setAgent(refreshed)
      }
      setManagerEmail('')
      dispatch(
        ShowRealtimeAlert({
          variant: 'success',
          title: agreementsTriggered ? 'Signature Links Re-sent' : 'Agreement Package Sent',
          message: agreementsTriggered
            ? 'Secure agreement links were re-sent to the agent and manager.'
            : 'Agreement package generated and signature links sent to the agent and manager.',
        }),
      )
    } catch (err) {
      dispatch(ShowRealtimeAlert({ variant: 'danger', title: 'Step 2 Trigger Failed', message: err.message || 'Unable to trigger agreement package.' }))
    } finally {
      setTriggeringAgreements(false)
    }
  }

  const handleReviewAction = async (row, action) => {
    if (!agentId) return
    setSavingDocumentId(`${row.type}:${row.id}`)
    try {
      if (action === 'rejected') {
        await rejectAgentDocument(agentId, {
          documentType: row.type,
          documentId: row.id,
        })
      } else {
        await reviewAgentDocument(agentId, {
          documentType: row.type,
          documentId: row.id,
          action,
        })
      }

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
      dispatch(ShowRealtimeAlert({ variant: 'danger', title: 'Review Update Failed', message: err.message || 'Unable to save review action.' }))
    } finally {
      setSavingDocumentId('')
    }
  }

  const handlePreviewDocument = async (row) => {
    if (!agentId) return

    if (previewState.pdfUrl) {
      URL.revokeObjectURL(previewState.pdfUrl)
    }

    setPreviewState({
      row,
      pdfUrl: '',
      loading: true,
      error: '',
    })

    try {
      const blob = await getAgentAgreementPreview(agentId, row.id)
      const pdfUrl = URL.createObjectURL(blob)
      setPreviewState({
        row,
        pdfUrl,
        loading: false,
        error: '',
      })
    } catch (err) {
      setPreviewState({
        row,
        pdfUrl: '',
        loading: false,
        error: err.message || 'Unable to load the agreement preview.',
      })
    }
  }

  const closePreview = () => {
    if (previewState.pdfUrl) {
      URL.revokeObjectURL(previewState.pdfUrl)
    }

    setPreviewState({
      row: null,
      pdfUrl: '',
      loading: false,
      error: '',
    })
  }

  useEffect(() => {
    return () => {
      if (previewState.pdfUrl) {
        URL.revokeObjectURL(previewState.pdfUrl)
      }
    }
  }, [previewState.pdfUrl])

  const handleProceed = async () => {
    if (!agentId || !canProceedToMGA) return
    setUpdatingStatus(true)
    try {
      await updateAgentOnboardingStatus(agentId, 6)
      navigate(`/admin/agents/${agentId}/mga-package`)
    } catch (err) {
      dispatch(ShowRealtimeAlert({ variant: 'danger', title: 'Unable to Proceed', message: err.message || 'Unable to proceed to MGA setup.' }))
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
              <MetricCard
                label="Status"
                value={
                  !agreementsTriggered
                    ? 'Awaiting Trigger'
                    : awaitingSignatures
                      ? 'Waiting for Signatures'
                      : canProceedToMGA
                        ? 'Ready for MGA'
                        : 'Pending Review'
                }
              />
              <MetricCard label="Approved" value={`${approvedCount} of ${totalCount}`} />
            </div>

            <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    {hasCompletedSignaturePackage ? 'Step 2 Agreement Status' : 'Step 2 Agreement Trigger'}
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    {hasCompletedSignaturePackage
                      ? 'The Step-2 signature package has been generated and completed. Review the timeline below before moving to MGA.'
                      : 'Generate the agreement PDFs, release the agent signing package, and send a secure manager signature link.'}
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    Triggered:{' '}
                    {agent?.documents?.agreementPackage?.triggeredAt
                      ? new Date(agent.documents.agreementPackage.triggeredAt).toLocaleString()
                      : 'Not yet'}
                  </div>
                  {agreementPackage?.agentSignedAt ? (
                    <div className="mt-1 text-xs text-slate-500">
                      Agent signed: {new Date(agreementPackage.agentSignedAt).toLocaleString()}
                    </div>
                  ) : null}
                  {agreementPackage?.managerInviteSentAt && !managerSigned ? (
                    <div className="mt-1 text-xs text-slate-500">
                      Manager link sent: {new Date(agreementPackage.managerInviteSentAt).toLocaleString()}
                    </div>
                  ) : null}
                  {agreementPackage?.managerSignedAt ? (
                    <div className="mt-1 text-xs text-slate-500">
                      Manager signed: {new Date(agreementPackage.managerSignedAt).toLocaleString()}
                    </div>
                  ) : null}
                </div>
                {hasCompletedSignaturePackage ? (
                  <div className="grid gap-3 text-sm text-slate-700">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Manager Email</div>
                      <div className="mt-1 font-medium text-slate-900">
                        {agreementPackage?.managerEmail || 'Not provided'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current Status</div>
                      <div className="mt-1 font-medium text-slate-900">
                        {readyForReview ? 'Pending Admin Review' : 'Waiting for final signatures'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-end gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Manager Email
                      </label>
                      <input
                        value={managerEmail}
                        onChange={(e) => setManagerEmail(e.target.value)}
                        placeholder="manager@example.com"
                        className="w-64 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                      {agreementPackage?.managerEmail ? (
                        <div className="mt-1 text-xs text-slate-500">
                          Current recipient: {agreementPackage.managerEmail}
                        </div>
                      ) : (
                        <div className="mt-1 text-xs text-slate-500">
                          Required for the secure manager signature link.
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleTriggerAgreements}
                      disabled={triggeringAgreements}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-blue-300"
                    >
                      {triggeringAgreements
                        ? 'Sending...'
                        : agreementsTriggered
                          ? 'Re-send Signature Links'
                          : 'Generate & Send for Signature'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {!agreementsTriggered && (
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Agreements have not been triggered yet. Generate the Step-2 package first.
              </div>
            )}

            {awaitingSignatures && (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="text-sm font-semibold text-slate-900">Waiting for Signatures</h3>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="text-xs uppercase tracking-wide text-slate-500">Agent Signature</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {agentSigned ? 'Completed' : 'Pending'}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {agentSigned ? new Date(agreementPackage.agentSignedAt).toLocaleString() : 'Agent has not finished the document package yet.'}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="text-xs uppercase tracking-wide text-slate-500">Manager Signature</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {managerStatusLabel}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {agreementPackage?.managerEmail
                        ? managerSigned
                          ? `${new Date(agreementPackage.managerSignedAt).toLocaleString()}${agreementPackage.managerSignature?.fullName ? ` by ${agreementPackage.managerSignature.fullName}` : ''}`
                          : `Secure link sent to ${agreementPackage.managerEmail}. Waiting for completion.`
                        : 'A manager email is required before Step-2 can be sent.'}
                    </div>
                    {agreementPackage?.managerSignature?.jobTitle ? (
                      <div className="mt-2 text-xs text-slate-500">
                        Manager title: {agreementPackage.managerSignature.jobTitle}
                      </div>
                    ) : null}
                    {agreementPackage?.managerEmail && !managerSigned ? (
                      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                        The manager must use the secure email link to complete this signature step. If they did not receive it, re-send the signature links above.
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            )}

            {readyForReview && (
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
                                onClick={() => handlePreviewDocument(row)}
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
            )}

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Approval Progress</div>
                  <div className="text-xs text-slate-500">
                    {approvedCount} of {totalCount} documents approved
                    {!agent?.documents?.agreementPackage?.triggeredAt ? ' • Trigger Step 2 first' : ''}
                  </div>
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
      {previewState.row && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-5xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <div className="text-sm font-semibold text-slate-900">{previewState.row.name}</div>
                <div className="text-xs text-slate-500">{previewState.row.fileName}</div>
              </div>
              <button
                type="button"
                onClick={closePreview}
                className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
            <div className="space-y-4 px-5 py-4 text-sm text-slate-700">
              <div className="grid gap-3 sm:grid-cols-4">
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">Document Title</div>
                  <div className="mt-1 font-semibold text-slate-900">{previewState.row.title || previewState.row.name}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">Submitted</div>
                  <div className="mt-1">{previewState.row.submittedAt ? new Date(previewState.row.submittedAt).toLocaleString() : '-'}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">Accepted</div>
                  <div className="mt-1">{previewState.row.accepted ? 'Yes' : 'No'}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">Signature</div>
                  <div className="mt-1">{previewState.row.signature ? `${previewState.row.signature} (${previewState.row.signatureType || 'type'})` : 'Not captured'}</div>
                </div>
              </div>

              {previewState.loading ? (
                <div className="grid h-[65vh] place-items-center rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
                  Loading agreement PDF...
                </div>
              ) : previewState.error ? (
                <div className="grid h-[65vh] place-items-center rounded-xl border border-rose-200 bg-rose-50 px-6 text-center text-sm text-rose-600">
                  {previewState.error}
                </div>
              ) : previewState.pdfUrl ? (
                <iframe
                  title={`${previewState.row.name} preview`}
                  src={previewState.pdfUrl}
                  className="h-[65vh] w-full rounded-xl border border-slate-200"
                />
              ) : null}
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
