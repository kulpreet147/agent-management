import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Mail, CheckCircle2, Send, X } from 'lucide-react'
import { auth } from '../../utils/auth.js'
import {
  getAgent,
  getAgentSignedDocuments,
  updateAccountActivationStatus,
  sendMgaPackageEmail,
} from '../../utils/agents.js'

const uploadedLabels = {
  checklistPdf: 'Checklist PDF',
  licenceDocument: 'Licence',
  eandODocument: 'E&O',
  idDocument: 'ID',
  sinDocument: 'SIN',
  transferDocument: 'Licence',
  apexDocument: 'Checklist PDF',
  creditReportDocument: 'ID',
}

export default function AgentMGAPackage() {
  const { agentId } = useParams()
  const navigate = useNavigate()
  const [agent, setAgent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editingEmail, setEditingEmail] = useState(false)
  const [toInput, setToInput] = useState('mga@elitefinancial.com')
  const [toList, setToList] = useState(['mga@elitefinancial.com'])
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [attachments, setAttachments] = useState([])
  const [updatingActivation, setUpdatingActivation] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)

  useEffect(() => {
    if (!agentId) return
    let mounted = true
    Promise.all([getAgent(agentId), getAgentSignedDocuments(agentId)])
      .then(([agentData]) => {
        if (!mounted) return
        setAgent(agentData)

        const uploadedRows = Object.entries(agentData?.documents || {})
          .filter(([key]) => uploadedLabels[key])
          .map(([key, doc]) => ({
            id: `uploaded:${key}`,
            name: uploadedLabels[key],
            size: formatSize(doc?.size),
            selected: true,
          }))

        setAttachments(uploadedRows)
        setSubject(`New Agent Onboarding Package - ${agentData?.name || ''}`)
        setBody(
          `Dear Elite Financial Team,\n\nPlease find attached the complete onboarding package for our new agent, ${agentData?.name || ''}. All required compliance documents have been reviewed by our internal team.\n\nWe look forward to your review and the subsequent activation of their portal access.\n\nBest regards,\nAgent Management Admin`,
        )
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [agentId])

  const selectedAttachments = attachments.filter((item) => item.selected)

  function addRecipient() {
    const value = toInput.trim()
    if (!value) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      window.alert('Please enter a valid email address.')
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
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item)),
    )
  }

  async function sendToMGA() {
    if (sendingEmail) return
    if (toList.length === 0) {
      window.alert('Please add at least one recipient in "To".')
      return
    }
    if (selectedAttachments.length === 0) {
      window.alert('Please select at least one attachment.')
      return
    }
    if (!toList.every((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))) {
      window.alert('One or more recipient emails are invalid.')
      return
    }
    try {
      setSendingEmail(true)
      const session = auth.get()
      await sendMgaPackageEmail(agentId, {
        to: toList,
        adminEmail: session?.email || undefined,
        subject,
        body,
        attachments: selectedAttachments.map((item) => item.name),
        attachmentDocumentKeys: selectedAttachments
          .map((item) => item.id.replace('uploaded:', ''))
          .filter(Boolean),
      })
      window.alert('MGA package email sent successfully.')
    } catch (error) {
      window.alert(error.message || 'Unable to send MGA package email.')
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
      if (nextStatus === 1) {
        window.alert('Agent activated successfully. Activation email sent to agent.')
        navigate('/admin/agents')
      }
    } catch (error) {
      window.alert(error.message || 'Unable to update activation status.')
    } finally {
      setUpdatingActivation(false)
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
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{selectedAttachments.length} Documents Ready</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {attachments.map((file) => (
                  <label key={file.id} className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
                    <div className="inline-flex items-center gap-2 text-slate-700">
                      <input type="checkbox" checked={file.selected} onChange={() => toggleAttachment(file.id)} className="h-3.5 w-3.5" />
                      <CheckCircle2 size={14} className={file.selected ? 'text-emerald-600' : 'text-slate-300'} />
                      {file.name}
                    </div>
                    <span className="text-xs text-slate-500">{file.size || '-'}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Mail size={15} /> Email Preview
              </div>
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
                  {sendingEmail ? 'Sending...' : 'Send to MGA Now'}
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
              <h3 className="text-sm font-semibold text-slate-900">Approval Workflow</h3>
              <ol className="mt-3 space-y-3 text-sm text-slate-600">
                <li>1. MGA reviews submitted package and validates compliance documents.</li>
                <li>2. Admin receives confirmation and final onboarding approval.</li>
                <li>3. Agent activation and credential generation are completed.</li>
              </ol>
              <div className="mt-6 rounded-xl bg-slate-50 p-3">
                <div className="text-xs uppercase tracking-wide text-slate-500">Onboarding</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">Step 6 Complete</div>
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
