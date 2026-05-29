import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CloudUpload,
  Eye,
  EyeOff,
  FileText,
  IdCard,
  LockKeyhole,
  Mail,
  Save,
  Send,
  ShieldCheck,
  User,
  X,
} from 'lucide-react'
import { createAgent } from '../../utils/agents.js'

const INSURANCE_COMPANIES = {
  Level1: ['Apex Financial Group'],
  Level2: ['HUB Financial', 'Apex Financial Group'],
  Level3: ['HUB Financial', 'NorthStar Mutual'],
  Level4: ['NorthStar Mutual']
}

const AGENT_CODES = {
  Level1: ['L1-A01', 'L1-A02'],
  Level2: ['L2-B10', 'L2-B11'],
  Level3: ['L3-C20', 'L3-C21'],
  Level4: ['L4-D30', 'L4-D31']
}

const INITIAL_FORM = {
  name: '',
  email: '',
  phone: '',
  agentId: '',
  licenceType: 'Existing licence transfer',
  eo: '',
  apex: '',
  creditReport: '750',
  sin: '',
  mga: 'HUB Financial',
  commissionOverride: '',
  insuranceCompany: 'Apex Financial Group',
  agentCode: 'L2-B10'
}

const INITIAL_DOCS = {
  licenceDocument: null,
  transferDocument: null,
  eandODocument: null,
  apexDocument: null,
  creditReportDocument: null,
  otherSupporting: null
}

const DRAFT_KEY = 'agentflow-agent-record-draft'
const MAX_FILE_SIZE_MB = 10
const ALLOWED_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx']

function getFileError(file) {
  if (!file) return null

  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return 'Upload PDF, PNG, JPG, or Word documents only.'
  }

  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return `File must be ${MAX_FILE_SIZE_MB} MB or smaller.`
  }

  return null
}

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function validateForm(form, docs, mode) {
  const errors = {}
  const requiredFields = [
    ['name', 'Full name is required.'],
    ['email', 'Email address is required.'],
    ['phone', 'Phone number is required.'],
    ['agentId', 'Licence number is required.'],
    ['creditReport', 'Credit score is required.'],
    ['sin', 'SIN is required.'],
    ['mga', 'MGA name is required.'],
    ['insuranceCompany', 'Contract company is required.']
  ]

  requiredFields.forEach(([key, message]) => {
    if (!String(form[key] || '').trim()) errors[key] = message
  })

  if (form.email && !validateEmail(form.email)) {
    errors.email = 'Enter a valid email address.'
  }

  if (form.sin && !/^\d{9}$/.test(form.sin.replace(/\D/g, ''))) {
    errors.sin = 'SIN must contain 9 digits.'
  }

  const score = Number(form.creditReport)
  if (form.creditReport && (Number.isNaN(score) || score < 300 || score > 900)) {
    errors.creditReport = 'Enter a score from 300 to 900.'
  }

  const licenceDocKey = mode === 'new' ? 'licenceDocument' : 'transferDocument'
  const licenceLabel = mode === 'new' ? 'Licence application' : 'Licence copy'
  const requiredDocs = [
    [licenceDocKey, `${licenceLabel} is required.`],
    ['eandODocument', 'E&O policy is required.'],
    ['apexDocument', 'APEXA document is required.'],
    ['creditReportDocument', 'Credit report is required.']
  ]

  requiredDocs.forEach(([key, message]) => {
    if (!docs[key]) errors[key] = message
  })

  return errors
}

function inputClass(error) {
  return `h-10 w-full rounded-md border bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2 ${
    error
      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
      : 'border-slate-300 focus:border-brand-500 focus:ring-brand-100'
  }`
}

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-700">{label}</span>
      {children}
      {error && (
        <span className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
          <AlertCircle size={12} />
          {error}
        </span>
      )}
    </label>
  )
}

function Section({ icon: Icon, title, children }) {
  return (
    <section className="rounded-lg border border-slate-300 bg-white">
      <div className="flex h-12 items-center gap-2 border-b border-slate-200 px-4">
        <Icon size={15} className="text-brand-700" />
        <h2 className="text-sm font-bold text-slate-900">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}

function Toggle({ checked, onChange, label, helper }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex h-[54px] w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 text-left transition hover:bg-slate-50"
    >
      <span>
        <span className="block text-xs font-semibold text-slate-800">{label}</span>
        <span className="block text-[11px] text-slate-500">{helper}</span>
      </span>
      <span
        className={`relative h-5 w-9 rounded-full transition ${
          checked ? 'bg-brand-600' : 'bg-slate-300'
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition ${
            checked ? 'left-[18px]' : 'left-0.5'
          }`}
        />
      </span>
    </button>
  )
}

function UploadTile({ id, label, file, error, onChange, onRemove }) {
  return (
    <div>
      <div
        className={`flex h-[46px] items-center gap-3 rounded-md border px-3 transition ${
          error
            ? 'border-red-300 bg-red-50'
            : file
              ? 'border-brand-300 bg-brand-50'
              : 'border-slate-300 bg-slate-50'
        }`}
      >
        <FileText size={16} className={file ? 'text-brand-700' : 'text-slate-500'} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-semibold text-slate-800">
            {file ? file.name : label}
          </div>
        </div>
        {file ? (
          <button
            type="button"
            onClick={onRemove}
            className="grid h-7 w-7 place-items-center rounded-md text-slate-500 hover:bg-white hover:text-slate-700"
            title="Remove file"
          >
            <X size={14} />
          </button>
        ) : (
          <label
            htmlFor={id}
            className="cursor-pointer text-xs font-bold text-brand-700 hover:text-brand-800"
          >
            Upload
          </label>
        )}
        <input
          id={id}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
          onChange={onChange}
          tabIndex={-1}
          className="hidden"
        />
      </div>
      {error && (
        <div className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
          <AlertCircle size={12} />
          {error}
        </div>
      )}
    </div>
  )
}

export default function AgentRecordCreation() {
  const [mode, setMode] = useState('transfer')
  const [level, setLevel] = useState('Level2')
  const [form, setForm] = useState(INITIAL_FORM)
  const [docs, setDocs] = useState(INITIAL_DOCS)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState(null)
  const [toast, setToast] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [requiresSponsorship, setRequiresSponsorship] = useState(false)
  const [hireApexa, setHireApexa] = useState(false)
  const [showSin, setShowSin] = useState(false)
  const navigate = useNavigate()
  const toastTimerRef = useRef(null)


  const insuranceCompanies = useMemo(() => INSURANCE_COMPANIES[level] || [], [level])

  useEffect(() => {
    const savedDraft = window.localStorage.getItem(DRAFT_KEY)
    if (!savedDraft) return

    try {
      const parsedDraft = JSON.parse(savedDraft)
      if (parsedDraft.form) setForm({ ...INITIAL_FORM, ...parsedDraft.form })
      if (parsedDraft.level) setLevel(parsedDraft.level)
      if (parsedDraft.mode) setMode(parsedDraft.mode)
      if (typeof parsedDraft.requiresSponsorship === 'boolean') {
        setRequiresSponsorship(parsedDraft.requiresSponsorship)
      }
      if (typeof parsedDraft.hireApexa === 'boolean') setHireApexa(parsedDraft.hireApexa)
    } catch {
      window.localStorage.removeItem(DRAFT_KEY)
    }
  }, [])

  useEffect(() => {
    setForm((previous) => ({
      ...previous,
      licenceType: mode === 'new' ? 'New licence application' : 'Existing licence transfer',
      eo: docs.eandODocument ? 'Uploaded' : '',
      apex: hireApexa ? 'Hire APEXA requested' : 'Not requested'
    }))
  }, [docs.eandODocument, hireApexa, mode])

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current)
      }
    }
  }, [])

  const handleChange = (key) => (e) => {
    const value = e.target.value
    setForm((previous) => ({ ...previous, [key]: value }))
    setErrors((previous) => ({ ...previous, [key]: undefined }))
    setStatus(null)
  }

  const handleLevelChange = (e) => {
    const nextLevel = e.target.value
    const nextCompanies = INSURANCE_COMPANIES[nextLevel] || []
    const nextCodes = AGENT_CODES[nextLevel] || []

    setLevel(nextLevel)
    setForm((previous) => ({
      ...previous,
      insuranceCompany: nextCompanies[0] || '',
      agentCode: nextCodes[0] || ''
    }))
    setErrors((previous) => ({ ...previous, insuranceCompany: undefined }))
  }

  const handleModeChange = (nextMode) => {
    setMode(nextMode)
    setErrors((previous) => ({
      ...previous,
      licenceDocument: undefined,
      transferDocument: undefined
    }))
    setStatus(null)
  }

  const handleFile = (key) => (e) => {
    const file = e.target.files?.[0] || null
    const fileError = getFileError(file)

    if (fileError) {
      setDocs((previous) => ({ ...previous, [key]: null }))
      setErrors((previous) => ({ ...previous, [key]: fileError }))
      setStatus({ type: 'error', message: fileError })
      e.target.value = ''
      e.target.blur()
      return
    }

    setDocs((previous) => ({ ...previous, [key]: file }))
    setErrors((previous) => ({ ...previous, [key]: undefined }))
    setStatus(null)
    e.target.value = ''
    e.target.blur()
  }

  const removeFile = (key) => {
    setDocs((previous) => ({ ...previous, [key]: null }))
    setErrors((previous) => ({ ...previous, [key]: undefined }))
    setStatus(null)
  }

  const handleCanceled = () => {
    // window.localStorage.setItem(
    //   DRAFT_KEY,
    //   JSON.stringify({
    //     form,
    //     level,
    //     mode,
    //     requiresSponsorship,
    //     hireApexa,
    //     savedAt: new Date().toISOString()
    //   })
    // )
    navigate(-1)
    setStatus({
      type: 'error',
      message: 'Cration cancelled.'
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const nextErrors = validateForm(form, docs, mode)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      setStatus({
        type: 'error',
        message: 'Please fix the highlighted fields before sending the onboarding link.'
      })
      return
    }

    setSubmitting(true)
    try {
      const result = await createAgent({ form, docs, level, mode })
      window.localStorage.removeItem(DRAFT_KEY)
      setStatus({
        type: 'success',
        message: result.message || 'Agent created and onboarding email sent.'
      })
      setToast({
        type: 'success',
        message: result.message || 'Onboarding email sent.'
      })

      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current)
      }
      toastTimerRef.current = window.setTimeout(() => {
        setToast(null)
        navigate('/admin/agents')
      }, 1500)
    } catch (err) {
      setStatus({
        type: 'error',
        message: err.message || 'Unable to send onboarding link.'
      })
      setToast({
        type: 'error',
        message: err.message || 'Unable to send onboarding link.'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const licenceDocKey = mode === 'new' ? 'licenceDocument' : 'transferDocument'

  return (
    <>
      {toast && (
        <div
          className={`fixed right-5 top-20 z-50 w-[320px] rounded-lg border px-4 py-3 text-sm shadow-xl ${
            toast.type === 'success'
              ? 'border-emerald-700 bg-emerald-600 text-white'
              : 'border-red-700 bg-red-600 text-white'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            </div>
            <div className="min-w-0 font-semibold leading-snug">{toast.message}</div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mx-auto max-w-[1500px] pb-24">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800"
        >
          <ArrowLeft size={13} />
          Back to Agents List
        </button>

        <div className="mb-5">
          <div className="text-sm font-bold text-slate-900">Agent Management</div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-950">
            Create New Agent
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Onboard a new financial agent to the management portal.
          </p>
        </div>

        {status && (
          <div
            className={`mb-4 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold ${
              status.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {status.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {status.message}
          </div>
        )}

        <div className="space-y-4">
          <Section icon={User} title="Basic Information">
            <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
              <div className="space-y-3">
                <Field label="Full Name" error={errors.name}>
                  <input
                    value={form.name}
                    onChange={handleChange('name')}
                    className={inputClass(errors.name)}
                    placeholder="e.g. Jonathan Doe"
                  />
                </Field>

                <Field label="Email Address" error={errors.email}>
                  <div className="relative">
                    <Mail
                      size={15}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="email"
                      value={form.email}
                      onChange={handleChange('email')}
                      className={`${inputClass(errors.email)} pl-9`}
                      placeholder="jonathan@example.com"
                    />
                  </div>
                </Field>

                <Field label="Phone Number" error={errors.phone}>
                  <input
                    value={form.phone}
                    onChange={handleChange('phone')}
                    className={inputClass(errors.phone)}
                    placeholder="+1 (555) 000-0000"
                  />
                </Field>
              </div>

              <div>
                <div className="mb-1.5 text-xs font-semibold text-slate-700">
                  Government ID Upload
                </div>
                <label
                  htmlFor="government-id-upload"
                  className={`flex min-h-[174px] cursor-pointer flex-col items-center justify-center rounded-md border border-dashed px-4 text-center transition ${
                    docs.otherSupporting
                      ? 'border-brand-300 bg-brand-50'
                      : 'border-slate-300 bg-slate-50 hover:border-brand-300 hover:bg-brand-50'
                  }`}
                >
                  <CloudUpload size={33} className="mb-3 text-brand-700" />
                  <span className="text-sm font-bold text-slate-800">
                    {docs.otherSupporting ? docs.otherSupporting.name : 'Drag and drop file here'}
                  </span>
                  <span className="mt-1 text-[11px] text-slate-500">
                    Supports PDF, PNG, JPG. Max 10 MB.
                  </span>
                  <span className="mt-4 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
                    Browse Files
                  </span>
                </label>
                <input
                  id="government-id-upload"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  className="hidden"
                  onChange={handleFile('otherSupporting')}
                />
                {errors.otherSupporting && (
                  <div className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
                    <AlertCircle size={12} />
                    {errors.otherSupporting}
                  </div>
                )}
              </div>
            </div>
          </Section>

          <Section icon={ShieldCheck} title="Licence Details">
            <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
              <div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => handleModeChange('transfer')}
                    className={`flex h-[54px] items-center gap-3 rounded-md border px-3 text-left transition ${
                      mode === 'transfer'
                        ? 'border-brand-600 bg-brand-50 text-brand-800'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 size={15} />
                    <span>
                      <span className="block text-xs font-bold">Existing Licence Transfer</span>
                      <span className="block text-[11px]">Transferring from another MGA</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleModeChange('new')}
                    className={`flex h-[54px] items-center gap-3 rounded-md border px-3 text-left transition ${
                      mode === 'new'
                        ? 'border-brand-600 bg-brand-50 text-brand-800'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <FileText size={15} />
                    <span>
                      <span className="block text-xs font-bold">New Licence Application</span>
                      <span className="block text-[11px]">First-time registration</span>
                    </span>
                  </button>
                </div>

                <div className="mt-5 space-y-2">
                  <div className="text-xs font-semibold text-slate-700">Required Documents</div>
                  <UploadTile
                    id="licence-document"
                    label={mode === 'new' ? 'Licence Application' : 'Licence Copy'}
                    file={docs[licenceDocKey]}
                    error={errors[licenceDocKey]}
                    onChange={handleFile(licenceDocKey)}
                    onRemove={() => removeFile(licenceDocKey)}
                  />
                  <UploadTile
                    id="eando-document"
                    label="E&O Policy"
                    file={docs.eandODocument}
                    error={errors.eandODocument}
                    onChange={handleFile('eandODocument')}
                    onRemove={() => removeFile('eandODocument')}
                  />
                  <UploadTile
                    id="apexa-document"
                    label="APEXA Document"
                    file={docs.apexDocument}
                    error={errors.apexDocument}
                    onChange={handleFile('apexDocument')}
                    onRemove={() => removeFile('apexDocument')}
                  />
                  <UploadTile
                    id="credit-report-document"
                    label="Credit Report"
                    file={docs.creditReportDocument}
                    error={errors.creditReportDocument}
                    onChange={handleFile('creditReportDocument')}
                    onRemove={() => removeFile('creditReportDocument')}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Toggle
                  checked={requiresSponsorship}
                  onChange={setRequiresSponsorship}
                  label="Require Sponsorship?"
                  helper="Agent needs sponsor approval letter"
                />
                <Toggle
                  checked={hireApexa}
                  onChange={setHireApexa}
                  label="Hire APEXA?"
                  helper="Existing profile on APEXA platform"
                />
                <Field label="Credit Score" error={errors.creditReport}>
                  <input
                    value={form.creditReport}
                    onChange={handleChange('creditReport')}
                    className={inputClass(errors.creditReport)}
                    placeholder="750"
                  />
                </Field>
              </div>
            </div>
          </Section>

          <section className="relative overflow-hidden rounded-lg border border-slate-300 bg-white">
            <LockKeyhole
              size={110}
              className="pointer-events-none absolute right-6 top-8 text-slate-200"
              strokeWidth={1.4}
            />
            <div className="flex h-12 items-center gap-2 border-b border-slate-200 px-4">
              <LockKeyhole size={15} className="text-slate-700" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Admin Only Fields
              </h2>
            </div>
            <div className="relative grid gap-4 p-4 lg:grid-cols-2">
              <Field label="Contract Company" error={errors.insuranceCompany}>
                <select
                  value={form.insuranceCompany}
                  onChange={handleChange('insuranceCompany')}
                  className={inputClass(errors.insuranceCompany)}
                >
                  {insuranceCompanies.map((company) => (
                    <option key={company} value={company}>
                      {company}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="MGA Name" error={errors.mga}>
                <input
                  value={form.mga}
                  onChange={handleChange('mga')}
                  className={inputClass(errors.mga)}
                  placeholder="HUB Financial"
                />
              </Field>

              <Field label="Licence Number" error={errors.agentId}>
                <div className="relative">
                  <IdCard
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={form.agentId}
                    onChange={handleChange('agentId')}
                    className={`${inputClass(errors.agentId)} pl-9`}
                    placeholder="e.g. L-129384-00"
                  />
                </div>
              </Field>

              <Field label="SIN (Masked)" error={errors.sin}>
                <div className="relative">
                  <input
                    type={showSin ? 'text' : 'password'}
                    value={form.sin}
                    onChange={handleChange('sin')}
                    className={`${inputClass(errors.sin)} pr-10`}
                    placeholder="•••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSin((previous) => !previous)}
                    className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-slate-500 hover:bg-slate-100"
                    title={showSin ? 'Hide SIN' : 'Show SIN'}
                  >
                    {showSin ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </Field>

              <Field label="Agent Level">
                <select value={level} onChange={handleLevelChange} className={inputClass()}>
                  {Object.keys(INSURANCE_COMPANIES).map((key) => (
                    <option key={key} value={key}>
                      {key}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </section>
        </div>

        <div className="fixed bottom-0 left-64 right-0 z-30 border-t border-slate-200 bg-white/95 px-6 py-4 shadow-[0_-8px_20px_rgba(15,23,42,0.06)] backdrop-blur">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleCanceled}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <X size={15} />
             Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-brand-700 px-7 text-sm font-bold text-white shadow-sm shadow-brand-700/20 transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:bg-brand-300"
            >
              {submitting ? 'Sending...' : 'Save & Send Onboarding Link'}
              <Send size={16} />
            </button>
          </div>
        </div>
      </form>
    </>
  )
}
