import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { Mail, CheckCircle2, Send, X } from 'lucide-react'
import { ShowRealtimeAlert } from '../../redux/realtimeSlice.js'
import { auth } from '../../utils/auth.js'
import { getAccountActivities, updateAccountActivity } from '../../utils/activities.js'
import {
  getAgent,
  getAgentSignedDocuments,
  updateAccountActivationStatus,
  sendMgaPackageEmail,
} from '../../utils/agents.js'

const uploadedLabels = {
  advisorContractPdf: 'Advisor Contract PDF',
  codeOfConductPdf: 'Code of Conduct PDF',
  privacyConfidentialityPdf: 'Privacy & Confidentiality PDF',
  licenceDocument: 'Agent Insurance Licence Copy',
  transferDocument: 'Agent Insurance Licence Copy',
  eandODocument: 'Agent E&O Copy',
  governmentId: 'Agent ID (Driving Licence)',
}

const requiredMgaAttachments = [
  { id: 'advisorContractPdf', keys: ['advisorContractPdf'], name: 'Advisor Contract PDF' },
  { id: 'codeOfConductPdf', keys: ['codeOfConductPdf'], name: 'Code of Conduct PDF' },
  { id: 'privacyConfidentialityPdf', keys: ['privacyConfidentialityPdf'], name: 'Privacy & Confidentiality PDF' },
  { id: 'insuranceLicenceCopy', keys: ['licenceDocument', 'transferDocument'], name: 'Agent Insurance Licence Copy' },
  { id: 'eandoCopy', keys: ['eandODocument'], name: 'Agent E&O Copy' },
  { id: 'governmentId', keys: ['governmentId'], name: 'Agent ID (Driving Licence)' },
  { id: 'sinNumber', keys: ['sin'], name: 'Agent SIN Number', virtual: true },
]

export default function AgentMGAPackage() {
  const { agentId } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [agent, setAgent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editingEmail, setEditingEmail] = useState(false)
  const [toInput, setToInput] = useState('mga@elitefinancial.com')
  const [toList, setToList] = useState(['mga@elitefinancial.com'])
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [attachments, setAttachments] = useState([])
  const [activities, setActivities] = useState([])
  const [updatingActivation, setUpdatingActivation] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [completingApexa, setCompletingApexa] = useState(false)

  function buildAttachmentRows(agentData, savedKeys = null) {
    const selectedSet = Array.isArray(savedKeys) && savedKeys.length > 0 ? new Set(savedKeys) : null
    const documentMap = agentData?.documents || {}
    const isTransferWorkflow = agentData?.licenceWorkflow === 'transfer'
    const visibleRequiredAttachments = requiredMgaAttachments.filter((attachment) => {
      if (attachment.id === 'insuranceLicenceCopy' || attachment.id === 'eandoCopy') {
        return isTransferWorkflow
      }
      return true
    })

    return visibleRequiredAttachments.map((attachment) => {
      if (attachment.virtual) {
        const available = Boolean(String(agentData?.sin || '').trim())
        return {
          id: `virtual:${attachment.id}`,
          key: 'sin',
          name: attachment.name,
          size: available ? 'Included as text attachment' : '-',
          selected: true,
          required: true,
          available,
          missing: !available,
        }
      }

      const matchedKey = attachment.keys.find((key) => documentMap[key])
      const doc = matchedKey ? documentMap[matchedKey] : null
      return {
        id: `uploaded:${attachment.id}`,
        key: matchedKey || attachment.keys[0],
        name: attachment.name,
        size: formatSize(doc?.size),
        selected: selectedSet ? selectedSet.has(matchedKey || attachment.keys[0]) : true,
        required: true,
        available: Boolean(doc?.path),
        missing: !doc?.path,
      }
    })
  }

  useEffect(() => {
    if (!agentId) return
    let mounted = true
    Promise.all([
      getAgent(agentId),
      getAgentSignedDocuments(agentId),
      getAccountActivities('agent', agentId, { limit: 100 }).catch(() => ({ items: [] })),
    ])
      .then(([agentData, _signedDocuments, activityData]) => {
        if (!mounted) return
        setAgent(agentData)
        setActivities(Array.isArray(activityData?.items) ? activityData.items : [])
        const savedSubmission = agentData?.documents?.mgaSubmission || null
        const defaultRecipients = ['mga@elitefinancial.com']
        const defaultSubject = `New Agent Onboarding Package - ${agentData?.name || ''}`
        const defaultBody =
          `Dear MGA Team,\n\nPlease find attached the onboarding package for ${agentData?.name || ''}.\n\nThis MGA package includes the 3 signed agreement PDFs together with the agent registration/compliance documents required for MGA review${agentData?.licenceWorkflow === 'transfer' ? ', including the insurance licence copy and E&O copy' : ''}.\n\nThe agent has completed the required agreement workflow, and the admin team has reviewed the package before MGA submission.\n\nPlease review the attached documents and confirm the next steps for processing.\n\nBest regards,\nAgent Management Admin`

        setAttachments(buildAttachmentRows(agentData, savedSubmission?.attachmentDocumentKeys || null))
        setToList(
          Array.isArray(savedSubmission?.recipients) && savedSubmission.recipients.length > 0
            ? savedSubmission.recipients
            : defaultRecipients,
        )
        setToInput('')
        setSubject(savedSubmission?.subject || defaultSubject)
        setBody(savedSubmission?.body || defaultBody)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [agentId])

  const selectedAttachments = attachments.filter((item) => item.selected)
  const readyAttachmentCount = attachments.filter((item) => item.selected && item.available).length
  const missingRequiredAttachments = attachments.filter((item) => item.required && item.missing)
  const mgaSubmission = agent?.documents?.mgaSubmission || null
  const hasSentPackage = Boolean(mgaSubmission?.sentAt)
  const latestApexaActivity =
    activities
      .filter((activity) => activity.action === 'create_apexa_contract')
      .sort((a, b) => {
        const aActivation = a?.details?.step === 'activation' ? 1 : 0
        const bActivation = b?.details?.step === 'activation' ? 1 : 0
        if (aActivation !== bActivation) return bActivation - aActivation
        return new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime()
      })[0] || null
  const apexaTaskCompleted = Boolean(latestApexaActivity?.details?.completed)

  function addRecipient() {
    const value = toInput.trim()
    if (!value) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      dispatch(ShowRealtimeAlert({ variant: 'warning', title: 'Invalid Email', message: 'Please enter a valid email address.' }))
      return
    }
    if (!toList.includes(value)) setToList((prev) => [...prev, value])
    setToInput('')
  }

  function removeRecipient(value) {
    setToList((prev) => prev.filter((item) => item !== value))
  }

  function toggleAttachment(id) {
    setAttachments((prev) =>
      prev.map((item) =>
        item.id === id && !item.required ? { ...item, selected: !item.selected } : item,
      ),
    )
  }

  async function sendToMGA() {
    if (sendingEmail) return
    if (toList.length === 0) {
      dispatch(ShowRealtimeAlert({ variant: 'warning', title: 'Missing Recipient', message: 'Please add at least one recipient in "To".' }))
      return
    }
    if (selectedAttachments.length === 0) {
      dispatch(ShowRealtimeAlert({ variant: 'warning', title: 'No Attachments Selected', message: 'Please select at least one attachment.' }))
      return
    }
    if (missingRequiredAttachments.length > 0) {
      dispatch(
        ShowRealtimeAlert({
          variant: 'warning',
          title: 'Required MGA Items Missing',
          message: `Missing required attachments: ${missingRequiredAttachments.map((item) => item.name).join(', ')}.`,
        }),
      )
      return
    }
    if (!toList.every((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))) {
      dispatch(ShowRealtimeAlert({ variant: 'warning', title: 'Invalid Recipient', message: 'One or more recipient emails are invalid.' }))
      return
    }
    try {
      setSendingEmail(true)
      const session = auth.get()
      const response = await sendMgaPackageEmail(agentId, {
        to: toList,
        adminEmail: session?.email || undefined,
        subject,
        body,
        attachments: selectedAttachments.map((item) => item.name),
        attachmentDocumentKeys: selectedAttachments
          .filter((item) => item.id.startsWith('uploaded:'))
          .map((item) => item.key)
          .filter(Boolean),
      })
      if (response?.agent) {
        setAgent(response.agent)
        const savedSubmission = response.agent?.documents?.mgaSubmission || null
        setAttachments(buildAttachmentRows(response.agent, savedSubmission?.attachmentDocumentKeys || null))
      }
      dispatch(
        ShowRealtimeAlert({
          variant: 'success',
          title: hasSentPackage ? 'MGA Email Re-sent' : 'MGA Email Sent',
          message: hasSentPackage ? 'MGA package email re-sent successfully.' : 'MGA package email sent successfully.',
        }),
      )
    } catch (error) {
      dispatch(ShowRealtimeAlert({ variant: 'danger', title: 'MGA Email Failed', message: error.message || 'Unable to send MGA package email.' }))
    } finally {
      setSendingEmail(false)
    }
  }

  async function setActivationStatus(nextStatus) {
    if (!agentId) return
    setUpdatingActivation(true)
    try {
      const response = await updateAccountActivationStatus(agentId, nextStatus)
      if (response?.agent) {
        setAgent(response.agent)
      }
      const activityData = await getAccountActivities('agent', agentId, { limit: 100 }).catch(() => ({ items: [] }))
      setActivities(Array.isArray(activityData?.items) ? activityData.items : [])
      if (nextStatus === 1) {
        dispatch(
          ShowRealtimeAlert({
            variant: 'success',
            title: 'Agent Activated',
            message: 'Agent activated successfully. Activation email sent to agent.',
          }),
        )
        navigate('/admin/agents')
      }
    } catch (error) {
      dispatch(ShowRealtimeAlert({ variant: 'danger', title: 'Activation Failed', message: error.message || 'Unable to update activation status.' }))
    } finally {
      setUpdatingActivation(false)
    }
  }

  async function markApexaTaskCompleted() {
    if (!latestApexaActivity?.id || completingApexa) return
    setCompletingApexa(true)
    try {
      const nextDetails = {
        ...(latestApexaActivity.details || {}),
        completed: true,
        completedAt: new Date().toISOString(),
      }
      await updateAccountActivity(latestApexaActivity.id, {
        details: nextDetails,
      })
      const activityData = await getAccountActivities('agent', agentId, { limit: 100 }).catch(() => ({ items: [] }))
      setActivities(Array.isArray(activityData?.items) ? activityData.items : [])
      dispatch(
        ShowRealtimeAlert({
          variant: 'success',
          title: 'APEXA Task Updated',
          message: 'APEXA contract task marked as completed.',
        }),
      )
    } catch (error) {
      dispatch(ShowRealtimeAlert({ variant: 'danger', title: 'Update Failed', message: error.message || 'Unable to update APEXA task.' }))
    } finally {
      setCompletingApexa(false)
    }
  }

  if (loading) {
    return <div className="py-16 text-center text-sm text-slate-500">Loading MGA package...</div>
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">MGA Package</p>
            <h1 className="mt-1 text-3xl font-semibold text-slate-900">Send Onboarding Package to MGA - {agent?.name}</h1>
          </div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Back to Review
          </button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">Package Contents</h2>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{readyAttachmentCount} Attachments Ready</span>
              </div>
              {missingRequiredAttachments.length > 0 ? (
                <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  Missing required items: {missingRequiredAttachments.map((item) => item.name).join(', ')}
                </div>
              ) : (
                <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                  All required MGA email attachments are available.
                </div>
              )}
              <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
                Required MGA package:
                {' '}3 signed agreement PDFs
                {agent?.licenceWorkflow === 'transfer'
                  ? ' + Agent Insurance Licence Copy + Agent E&O Copy'
                  : ''}
                {' '}+ Agent ID (Driving Licence) + Agent SIN Number
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {attachments.map((file) => (
                  <label key={file.id} className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${file.missing ? 'border-amber-200 bg-amber-50' : 'border-slate-200'}`}>
                    <div className="inline-flex items-center gap-2 text-slate-700">
                      <input type="checkbox" checked={file.selected} onChange={() => toggleAttachment(file.id)} disabled={file.required} className="h-3.5 w-3.5" />
                      <CheckCircle2 size={14} className={file.available ? 'text-emerald-600' : 'text-amber-500'} />
                      {file.name}
                    </div>
                    <span className={`text-xs ${file.missing ? 'text-amber-800' : 'text-slate-500'}`}>
                      {file.missing ? 'Missing' : file.size || '-'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Mail size={15} /> Email Preview
              </div>
              {hasSentPackage ? (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                  Last sent on {new Date(mgaSubmission.sentAt).toLocaleString()}
                  {mgaSubmission.sentBy ? ` by ${mgaSubmission.sentBy}` : ''}
                  {Array.isArray(mgaSubmission.recipients) && mgaSubmission.recipients.length > 0
                    ? ` to ${mgaSubmission.recipients.join(', ')}`
                    : ''}
                  .
                </div>
              ) : null}
              <div className="space-y-3 text-sm text-slate-700">
                <div>
                  <div className="mb-1 text-xs font-semibold text-slate-500">To:</div>
                  <div className="mb-2 flex flex-wrap gap-2">
                    {toList.map((value) => (
                      <span key={value} className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-1 text-xs text-indigo-700">
                        {value}
                        {editingEmail && (
                          <button type="button" onClick={() => removeRecipient(value)} className="text-indigo-500 hover:text-indigo-700">
                            <X size={12} />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                  {editingEmail && (
                    <div className="flex gap-2">
                      <input value={toInput} onChange={(e) => setToInput(e.target.value)} placeholder="Add recipient email" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                      <button type="button" onClick={addRecipient} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50">Add</button>
                    </div>
                  )}
                </div>
                <div>
                  <div className="mb-1 text-xs font-semibold text-slate-500">Subject:</div>
                  {editingEmail ? (
                    <input value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  ) : (
                    <div>{subject}</div>
                  )}
                </div>
                <div>
                  <div className="mb-1 text-xs font-semibold text-slate-500">Body:</div>
                  {editingEmail ? (
                    <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={7} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  ) : (
                    <p className="whitespace-pre-line">{body}</p>
                  )}
                </div>
                <div>
                  <div className="mb-1 text-xs font-semibold text-slate-500">Attachments ({selectedAttachments.length}):</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedAttachments.map((item) => (
                      <span key={item.id} className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs">{item.name}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditingEmail((prev) => !prev)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {editingEmail ? 'Done Editing' : 'Edit Email'}
                </button>
                <button
                  type="button"
                  disabled={sendingEmail}
                  onClick={sendToMGA}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
                >
                  {sendingEmail ? 'Sending...' : hasSentPackage ? 'Re-send to MGA' : 'Send to MGA Now'}
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
              <h3 className="text-sm font-semibold text-indigo-900">Next Steps Notice</h3>
              <p className="mt-2 text-xs text-indigo-700">
                Agent is under MGA review. Once MGA confirms everything, click the activation button to make this agent active.
              </p>
              <button
                type="button"
                disabled={updatingActivation || Number(agent?.accountActivationStatus) === 1}
                onClick={() => setActivationStatus(1)}
                className="mt-3 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {Number(agent?.accountActivationStatus) === 1 ? 'Agent Active' : 'All OK? Activate Agent'}
              </button>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-900">Admin Workflow Tasks</h3>
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">APEXA contract creation and approval</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {latestApexaActivity
                        ? apexaTaskCompleted
                          ? `Completed on ${new Date(latestApexaActivity.details?.completedAt || latestApexaActivity.performedAt).toLocaleString()}`
                          : 'Auto-created after agent activation for admin workflow tracking.'
                        : Number(agent?.accountActivationStatus) === 1
                          ? 'Pending activity refresh.'
                          : 'This workflow task will be created automatically when the agent is activated.'}
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    apexaTaskCompleted
                      ? 'bg-emerald-100 text-emerald-700'
                      : latestApexaActivity
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-600'
                  }`}>
                    {apexaTaskCompleted ? 'Completed' : latestApexaActivity ? 'Pending' : 'Not Created'}
                  </span>
                </div>
                {latestApexaActivity && !apexaTaskCompleted ? (
                  <button
                    type="button"
                    onClick={markApexaTaskCompleted}
                    disabled={completingApexa}
                    className="mt-3 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {completingApexa ? 'Updating...' : 'Mark APEXA Task Completed'}
                  </button>
                ) : null}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-900">Approval Workflow</h3>
              <ol className="mt-3 space-y-3 text-sm text-slate-600">
                <li>1. MGA reviews submitted package and validates compliance documents.</li>
                <li>2. Admin receives confirmation and final onboarding approval.</li>
                <li>3. Agent activation and credential generation are completed.</li>
              </ol>
              <div className="mt-6 rounded-xl bg-slate-50 p-3">
                <div className="text-xs uppercase tracking-wide text-slate-500">Onboarding</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {hasSentPackage ? 'MGA Package Sent' : 'Step 6 Ready'}
                </div>
                <div className="mt-2 text-xs text-slate-500">Current status: {Number(agent?.accountActivationStatus) === 1 ? 'Active' : Number(agent?.accountActivationStatus) === 2 ? 'Expired' : 'Under Review'}</div>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="h-28 bg-gradient-to-r from-slate-200 to-slate-300" />
              <div className="p-4">
                <div className="text-xl font-semibold text-slate-900">{agent?.name}</div>
                <div className="text-sm text-slate-600">Senior Advisor | Licensing ID: {agent?.agentId || '-'}</div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="text-slate-500">REGION</div>
                    <div className="font-semibold text-slate-800">{agent?.mga || '-'}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">ONBOARDING</div>
                    <div className="font-semibold text-slate-800">
                      {Number(agent?.accountActivationStatus) === 1
                        ? 'Active'
                        : Number(agent?.accountActivationStatus) === 2
                          ? 'Expired'
                          : 'Under Review'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function formatSize(bytes) {
  const size = Number(bytes || 0)
  if (!size) return '-'
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.round(size / 1024)} KB`
}
