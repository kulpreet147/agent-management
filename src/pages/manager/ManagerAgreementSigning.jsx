import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  CheckCircle2,
  Clock,
  FileText,
  Info,
  Lock,
  Send,
  ShieldCheck,
  Trash2,
  Type,
} from 'lucide-react'
import {
  getManagerAgreementPackage,
  submitManagerAgreementPackage,
} from '../../utils/agents.js'

const API_ROOT = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000/api').replace(/\/api$/, '')
const ADVISOR_CONTRACT_KEY = 'advisor_contract'

function isAdvisorContractDocument(doc) {
  return (
    doc?.key === ADVISOR_CONTRACT_KEY ||
    doc?.title?.toLowerCase().includes('advisor contract')
  )
}

function isCodeOfConductDocument(doc) {
  const value = `${doc?.key || ''} ${doc?.title || ''}`.toLowerCase()
  return value.includes('code_of_conduct') || value.includes('code of conduct')
}

function isPrivacyDocument(doc) {
  const value = `${doc?.key || ''} ${doc?.title || ''}`.toLowerCase()
  return (
    value.includes('privacy_policy') ||
    value.includes('privacy') ||
    value.includes('confidentiality')
  )
}

function getDocumentMeta(doc) {
  if (isAdvisorContractDocument(doc)) {
    return {
      icon: FileText,
      roleLabel: 'Manager signature required',
      acceptanceText: 'I agree that this is a legally binding electronic signature.',
    }
  }

  if (isCodeOfConductDocument(doc)) {
    return {
      icon: ShieldCheck,
      roleLabel: 'Manager acknowledgement required',
      acceptanceText: 'I confirm that I agree to the Code of Conduct / Compliance Agreement.',
    }
  }

  return {
    icon: Lock,
    roleLabel: 'Manager acknowledgement required',
    acceptanceText: 'I confirm that I agree to the Privacy & Confidentiality Agreement.',
  }
}

function PendingIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 text-amber-500" fill="none">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 5v3.5l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function NotStartedIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 text-slate-400" fill="none">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function SignedIcon() {
  return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
}

export default function ManagerAgreementSigning() {
  const { token } = useParams()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [payload, setPayload] = useState(null)
  const [activeDoc, setActiveDoc] = useState(0)
  const [fullName, setFullName] = useState('')
  const [signature, setSignature] = useState('')
  const [contractAccepted, setContractAccepted] = useState(false)
  const [documentAgreements, setDocumentAgreements] = useState({})
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Manager agreement link is invalid.')
      setLoading(false)
      return
    }

    getManagerAgreementPackage(token)
      .then((data) => {
        setPayload(data)
        const initialAgreements = (data?.documents || []).reduce((accumulator, doc) => {
          if (!isAdvisorContractDocument(doc)) {
            accumulator[doc.key] = false
          }
          return accumulator
        }, {})
        setDocumentAgreements(initialAgreements)
      })
      .catch((err) => setError(err.message || 'Unable to load agreement package.'))
      .finally(() => setLoading(false))
  }, [token])

  const documents = payload?.documents || []
  const activeDocument = documents[activeDoc] || null
  const activeDocumentUrl = activeDocument ? `${API_ROOT}${activeDocument.downloadUrl}` : ''
  const isAdvisorContract = isAdvisorContractDocument(activeDocument)
  const activeMeta = getDocumentMeta(activeDocument)

  const completedKeys = useMemo(() => {
    const keys = new Set()

    documents.forEach((doc) => {
      if (isAdvisorContractDocument(doc)) {
        if (signature.trim() && contractAccepted) {
          keys.add(doc.key)
        }
        return
      }

      if (documentAgreements[doc.key]) {
        keys.add(doc.key)
      }
    })

    return keys
  }, [contractAccepted, documentAgreements, documents, signature])

  const allCompleted = documents.length > 0 && completedKeys.size === documents.length

  const expiresLabel = useMemo(() => {
    if (!payload?.expiresAt) return null
    return new Date(payload.expiresAt).toLocaleString()
  }, [payload?.expiresAt])

  const signedCount = completedKeys.size
  const liveSignaturePreview = signature.trim()

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!token) return

    if (!signature.trim() || !contractAccepted) {
      setError('Manager signature and contract acceptance are required.')
      return
    }

    const allAcknowledged = documents
      .filter((doc) => !isAdvisorContractDocument(doc))
      .every((doc) => Boolean(documentAgreements[doc.key]))

    if (!allAcknowledged) {
      setError('Please agree to the Code of Conduct and Privacy & Confidentiality documents before submitting.')
      return
    }

    const normalizedFullName = fullName.trim() || signature.trim()
    const documentActions = documents.map((doc) => ({
      documentKey: doc.key,
      accepted: isAdvisorContractDocument(doc)
        ? Boolean(signature.trim() && contractAccepted)
        : Boolean(documentAgreements[doc.key]),
      acceptanceText: getDocumentMeta(doc).acceptanceText,
      signature: isAdvisorContractDocument(doc) ? signature.trim() : null,
    }))

    setSubmitting(true)
    setError('')
    try {
      await submitManagerAgreementPackage(token, {
        fullName: normalizedFullName,
        signature: signature.trim(),
        accepted: true,
        documentActions,
      })
      setFullName(normalizedFullName)
      setSubmitted(true)
    } catch (err) {
      setError(err.message || 'Unable to complete the manager signature step.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClear = () => {
    if (isAdvisorContract) {
      setSignature('')
      setFullName('')
      setContractAccepted(false)
    } else if (activeDocument?.key) {
      setDocumentAgreements((prev) => ({
        ...prev,
        [activeDocument.key]: false,
      }))
    }
    setError('')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500" />
          Loading agreement package...
        </div>
      </div>
    )
  }

  if (error && !payload) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
        <div className="w-full max-w-md rounded-2xl border border-rose-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-500">
            <ShieldCheck size={22} />
          </div>
          <h1 className="text-base font-semibold text-slate-900">Manager Agreement Access</h1>
          <p className="mt-3 text-sm text-rose-500">{error}</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
        <div className="w-full max-w-md rounded-2xl border border-emerald-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={22} />
          </div>
          <h1 className="text-base font-semibold text-slate-900">Package Approved Successfully</h1>
          <p className="mt-3 text-sm text-slate-500">
            The manager approval for{' '}
            <span className="font-semibold text-slate-700">{payload?.agent?.name || 'this agent'}</span>{' '}
            has been recorded.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f0f2f5]">
      <aside className="flex w-[240px] flex-shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white">
        <div className="px-5 pb-3 pt-5">
          <h2 className="text-[15px] font-bold text-slate-900">Manager Documents</h2>
          <p className="mt-0.5 text-[12px] text-slate-400">Review, agree, and submit this package</p>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-3">
          {documents.map((doc, index) => {
            const isActive = index === activeDoc
            const isComplete = completedKeys.has(doc.key)
            const StatusIcon = isComplete
              ? SignedIcon
              : isAdvisorContractDocument(doc)
                ? PendingIcon
                : NotStartedIcon
            const Icon = getDocumentMeta(doc).icon

            return (
              <button
                key={doc.key}
                type="button"
                onClick={() => setActiveDoc(index)}
                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all ${
                  isActive
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-transparent hover:bg-slate-50'
                }`}
              >
                <div className={`grid h-10 w-10 place-items-center rounded-2xl ${isActive ? 'bg-white text-blue-700' : isComplete ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  <Icon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-[13px] font-semibold ${isActive ? 'text-blue-700' : 'text-slate-800'}`}>
                    {doc.title}
                  </p>
                  <p className={`mt-0.5 text-[11px] font-medium ${isComplete ? 'text-emerald-600' : isAdvisorContractDocument(doc) ? 'text-amber-600' : 'text-slate-400'}`}>
                    {isComplete ? 'Completed' : isAdvisorContractDocument(doc) ? 'Pending signature' : 'Pending acknowledgement'}
                  </p>
                </div>
                <div className="ml-2 flex-shrink-0">
                  <StatusIcon />
                </div>
              </button>
            )
          })}
        </nav>

        <div className="border-t border-slate-100 px-4 py-4">
          <div className="flex items-center gap-1.5 text-[12px] text-slate-600">
            <Info size={12} className="text-blue-500" />
            <span className="font-semibold">Completion Progress</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-500"
              style={{ width: `${documents.length ? (signedCount / documents.length) * 100 : 0}%` }}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-slate-400">
            {signedCount} of {documents.length} documents completed
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Manager Review</p>
            <h1 className="mt-0.5 text-[15px] font-bold text-slate-900">
              Agreement package for {payload?.agent?.name || 'Agent'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {expiresLabel && (
              <span className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-[12px] text-slate-500">
                <Clock size={11} className="text-slate-400" />
                Link expires {expiresLabel}
              </span>
            )}
            <span className="rounded-md bg-slate-900 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white">
              Package Approval
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="mx-auto max-w-4xl space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    Step-2 Agreement Package
                  </div>
                  <h1 className="mt-2 text-xl font-bold text-slate-900">{activeDocument?.title}</h1>
                  <p className="mt-2 text-sm text-slate-500">
                    Review the generated PDF below and complete the manager action required for this document.
                  </p>
                </div>
                <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-semibold text-blue-700">
                  {activeMeta.roleLabel}
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              {activeDocumentUrl ? (
                <iframe
                  key={activeDocumentUrl}
                  title={activeDocument?.title || 'Agreement preview'}
                  src={`${activeDocumentUrl}#toolbar=1&view=FitH&navpanes=0&scrollbar=1`}
                  className="w-full border-0"
                  style={{ height: 'calc(100vh - 360px)', minHeight: '440px' }}
                />
              ) : (
                <div className="flex items-center justify-center text-sm text-slate-400" style={{ height: '440px' }}>
                  No document selected.
                </div>
              )}
            </div>

            {isAdvisorContract ? (
              <div className="rounded-3xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Signature Preview</div>
                <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Manager Name</div>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      placeholder="Enter manager full name"
                      className="mt-2 w-full min-w-[260px] rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div className="min-w-[240px]">
                    <div className="text-sm font-semibold text-slate-900">Manager Signature</div>
                    <div className="mt-2 flex h-20 items-center justify-center rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50/40 px-4 text-center">
                      {liveSignaturePreview ? (
                        <div className="text-2xl font-bold italic text-blue-700" style={{ fontFamily: "'Dancing Script', 'Brush Script MT', cursive" }}>
                          {liveSignaturePreview}
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">
                          Sign Below
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="shrink-0 border-t border-slate-200 bg-white p-5 shadow-lg">
          <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-[minmax(0,1fr)_280px] md:items-start">
            <div>
              {isAdvisorContract ? (
                <>
                  <div className="mb-4">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <Type size={13} />
                      Typed Signature
                    </div>
                    <input
                      type="text"
                      value={signature}
                      onChange={(event) => setSignature(event.target.value)}
                      placeholder="Type your full name..."
                      className="w-full max-w-lg border-b-2 border-slate-300 bg-transparent pb-2 text-2xl text-blue-700 outline-none transition-colors placeholder:text-slate-300 focus:border-blue-700 focus:ring-0"
                      style={{ fontFamily: "'Dancing Script', 'Brush Script MT', cursive", fontStyle: 'italic' }}
                    />
                  </div>

                  <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <input
                      type="checkbox"
                      checked={contractAccepted}
                      onChange={(event) => setContractAccepted(event.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-blue-700"
                    />
                    <span className="text-xs leading-6 text-slate-600">{activeMeta.acceptanceText}</span>
                  </label>
                </>
              ) : (
                <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <input
                    type="checkbox"
                    checked={Boolean(activeDocument?.key && documentAgreements[activeDocument.key])}
                    onChange={(event) => {
                      if (!activeDocument?.key) return
                      setDocumentAgreements((prev) => ({
                        ...prev,
                        [activeDocument.key]: event.target.checked,
                      }))
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-blue-700"
                  />
                  <span className="text-xs leading-6 text-slate-600">{activeMeta.acceptanceText}</span>
                </label>
              )}

              {!allCompleted ? (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-amber-900">
                  Complete all three manager actions before final submission.
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs leading-6 text-emerald-900">
                  All manager requirements are complete. You can now submit this agreement package.
                </div>
              )}

              {error ? (
                <p className="mt-3 text-xs text-rose-500">{error}</p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="submit"
                disabled={submitting || !allCompleted}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-400"
              >
                <Send size={14} />
                {submitting ? 'Submitting...' : 'Submit Manager Approval'}
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
              >
                <Trash2 size={14} />
                Clear Current Document
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
