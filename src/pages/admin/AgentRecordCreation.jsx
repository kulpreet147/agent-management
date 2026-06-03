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
  Send,
  ShieldCheck,
  User,
  X,
  Building2,
  CreditCard,
  ChevronDown,
} from 'lucide-react'
import { createAgent } from '../../utils/agents.js'

const INSURANCE_COMPANIES = {
  Level1: ['Apex Financial Group'],
  Level2: ['HUB Financial', 'Apex Financial Group'],
  Level3: ['HUB Financial', 'NorthStar Mutual'],
  Level4: ['NorthStar Mutual'],
}

const AGENT_CODES = {
  Level1: ['L1-A01', 'L1-A02'],
  Level2: ['L2-B10', 'L2-B11'],
  Level3: ['L3-C20', 'L3-C21'],
  Level4: ['L4-D30', 'L4-D31'],
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
  agentCode: 'L2-B10',
}

const INITIAL_DOCS = {
  licenceDocument: null,
  transferDocument: null,
  eandODocument: null,
  apexDocument: null,
  creditReportDocument: null,
  otherSupporting: null,
}

const DRAFT_KEY = 'agentflow-agent-record-draft'
const MAX_FILE_SIZE_MB = 10
const ALLOWED_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx']
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+$/

function getFileError(file) {
  if (!file) return null
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!ALLOWED_EXTENSIONS.includes(extension)) return 'Upload PDF, PNG, JPG, or Word documents only.'
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) return `File must be ${MAX_FILE_SIZE_MB} MB or smaller.`
  return null
}

function validateEmail(value) { return EMAIL_REGEX.test(value) }

function normalizePhoneDigits(value) { return String(value || '').replace(/\D/g, '').slice(0, 11) }

function formatUsCaPhone(value) {
  const raw = normalizePhoneDigits(value)
  const digits = raw.length === 11 && raw.startsWith('1') ? raw.slice(1) : raw
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
}

function validateUsCaPhone(value) {
  const raw = normalizePhoneDigits(value)
  const digits = raw.length === 11 && raw.startsWith('1') ? raw.slice(1) : raw
  if (digits.length !== 10) return false
  return /^[2-9]\d{2}[2-9]\d{6}$/.test(digits)
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
    ['insuranceCompany', 'Contract company is required.'],
    ['agentCode', 'Agent code is required.'],
    ['commissionOverride', 'Commission override is required.'],
    ['eo', 'E&O status is required.'],
    ['apex', 'APEXA status is required.'],
    ['licenceType', 'Licence type is required.'],
  ]
  requiredFields.forEach(([key, message]) => {
    if (!String(form[key] || '').trim()) errors[key] = message
  })
  if (form.email && !validateEmail(form.email)) errors.email = 'Enter a valid email address.'
  if (form.phone && !validateUsCaPhone(form.phone)) errors.phone = 'Enter a valid US/Canada phone number (10 digits).'
  if (form.sin && !/^\d{9}$/.test(form.sin.replace(/\D/g, ''))) errors.sin = 'SIN must contain 9 digits.'
  const commission = Number(form.commissionOverride)
  if (form.commissionOverride && (Number.isNaN(commission) || commission < 0 || commission > 100)) {
    errors.commissionOverride = 'Commission override must be between 0 and 100.'
  }
  const score = Number(form.creditReport)
  if (form.creditReport && (Number.isNaN(score) || score < 300 || score > 900)) errors.creditReport = 'Enter a score from 300 to 900.'
  const licenceDocKey = mode === 'new' ? 'licenceDocument' : 'transferDocument'
  const licenceLabel = mode === 'new' ? 'Licence application' : 'Licence copy'
  const requiredDocs = [
    [licenceDocKey, `${licenceLabel} is required.`],
    ['eandODocument', 'E&O policy is required.'],
    ['apexDocument', 'APEXA document is required.'],
    ['creditReportDocument', 'Credit report is required.'],
    ['otherSupporting', 'Government ID upload is required.'],
  ]
  requiredDocs.forEach(([key, message]) => {
    if (!docs[key]) errors[key] = message
  })
  return errors
}

// ─── Styled Primitives ────────────────────────────────────────────────────────

function inputClass(error) {
  return `h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:ring-2 ${
    error
      ? 'border-red-300 focus:border-red-400 focus:ring-red-100 bg-red-50/30'
      : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100 hover:border-slate-300'
  }`
}

function selectClass(error) {
  return `h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 outline-none transition-all appearance-none cursor-pointer focus:ring-2 ${
    error
      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
      : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100 hover:border-slate-300'
  }`
}

function Field({ label, error, hint, required = true, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-600 tracking-wide uppercase">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-[11px] text-slate-400 leading-relaxed">{hint}</p>}
      {error && (
        <div className="flex items-center gap-1.5 text-xs font-medium text-red-600">
          <AlertCircle size={11} className="shrink-0" />
          {error}
        </div>
      )}
    </div>
  )
}

function SectionCard({ icon: Icon, title, accent = 'blue', children, badge }) {
  const accents = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-100', icon: 'text-blue-600', dot: 'bg-blue-500' },
    violet: { bg: 'bg-violet-50', border: 'border-violet-100', icon: 'text-violet-600', dot: 'bg-violet-500' },
    slate: { bg: 'bg-slate-50', border: 'border-slate-200', icon: 'text-slate-500', dot: 'bg-slate-400' },
  }
  const a = accents[accent]
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className={`flex items-center justify-between px-5 py-3.5 ${a.bg} border-b ${a.border}`}>
        <div className="flex items-center gap-2.5">
          <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${a.bg} border ${a.border}`}>
            <Icon size={14} className={a.icon} />
          </div>
          <h2 className="text-sm font-bold text-slate-800">{title}</h2>
        </div>
        {badge && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-white border border-slate-200 px-2.5 py-1 rounded-full">
            {badge}
          </span>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function Toggle({ checked, onChange, label, helper }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex h-14 w-full items-center justify-between rounded-xl border px-4 text-left transition-all ${
        checked
          ? 'border-blue-200 bg-blue-50 shadow-sm'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <span>
        <span className={`block text-xs font-semibold ${checked ? 'text-blue-800' : 'text-slate-700'}`}>
          {label}
        </span>
        <span className={`block text-[11px] mt-0.5 ${checked ? 'text-blue-500' : 'text-slate-400'}`}>
          {helper}
        </span>
      </span>
      <span
        className={`relative h-5 w-9 rounded-full transition-all duration-200 ${
          checked ? 'bg-blue-500' : 'bg-slate-200'
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all duration-200 ${
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
        className={`group flex h-12 items-center gap-3 rounded-xl border px-3.5 transition-all cursor-pointer ${
          error
            ? 'border-red-200 bg-red-50'
            : file
              ? 'border-blue-200 bg-blue-50'
              : 'border-slate-200 bg-slate-50 hover:border-blue-200 hover:bg-blue-50/50'
        }`}
      >
        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
          file ? 'bg-blue-100' : 'bg-slate-100'
        }`}>
          <FileText size={13} className={file ? 'text-blue-600' : 'text-slate-400'} />
        </div>
        <div className="min-w-0 flex-1">
          <span className={`block truncate text-xs font-semibold ${
            file ? 'text-blue-800' : 'text-slate-600'
          }`}>
            {file ? file.name : label}
          </span>
        </div>
        {file ? (
          <button
            type="button"
            onClick={onRemove}
            className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors border border-slate-200"
          >
            <X size={11} />
          </button>
        ) : (
          <label
            htmlFor={id}
            className="cursor-pointer text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-white border border-blue-200 px-2.5 py-1 rounded-lg transition-colors"
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
        <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-500">
          <AlertCircle size={11} />
          {error}
        </div>
      )}
    </div>
  )
}

function StatusBanner({ status }) {
  if (!status) return null
  return (
    <div
      className={`mb-5 flex items-start gap-3 rounded-xl border px-4 py-3.5 text-sm font-medium ${
        status.type === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-red-200 bg-red-50 text-red-600'
      }`}
    >
      {status.type === 'success'
        ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
        : <AlertCircle size={16} className="shrink-0 mt-0.5" />}
      <span>{status.message}</span>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

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
  const agentCodes = useMemo(() => AGENT_CODES[level] || [], [level])

  const basicInfoValid = useMemo(() => {
    return (
      String(form.name || '').trim().length > 0 &&
      validateEmail(form.email) &&
      validateUsCaPhone(form.phone)
    )
  }, [form.name, form.email, form.phone])

  const licenceInfoValid = useMemo(() => {
    const score = Number(form.creditReport)
    const scoreValid = !Number.isNaN(score) && score >= 300 && score <= 900
    const licenceDocKey = mode === 'new' ? 'licenceDocument' : 'transferDocument'
    return (
      scoreValid &&
      Boolean(docs[licenceDocKey]) &&
      Boolean(docs.eandODocument) &&
      Boolean(docs.apexDocument) &&
      Boolean(docs.creditReportDocument)
    )
  }, [form.creditReport, mode, docs])

  const adminInfoValid = useMemo(() => {
    return (
      String(form.agentId || '').trim().length > 0 &&
      String(form.mga || '').trim().length > 0 &&
      String(form.insuranceCompany || '').trim().length > 0 &&
      /^\d{9}$/.test(String(form.sin || '').replace(/\D/g, ''))
    )
  }, [form.agentId, form.mga, form.insuranceCompany, form.sin])

  const currentStep = useMemo(() => {
    if (!basicInfoValid) return 1
    if (!licenceInfoValid) return 2
    return 3
  }, [basicInfoValid, licenceInfoValid])

  useEffect(() => {
    const savedDraft = window.localStorage.getItem(DRAFT_KEY)
    if (!savedDraft) return
    try {
      const parsedDraft = JSON.parse(savedDraft)
      if (parsedDraft.form) setForm({ ...INITIAL_FORM, ...parsedDraft.form })
      if (parsedDraft.level) setLevel(parsedDraft.level)
      if (parsedDraft.mode) setMode(parsedDraft.mode)
      if (typeof parsedDraft.requiresSponsorship === 'boolean') setRequiresSponsorship(parsedDraft.requiresSponsorship)
      if (typeof parsedDraft.hireApexa === 'boolean') setHireApexa(parsedDraft.hireApexa)
    } catch {
      window.localStorage.removeItem(DRAFT_KEY)
    }
  }, [])

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      licenceType: mode === 'new' ? 'New licence application' : 'Existing licence transfer',
      eo: docs.eandODocument ? 'Uploaded' : '',
      apex: hireApexa ? 'Hire APEXA requested' : 'Not requested',
    }))
  }, [docs.eandODocument, hireApexa, mode])

  useEffect(() => {
    return () => { if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current) }
  }, [])

  const handleChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
    setStatus(null)
  }

  const handlePhoneChange = (e) => {
    setForm((prev) => ({ ...prev, phone: formatUsCaPhone(e.target.value) }))
    setErrors((prev) => ({ ...prev, phone: undefined }))
    setStatus(null)
  }

  const handleLevelChange = (e) => {
    const nextLevel = e.target.value
    const nextCompanies = INSURANCE_COMPANIES[nextLevel] || []
    const nextCodes = AGENT_CODES[nextLevel] || []
    setLevel(nextLevel)
    setForm((prev) => ({ ...prev, insuranceCompany: nextCompanies[0] || '', agentCode: nextCodes[0] || '' }))
    setErrors((prev) => ({ ...prev, insuranceCompany: undefined }))
  }

  const handleModeChange = (nextMode) => {
    setMode(nextMode)
    setErrors((prev) => ({ ...prev, licenceDocument: undefined, transferDocument: undefined }))
    setStatus(null)
  }

  const handleFile = (key) => (e) => {
    const file = e.target.files?.[0] || null
    const fileError = getFileError(file)
    if (fileError) {
      setDocs((prev) => ({ ...prev, [key]: null }))
      setErrors((prev) => ({ ...prev, [key]: fileError }))
      setStatus({ type: 'error', message: fileError })
      e.target.value = ''
      return
    }
    setDocs((prev) => ({ ...prev, [key]: file }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
    setStatus(null)
    e.target.value = ''
  }

  const removeFile = (key) => {
    setDocs((prev) => ({ ...prev, [key]: null }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
    setStatus(null)
  }

  const handleCanceled = () => {
    navigate(-1)
    setStatus({ type: 'error', message: 'Creation cancelled.' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const nextErrors = validateForm(form, docs, mode)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setStatus({ type: 'error', message: 'Please fix the highlighted fields before sending the onboarding link.' })
      return
    }
    setSubmitting(true)
    try {
      const result = await createAgent({ form, docs, level, mode })
      window.localStorage.removeItem(DRAFT_KEY)
      setStatus({ type: 'success', message: result.message || 'Agent created and onboarding email sent.' })
      setToast({ type: 'success', message: result.message || 'Onboarding email sent.' })
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
      toastTimerRef.current = window.setTimeout(() => {
        setToast(null)
        navigate('/admin/agents')
      }, 1500)
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Unable to send onboarding link.' })
      setToast({ type: 'error', message: err.message || 'Unable to send onboarding link.' })
    } finally {
      setSubmitting(false)
    }
  }

  const licenceDocKey = mode === 'new' ? 'licenceDocument' : 'transferDocument'

  return (
    <>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed right-5 top-5 z-50 flex items-start gap-3 w-80 rounded-2xl border px-4 py-3.5 text-sm shadow-2xl backdrop-blur-sm transition-all ${
            toast.type === 'success'
              ? 'border-emerald-200 bg-emerald-600 text-white'
              : 'border-red-200 bg-red-600 text-white'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 size={17} className="shrink-0 mt-0.5" /> : <AlertCircle size={17} className="shrink-0 mt-0.5" />}
          <span className="font-semibold leading-snug">{toast.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mx-auto max-w-5xl pb-28">

        {/* Back + Header */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-5 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft size={13} />
            Back to Agents List
          </button>

          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
                Agent Management
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Create New Agent
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Onboard a new financial agent to the management portal.
              </p>
            </div>
            {/* Step indicator */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
              {['Basic Info', 'Licence', 'Admin Fields'].map((step, i) => (
                <div key={step} className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      i + 1 < currentStep || (i === 2 && adminInfoValid)
                        ? 'bg-emerald-500 text-white'
                        : i + 1 === currentStep
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-200 text-slate-500'
                    }`}>
                      {i + 1 < currentStep || (i === 2 && adminInfoValid) ? '✓' : i + 1}
                    </div>
                    <span className={`text-xs font-medium ${
                      i + 1 < currentStep || (i === 2 && adminInfoValid)
                        ? 'text-emerald-700'
                        : i + 1 === currentStep
                          ? 'text-blue-700'
                          : 'text-slate-400'
                    }`}>
                      {step}
                    </span>
                  </div>
                  {i < 2 && <div className="w-6 h-px bg-slate-300" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        <StatusBanner status={status} />

        <div className="space-y-4">

          {/* ── Basic Information ── */}
          <SectionCard icon={User} title="Basic Information" accent="blue">
            <div className="grid gap-6 lg:grid-cols-2">

              {/* Left — text fields */}
              <div className="space-y-4">
                <Field label="Full Name" error={errors.name}>
                  <input
                    value={form.name}
                    onChange={handleChange('name')}
                    className={inputClass(errors.name)}
                    placeholder="e.g. Jonathan Doe"
                  />
                </Field>

                <Field
                  label="Email Address"
                  error={errors.email}
                  hint="Use a work email — e.g. name@company.com"
                >
                  <div className="relative">
                    <Mail size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={handleChange('email')}
                      className={`${inputClass(errors.email)} pl-10`}
                      placeholder="jonathan@example.com"
                    />
                  </div>
                </Field>

                <Field
                  label="Phone Number"
                  error={errors.phone}
                  hint="US/Canada format — 10 digits (+1 optional)"
                >
                  <input
                    value={form.phone}
                    onChange={handlePhoneChange}
                    className={inputClass(errors.phone)}
                    placeholder="(604) 555-0123"
                    inputMode="tel"
                    maxLength={14}
                  />
                </Field>
              </div>

              {/* Right — Gov ID upload */}
              <div>
                <p className="mb-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Government ID Upload <span className="text-red-500">*</span>
                </p>
                <label
                  htmlFor="government-id-upload"
                  className={`flex min-h-[164px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 text-center transition-all ${
                    docs.otherSupporting
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/40'
                  }`}
                >
                  <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl ${
                    docs.otherSupporting ? 'bg-blue-100' : 'bg-white border border-slate-200'
                  }`}>
                    <CloudUpload size={22} className={docs.otherSupporting ? 'text-blue-600' : 'text-slate-400'} />
                  </div>
                  <p className="text-sm font-bold text-slate-700">
                    {docs.otherSupporting ? docs.otherSupporting.name : 'Drag and drop file here'}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">Supports PDF, PNG, JPG · Max 10 MB</p>
                  <span className="mt-4 inline-block rounded-xl border border-slate-300 bg-white px-4 py-1.5 text-xs font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-colors">
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
                  <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-500">
                    <AlertCircle size={11} />
                    {errors.otherSupporting}
                  </div>
                )}
              </div>
            </div>
          </SectionCard>

          {/* ── Licence Details ── */}
          <SectionCard icon={ShieldCheck} title="Licence Details" accent="violet">
            <div className="grid gap-6 lg:grid-cols-2">

              {/* Left */}
              <div>
                {/* Mode toggle */}
                <p className="mb-2 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Licence Type <span className="text-red-500">*</span>
                </p>
                <div className="grid grid-cols-2 gap-2 mb-5">
                  {[
                    { id: 'transfer', icon: CheckCircle2, title: 'Existing Licence Transfer', sub: 'Transferring from another MGA' },
                    { id: 'new', icon: FileText, title: 'New Licence Application', sub: 'First-time registration' },
                  ].map(({ id, icon: Icon, title, sub }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => handleModeChange(id)}
                      className={`flex items-start gap-2.5 rounded-xl border-2 p-3 text-left transition-all ${
                        mode === id
                          ? 'border-violet-400 bg-violet-50 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${
                        mode === id ? 'bg-violet-100' : 'bg-slate-100'
                      }`}>
                        <Icon size={12} className={mode === id ? 'text-violet-600' : 'text-slate-400'} />
                      </div>
                      <span>
                        <span className={`block text-[11px] font-bold leading-tight ${
                          mode === id ? 'text-violet-800' : 'text-slate-700'
                        }`}>{title}</span>
                        <span className={`block text-[10px] mt-0.5 ${
                          mode === id ? 'text-violet-500' : 'text-slate-400'
                        }`}>{sub}</span>
                      </span>
                    </button>
                  ))}
                </div>

                {/* Required docs */}
                <p className="mb-2 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Required Documents <span className="text-red-500">*</span>
                </p>
                <div className="space-y-2">
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

              {/* Right */}
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
                  <div className="relative">
                    <CreditCard size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={form.creditReport}
                      onChange={handleChange('creditReport')}
                      className={`${inputClass(errors.creditReport)} pl-10`}
                      placeholder="750"
                    />
                  </div>
                </Field>

                {/* Score visual indicator */}
                {form.creditReport && !errors.creditReport && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold text-slate-500">Credit Score Range</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        Number(form.creditReport) >= 700
                          ? 'bg-emerald-100 text-emerald-700'
                          : Number(form.creditReport) >= 600
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-600'
                      }`}>
                        {Number(form.creditReport) >= 700 ? 'Good' : Number(form.creditReport) >= 600 ? 'Fair' : 'Poor'}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          Number(form.creditReport) >= 700
                            ? 'bg-emerald-500'
                            : Number(form.creditReport) >= 600
                              ? 'bg-yellow-400'
                              : 'bg-red-400'
                        }`}
                        style={{ width: `${Math.min(100, ((Number(form.creditReport) - 300) / 600) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1.5 text-[10px] text-slate-400 font-medium">
                      <span>300</span><span>600</span><span>900</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </SectionCard>

          {/* ── Admin Only Fields ── */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Watermark */}
            <LockKeyhole
              size={130}
              className="pointer-events-none absolute right-4 top-10 text-slate-100"
              strokeWidth={1.2}
            />
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 border border-slate-200">
                  <LockKeyhole size={13} className="text-slate-500" />
                </div>
                <h2 className="text-sm font-bold text-slate-800">Admin Only Fields</h2>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-white border border-slate-200 px-2.5 py-1 rounded-full">
                Restricted
              </span>
            </div>

            <div className="relative grid gap-4 p-5 lg:grid-cols-2">
              <Field label="Contract Company" error={errors.insuranceCompany}>
                <div className="relative">
                  <Building2 size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={form.insuranceCompany}
                    onChange={handleChange('insuranceCompany')}
                    className={`${selectClass(errors.insuranceCompany)} pl-10 pr-10`}
                  >
                    {insuranceCompanies.map((company) => (
                      <option key={company} value={company}>{company}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
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
                  <IdCard size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={form.agentId}
                    onChange={handleChange('agentId')}
                    className={`${inputClass(errors.agentId)} pl-10`}
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
                    className={`${inputClass(errors.sin)} pr-12`}
                    placeholder="•••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSin((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                  >
                    {showSin ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </Field>

              <Field label="Agent Level">
                <div className="relative">
                  <select
                    value={level}
                    onChange={handleLevelChange}
                    className={`${selectClass()} pr-10`}
                  >
                    {Object.keys(INSURANCE_COMPANIES).map((key) => (
                      <option key={key} value={key}>{key}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </Field>

              <Field label="Agent Code" error={errors.agentCode}>
                <div className="relative">
                  <select
                    value={form.agentCode}
                    onChange={handleChange('agentCode')}
                    className={`${selectClass(errors.agentCode)} pr-10`}
                  >
                    {agentCodes.map((code) => (
                      <option key={code} value={code}>{code}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </Field>

              <Field label="Commission Override (%)" error={errors.commissionOverride}>
                <input
                  value={form.commissionOverride}
                  onChange={handleChange('commissionOverride')}
                  className={inputClass(errors.commissionOverride)}
                  placeholder="e.g. 10"
                />
              </Field>
            </div>
          </div>
        </div>

        {/* ── Sticky Bottom Bar ── */}
        <div className="fixed bottom-0 left-64 right-0 z-30 border-t border-slate-200 bg-white/95 px-6 py-4 shadow-[0_-8px_32px_rgba(15,23,42,0.08)] backdrop-blur-md">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleCanceled}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:border-slate-300"
            >
              <X size={14} />
              Cancel
            </button>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-11 items-center justify-center gap-2.5 rounded-xl bg-blue-600 px-7 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-blue-300 disabled:shadow-none"
              >
                {submitting ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Save & Send Onboarding Link
                    <Send size={14} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </>
  )
}
