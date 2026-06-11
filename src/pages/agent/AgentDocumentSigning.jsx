import React, { useEffect, useMemo, useState } from 'react'
import { Send, Trash2, FileText, ShieldCheck, Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { auth } from '../../utils/auth.js'
import { getAgent, getAgentAgreementPreview, saveAgentSignedDocument } from '../../utils/agents.js'
import CommonHeader from '../../components/CommonHeader.jsx'

const DOCUMENTS = [
  {
    id: 'advisor_contract',
    name: 'Advisor Contract',
    status: 'Pending',
    icon: FileText,
    title: 'Independent Advisor Agreement',
    requiresSignature: true,
    requiresAcceptance: false,
    acceptanceText:
      'I agree that this is a legally binding electronic signature and have read and understood all terms and conditions in this agreement.',
    roleLabel: 'Agent signature required',
  },
  {
    id: 'code_of_conduct',
    name: 'Code of Conduct',
    status: 'Pending',
    icon: ShieldCheck,
    title: 'Professional Code of Conduct',
    requiresSignature: false,
    requiresAcceptance: true,
    acceptanceText: 'I have read and agree to follow the Code of Conduct.',
    roleLabel: 'Agent acknowledgement required',
  },
  {
    id: 'privacy_policy',
    name: 'Privacy Policy',
    status: 'Not started',
    icon: Lock,
    title: 'Privacy & Data Protection Policy',
    requiresSignature: false,
    requiresAcceptance: true,
    acceptanceText: 'I have read and agree to follow the Privacy & Confidentiality agreement terms.',
    roleLabel: 'Agent acknowledgement required',
  },
]

function normalizeSavedDocuments(savedDocuments = {}) {
  return Object.entries(savedDocuments).reduce((documents, [documentId, document]) => {
    documents[documentId] = {
      accepted: Boolean(document.accepted),
      acceptanceText: document.acceptanceText,
      signature: document.signature,
      timestamp: document.submittedAt || document.timestamp,
      type: document.signatureType || (document.signature ? 'type' : 'acceptance'),
    }
    return documents
  }, {})
}

function buildDraftsFromSavedDocuments(savedDocuments = {}) {
  return Object.entries(savedDocuments).reduce((drafts, [documentId, document]) => {
    drafts[documentId] = {
      signatureType: document.signatureType || 'type',
      typeSignature: document.signature || '',
      agree: Boolean(document.accepted),
    }
    return drafts
  }, {})
}

export default function DocumentSigningPage() {
  const navigate = useNavigate()
  const session = auth.get()
  const [activeDoc, setActiveDoc] = useState(0)
  const [loading, setLoading] = useState(false)
  const [signedDocuments, setSignedDocuments] = useState(() =>
    normalizeSavedDocuments(session?.signedDocuments),
  )
  const [documentDrafts, setDocumentDrafts] = useState(() =>
    buildDraftsFromSavedDocuments(session?.signedDocuments),
  )
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [agreementsReady, setAgreementsReady] = useState(false)
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [previewState, setPreviewState] = useState({
    loading: false,
    pdfUrl: '',
    error: '',
  })

  const currentDocument = DOCUMENTS[activeDoc]
  const currentDraft = documentDrafts[currentDocument.id] || {
    signatureType: 'type',
    typeSignature: '',
    agree: false,
  }
  const typeSignature = currentDraft.typeSignature
  const agree = currentDraft.agree
  const requiresSignature = currentDocument.requiresSignature
  const requiresAcceptance = currentDocument.requiresAcceptance
  const advisorDraft = documentDrafts.advisor_contract || {
    signatureType: 'type',
    typeSignature: '',
  }
  const advisorSignature = advisorDraft.typeSignature?.trim() || ''
  const bothAcceptanceChecked =
    Boolean(documentDrafts.code_of_conduct?.agree) &&
    Boolean(documentDrafts.privacy_policy?.agree)
  const canSubmitCurrentDocument = Boolean(advisorSignature && bothAcceptanceChecked)
  const liveSignaturePreview = typeSignature.trim() || ''

  useEffect(() => {
    let mounted = true
    if (!session?.id) {
      setCheckingAccess(false)
      return
    }

    getAgent(session.id)
      .then((agent) => {
        if (!mounted) return
        setAgreementsReady(
          Boolean(agent?.documents?.agreementPackage?.triggeredAt) ||
            Number(agent?.onboardingStatus || 0) >= 3,
        )
      })
      .finally(() => {
        if (mounted) setCheckingAccess(false)
      })

    return () => {
      mounted = false
    }
  }, [session?.id])

  useEffect(() => {
    let mounted = true
    let currentUrl = ''

    if (!session?.id) {
      setPreviewState({
        loading: false,
        pdfUrl: '',
        error: 'Agent session not found.',
      })
      return
    }

    setPreviewState({
      loading: true,
      pdfUrl: '',
      error: '',
    })

    getAgentAgreementPreview(session.id, currentDocument.id)
      .then((blob) => {
        if (!mounted) return
        currentUrl = URL.createObjectURL(blob)
        setPreviewState({
          loading: false,
          pdfUrl: currentUrl,
          error: '',
        })
      })
      .catch((error) => {
        if (!mounted) return
        setPreviewState({
          loading: false,
          pdfUrl: '',
          error: error.message || 'Unable to load the generated agreement PDF.',
        })
      })

    return () => {
      mounted = false
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl)
      }
    }
  }, [currentDocument.id, session?.id])

  const updateCurrentDraft = (patch) => {
    setDocumentDrafts((prev) => ({
      ...prev,
      [currentDocument.id]: {
        signatureType: 'type',
        typeSignature: '',
        agree: false,
        ...prev[currentDocument.id],
        ...patch,
      },
    }))
  }

  const clearSignature = () => {
    setDocumentDrafts((prev) => ({
      ...prev,
      [currentDocument.id]: {
        signatureType: 'type',
        typeSignature: '',
        agree: false,
      },
    }))
  }

  const handleSubmitSignature = async (event) => {
    event.preventDefault()

    if (!bothAcceptanceChecked) {
      alert('Please agree to the Code of Conduct and Privacy acknowledgements before submitting your signature.')
      return
    }

    if (!advisorSignature) {
      alert('Please type your signature.')
      return
    }

    setLoading(true)
    try {
      const submittedAt = new Date().toISOString()
      const documentPayloads = DOCUMENTS.map((doc) => {
        const isAdvisorContract = doc.id === 'advisor_contract'
        return {
          documentId: doc.id,
          documentName: doc.name,
          accepted: isAdvisorContract ? bothAcceptanceChecked : Boolean(documentDrafts[doc.id]?.agree),
          acceptanceText: doc.acceptanceText,
          signature: isAdvisorContract ? advisorSignature : null,
          signatureType: isAdvisorContract ? advisorDraft.signatureType || 'type' : null,
          metadata: {
            title: doc.title,
            roleAssignment: isAdvisorContract ? 'agent_signature' : 'agent_acknowledgement',
          },
        }
      })

      if (session?.id) {
        await Promise.all(
          documentPayloads.map((payload) => saveAgentSignedDocument(session.id, payload)),
        )
      }

      const nextSignedDocuments = documentPayloads.reduce((documents, payload) => {
        documents[payload.documentId] = {
          accepted: payload.accepted,
          acceptanceText: payload.acceptanceText,
          signature: payload.signature,
          timestamp: submittedAt,
          type: payload.signatureType || (payload.signature ? 'type' : 'acceptance'),
        }
        return documents
      }, {})
      const allDocumentsSigned = DOCUMENTS.every((doc) => nextSignedDocuments[doc.id])

      setSignedDocuments(nextSignedDocuments)
      auth.update({ signedDocuments: nextSignedDocuments })

      if (allDocumentsSigned && session?.id) {
        const refreshedAgent = await getAgent(session.id)
        auth.update({
          onboardingStatus: refreshedAgent?.onboardingStatus ?? session?.onboardingStatus,
        })
      }

      setShowSuccessModal(true)
      setTimeout(() => {
        setShowSuccessModal(false)
        clearSignature()

        if (allDocumentsSigned) {
          navigate('/agent/onboarding-progress')
          return
        }

        const nextUnsignedIndex = DOCUMENTS.findIndex(
          (doc, index) => index > activeDoc && !nextSignedDocuments[doc.id],
        )
        if (nextUnsignedIndex !== -1) {
          setActiveDoc(nextUnsignedIndex)
        }
      }, 2000)
    } finally {
      setLoading(false)
    }
  }

  const completedCount = useMemo(
    () => DOCUMENTS.filter((doc) => Boolean(signedDocuments[doc.id])).length,
    [signedDocuments],
  )

  if (checkingAccess) {
    return <div className="py-16 text-center text-sm text-slate-500">Loading agreements...</div>
  }

  if (!agreementsReady) {
    return (
      <div className="py-16 text-center">
        <div className="mx-auto max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h1 className="text-lg font-bold text-slate-900">Agreements Not Yet Triggered</h1>
          <p className="mt-2 text-sm text-slate-600">
            The admin team has not yet prepared your Step-2 agreement package. You will be notified when the documents are ready for signature.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-slate-50 text-slate-950">
      <CommonHeader title="Document Signing" compact />

      <main className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="flex w-72 shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-sm font-bold text-slate-900">Your Documents</h2>
            <p className="mt-1 text-[10px] text-slate-500">
              These are your Step-2 action items. The manager reviews the same generated package in a separate approval screen.
            </p>
          </div>

          <nav className="flex-1 space-y-2 overflow-y-auto p-3">
            {DOCUMENTS.map((doc, index) => {
              const isSigned = signedDocuments[doc.id]
              const isActive = activeDoc === index
              const IconComponent = doc.icon

              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => setActiveDoc(index)}
                  className={`w-full rounded-2xl border p-3 text-left transition ${
                    isActive
                      ? 'border-blue-300 bg-blue-50 text-blue-700 shadow-sm'
                      : isSigned
                        ? 'border-emerald-200 bg-emerald-50/60 text-emerald-700'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`grid h-10 w-10 place-items-center rounded-2xl ${isActive ? 'bg-white text-blue-700' : isSigned ? 'bg-white text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      <IconComponent size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[11px] font-bold">{doc.name}</div>
                      <div className="mt-1 text-[9px] text-slate-500">{doc.roleLabel}</div>
                      <div className="mt-2 text-[10px] font-semibold">
                        {isSigned ? 'Signed' : doc.status}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </nav>

          <div className="m-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-[10px] font-bold text-slate-700">Completion Progress</div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full bg-blue-700 transition-all duration-500"
                style={{ width: `${(completedCount / DOCUMENTS.length) * 100}%` }}
              />
            </div>
            <div className="mt-2 text-[9px] text-slate-500">
              {completedCount} of {DOCUMENTS.length} documents completed
            </div>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col bg-slate-100">
          <div className="flex-1 overflow-y-auto px-6 pb-3 pt-6">
            <div className="mx-auto flex max-w-6xl flex-col gap-4">
              <div className="rounded-3xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Step-2 Agreement Package</div>
                    <h1 className="mt-2 text-xl font-bold text-slate-900">{currentDocument.title}</h1>
                    <p className="mt-2 text-sm text-slate-500">
                      Review the generated PDF below. This is the same PDF package shared with the manager for package approval.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-semibold text-blue-700">
                    {currentDocument.roleLabel}
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-lg">
                {previewState.loading ? (
                  <div className="grid min-h-[720px] place-items-center text-sm text-slate-500">
                    Loading generated agreement PDF...
                  </div>
                ) : previewState.error ? (
                  <div className="grid min-h-[720px] place-items-center px-6 text-center text-sm text-rose-600">
                    {previewState.error}
                  </div>
                ) : (
                  <iframe
                    title={`${currentDocument.name} preview`}
                    src={previewState.pdfUrl}
                    className="min-h-[720px] w-full"
                  />
                )}
              </div>

              {requiresSignature ? (
                <div className="rounded-3xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Signature Preview</div>
                  <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Authorized Signatory</div>
                      <div className="mt-2 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                        Harvinder Singh
                      </div>
                    </div>
                    <div className="min-w-[240px]">
                      <div className="text-sm font-semibold text-slate-900">Advisor Signature</div>
                      <div className="mt-2 flex h-20 items-center justify-center rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50/40 px-4 text-center">
                        {signedDocuments[currentDocument.id] ? (
                          <div>
                            <div className={`text-2xl font-bold text-blue-700 ${signedDocuments[currentDocument.id].type === 'type' ? "font-['Dancing_Script']" : ''}`}>
                              {signedDocuments[currentDocument.id].signature}
                            </div>
                            <div className="mt-1 text-[10px] font-semibold text-emerald-600">Signed</div>
                          </div>
                        ) : liveSignaturePreview ? (
                          <div className="text-2xl font-['Dancing_Script'] font-bold italic text-blue-700">
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

          {!signedDocuments[currentDocument.id] ? (
            <form
              onSubmit={handleSubmitSignature}
              className="shrink-0 border-t border-slate-200 bg-white p-5 shadow-lg"
            >
              <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-[minmax(0,1fr)_260px] md:items-start">
                <div>
                  {requiresSignature ? (
                    <div className="mb-4">
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Typed Signature
                      </label>
                      <input
                        type="text"
                        value={typeSignature}
                        onChange={(event) => updateCurrentDraft({ typeSignature: event.target.value })}
                        placeholder="Type your full name..."
                        className="w-full max-w-lg border-b-2 border-slate-300 bg-transparent text-2xl text-blue-700 outline-none transition-colors focus:border-blue-700 focus:ring-0 font-['Dancing_Script']"
                      />
                    </div>
                  ) : null}

                  {requiresAcceptance ? (
                    <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <input
                        type="checkbox"
                        checked={agree}
                        onChange={(event) => updateCurrentDraft({ agree: event.target.checked })}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-blue-700"
                      />
                      <span className="text-xs leading-6 text-slate-600">{currentDocument.acceptanceText}</span>
                    </label>
                  ) : (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-amber-900">
                      Before submitting the advisor signature, you must also acknowledge the Code of Conduct and Privacy & Confidentiality agreements in this package.
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    type="submit"
                    disabled={loading || !canSubmitCurrentDocument}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-400"
                  >
                    <Send size={14} />
                    {loading ? 'Submitting...' : 'Submit Package Signature'}
                  </button>
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
                  >
                    <Trash2 size={14} />
                    Clear
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="shrink-0 border-t border-slate-200 bg-green-50 p-5 shadow-lg">
              <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-green-600 text-sm font-bold text-white">
                      OK
                  </div>
                  <div>
                    <p className="text-sm font-bold text-green-900">Document completed successfully</p>
                    <p className="text-xs text-green-700">
                      Completed on {new Date(signedDocuments[currentDocument.id].timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextUnsignedIndex = DOCUMENTS.findIndex(
                      (doc, index) => index > activeDoc && !signedDocuments[doc.id],
                    )
                    if (nextUnsignedIndex !== -1) {
                      setActiveDoc(nextUnsignedIndex)
                    }
                  }}
                  className="rounded-2xl bg-green-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-green-800"
                >
                  Next Document
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      {showSuccessModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-green-100">
                <div className="text-3xl font-bold text-green-600">OK</div>
              </div>
              <h2 className="text-lg font-bold text-slate-900">Documents Submitted</h2>
              <p className="text-sm text-slate-600">
                Your Step-2 agreement package has been submitted successfully.
              </p>
              <div className="h-1 w-full overflow-hidden rounded-full bg-slate-200">
                <div className="h-full animate-pulse bg-green-600" />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
