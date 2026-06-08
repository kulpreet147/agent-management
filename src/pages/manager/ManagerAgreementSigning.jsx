import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle2, FileText } from 'lucide-react'
import {
  getManagerAgreementPackage,
  submitManagerAgreementPackage,
} from '../../utils/agents.js'

const API_ROOT = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000/api').replace(/\/api$/, '')

export default function ManagerAgreementSigning() {
  const { token } = useParams()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [payload, setPayload] = useState(null)
  const [fullName, setFullName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [signature, setSignature] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Manager agreement link is invalid.')
      setLoading(false)
      return
    }

    getManagerAgreementPackage(token)
      .then((data) => setPayload(data))
      .catch((err) => setError(err.message || 'Unable to load agreement package.'))
      .finally(() => setLoading(false))
  }, [token])

  const documents = payload?.documents || []
  const expiresLabel = useMemo(() => {
    if (!payload?.expiresAt) return null
    return new Date(payload.expiresAt).toLocaleString()
  }, [payload?.expiresAt])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!token) return

    if (!fullName.trim() || !signature.trim() || !accepted) {
      setError('Full name, typed signature, and agreement acceptance are required.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      await submitManagerAgreementPackage(token, {
        fullName: fullName.trim(),
        jobTitle: jobTitle.trim() || undefined,
        signature: signature.trim(),
        accepted: true,
      })
      setCompleted(true)
    } catch (err) {
      setError(err.message || 'Unable to complete the manager signature step.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="py-16 text-center text-sm text-slate-500">Loading manager agreement package...</div>
  }

  if (error && !payload) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-16">
        <div className="mx-auto max-w-2xl rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-card">
          <h1 className="text-2xl font-bold text-slate-900">Manager Agreement Access</h1>
          <p className="mt-4 text-sm text-rose-600">{error}</p>
        </div>
      </div>
    )
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-16">
        <div className="mx-auto max-w-2xl rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-card">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 size={28} />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Manager Signature Completed</h1>
          <p className="mt-3 text-sm text-slate-600">
            The agreement package for {payload?.agent?.name || 'this agent'} has been submitted successfully.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Manager Review</div>
              <h1 className="mt-1 text-3xl font-bold text-slate-900">
                Agreement package for {payload?.agent?.name || 'Agent'}
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Review the generated Step-2 agreements and complete the manager e-signature step.
              </p>
            </div>
            {expiresLabel ? (
              <div className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600">
                Link expires {expiresLabel}
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-card">
          <h2 className="text-lg font-bold text-slate-900">Documents to Review</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {documents.map((document) => (
              <a
                key={document.key}
                href={`${API_ROOT}${document.downloadUrl}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-300 hover:bg-blue-50"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-white text-blue-700 shadow-sm">
                    <FileText size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{document.title}</div>
                    <div className="text-xs text-slate-500">{document.originalName}</div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-8 shadow-card">
          <h2 className="text-lg font-bold text-slate-900">Manager E-signature</h2>
          <p className="mt-2 text-sm text-slate-600">
            Completing this step records manager approval for the full Step-2 agreement package.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Full Name</span>
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Manager full name"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Job Title</span>
              <input
                value={jobTitle}
                onChange={(event) => setJobTitle(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Optional title"
              />
            </label>
          </div>

          <label className="mt-4 block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Typed Signature</span>
            <input
              value={signature}
              onChange={(event) => setSignature(event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Type your full name as signature"
            />
          </label>

          <label className="mt-5 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(event) => setAccepted(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-700">
              I confirm that I reviewed the agreement package for {payload?.agent?.name || 'the agent'} and approve it for the onboarding process.
            </span>
          </label>

          {error ? <div className="mt-4 text-sm text-rose-600">{error}</div> : null}

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-6 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {submitting ? 'Submitting...' : 'Complete Manager Signature'}
          </button>
        </form>
      </div>
    </div>
  )
}
