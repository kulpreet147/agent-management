import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronDown,
  CloudUpload,
  CreditCard,
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
} from 'lucide-react'
import { createAgent } from '../../utils/agents.js'

const INSURANCE_COMPANIES = {
  Level1: ['Apex Financial Group'],
  Level2: ['HUB Financial', 'Apex Financial Group'],
  Level3: ['HUB Financial', 'NorthStar Mutual'],
  Level4: ['NorthStar Mutual'],
}

const INSURANCE_COMPANY_OPTIONS = [...new Set(Object.values(INSURANCE_COMPANIES).flat())]

const STATUS_OPTIONS = ['Submitted', 'Under Review', 'Approved', 'Active']

const INITIAL_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  agentId: '',
  licenceType: 'Existing licence transfer',
  requireSponsorship: false,
  haveApexa: false,
  apexaId: '',
  eo: '',
  apex: 'Not requested',
  creditScore: '750',
  accessCode: '',
  status: 'Submitted',
  comment: '',
  sin: '',
  fullSin: '',
  mga: 'HUB Financial',
  insuranceCompany: 'Apex Financial Group',
  licenceExpiryDate: '',
  eoPolicyNumber: '',
  eoPolicyCompany: '',
  eoPolicyExpiryDate: '',
  referralSource: '',
  notes: '',
  commissionOverride: '',
  segFundsOverride: '',
}

const INITIAL_DOCS = {
  governmentId: null,
  transferDocument: null,
  eandODocument: null,
  creditReportDocument: null,
}

const DRAFT_KEY = 'agentflow-agent-record-draft'
const MAX_FILE_SIZE_MB = 10
const ALLOWED_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx']
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+$/
const STEP_ONE_REQUIRED_FIELDS = ['firstName', 'lastName', 'email', 'phone', 'creditScore']

function buildFullName(firstName, lastName) {
  return [firstName, lastName].map((value) => String(value || '').trim()).filter(Boolean).join(' ')
}

function buildProfilePayload(form, mode) {
  return {
    personal: {
      firstName: form.firstName || '',
      lastName: form.lastName || '',
      email: form.email || '',
      primaryPhone: form.phone || '',
    },
    business: {
      operatingName: buildFullName(form.firstName, form.lastName),
    },
    professional: {
      licenceType: form.licenceType || '',
      requireSponsorship: Boolean(form.requireSponsorship),
      haveApexa: Boolean(form.haveApexa),
      apexaId: form.haveApexa ? form.apexaId || '' : '',
      creditScore: form.creditScore || '',
      contractCompany: form.insuranceCompany || '',
      mga: form.mga || '',
      licenceNumber: form.agentId || '',
      licenceExpiryDate: form.licenceExpiryDate || '',
      eoPolicyNumber: mode === 'transfer' ? form.eoPolicyNumber || '' : '',
      eoPolicyCompany: mode === 'transfer' ? form.eoPolicyCompany || '' : '',
      eoPolicyExpiryDate: mode === 'transfer' ? form.eoPolicyExpiryDate || '' : '',
      referralSource: form.referralSource || '',
      commissionOverride: form.commissionOverride || '',
      segFundsOverride: form.segFundsOverride || '',
    },
    settings: {
      onboardingStatus: form.status || '',
    },
  }
}

function getRequiredDocsForMode(mode) {
  return mode === 'new'
    ? ['governmentId', 'creditReportDocument']
    : ['governmentId', 'transferDocument', 'eandODocument', 'creditReportDocument']
}

function getFileError(file) {
  if (!file) return null
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!ALLOWED_EXTENSIONS.includes(extension)) return 'Upload PDF, PNG, JPG, or Word documents only.'
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) return `File must be ${MAX_FILE_SIZE_MB} MB or smaller.`
  return null
}

function validateEmail(value) {
  return EMAIL_REGEX.test(value)
}

function normalizePhoneDigits(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 11)
}

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

function getStepOneCompletion({ form, docs, mode }) {
  const requiredFields = form.haveApexa
    ? [...STEP_ONE_REQUIRED_FIELDS, 'apexaId']
    : STEP_ONE_REQUIRED_FIELDS
  const requiredDocs = getRequiredDocsForMode(mode)

  const completedFields = requiredFields.filter((key) => String(form[key] || '').trim()).length
  const completedDocs = requiredDocs.filter((key) => Boolean(docs[key])).length
  const total = requiredFields.length + requiredDocs.length
  const completed = completedFields + completedDocs

  return {
    completed,
    total,
    percentage: total ? Math.round((completed / total) * 100) : 0,
  }
}

function validateForm(form, docs, mode) {
  const errors = {}
  const requiredFields = [
    ['firstName', 'First name is required.'],
    ['lastName', 'Last name is required.'],
    ['email', 'Email address is required.'],
    ['phone', 'Phone number is required.'],
    ['agentId', 'Licence number is required.'],
    ['creditScore', 'Credit score is required.'],
    ['insuranceCompany', 'Contract company is required.'],
    ['mga', 'MGA name is required.'],
    ['status', 'Status is required.'],
    ['fullSin', 'SIN number is required.'],
  ]

  requiredFields.forEach(([key, message]) => {
    if (!String(form[key] || '').trim()) errors[key] = message
  })

  if (form.haveApexa && !String(form.apexaId || '').trim()) {
    errors.apexaId = 'APEXA ID is required when Have APEXA is enabled.'
  }
  if (form.email && !validateEmail(form.email)) {
    errors.email = 'Enter a valid email address.'
  }
  if (form.phone && !validateUsCaPhone(form.phone)) {
    errors.phone = 'Enter a valid US/Canada phone number (10 digits).'
  }
  if (form.fullSin && !/^\d{9}$/.test(form.fullSin.replace(/\D/g, ''))) {
    errors.fullSin = 'SIN must contain 9 digits.'
  }

  const percentageFields = ['commissionOverride', 'segFundsOverride']
  percentageFields.forEach((key) => {
    const value = String(form[key] || '').trim()
    if (!value) return
    const numericValue = Number(value)
    if (Number.isNaN(numericValue) || numericValue < 0 || numericValue > 100) {
      errors[key] = 'Value must be between 0 and 100.'
    }
  })

  const score = Number(form.creditScore)
  if (form.creditScore && (Number.isNaN(score) || score < 300 || score > 900)) {
    errors.creditScore = 'Enter a score from 300 to 900.'
  }

  const requiredDocs = getRequiredDocsForMode(mode)
  const docLabels = {
    governmentId: 'Government ID upload is required.',
    transferDocument: 'Licence copy is required.',
    eandODocument: 'E&O policy is required.',
    creditReportDocument: 'Credit report is required.',
  }

  requiredDocs.forEach((key) => {
    if (!docs[key]) errors[key] = docLabels[key]
  })

  return errors
}

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

function textareaClass(error) {
  return `w-full rounded-xl border bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:ring-2 ${
    error
      ? 'border-red-300 focus:border-red-400 focus:ring-red-100 bg-red-50/30'
      : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100 hover:border-slate-300'
  }`
}

function Field({ label, error, hint, required = true, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-[11px] leading-relaxed text-slate-400">{hint}</p>}
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
    blue: { bg: 'bg-blue-50', border: 'border-blue-100', icon: 'text-blue-600' },
    violet: { bg: 'bg-violet-50', border: 'border-violet-100', icon: 'text-violet-600' },
    slate: { bg: 'bg-slate-50', border: 'border-slate-200', icon: 'text-slate-500' },
  }
  const currentAccent = accents[accent]

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className={`flex items-center justify-between border-b px-5 py-3.5 ${currentAccent.bg} ${currentAccent.border}`}>
        <div className="flex items-center gap-2.5">
          <div className={`flex h-7 w-7 items-center justify-center rounded-lg border ${currentAccent.bg} ${currentAccent.border}`}>
            <Icon size={14} className={currentAccent.icon} />
          </div>
          <h2 className="text-sm font-bold text-slate-800">{title}</h2>
        </div>
        {badge && (
          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {badge}
          </span>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function Toggle({ checked, onChange, label, helper, disabled = false }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`flex h-14 w-full items-center justify-between rounded-xl border px-4 text-left transition-all ${
        checked
          ? 'border-blue-200 bg-blue-50 shadow-sm'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
      } ${disabled ? 'cursor-not-allowed opacity-80' : ''}`}
    >
      <span>
        <span className={`block text-xs font-semibold ${checked ? 'text-blue-800' : 'text-slate-700'}`}>
          {label}
        </span>
        <span className={`mt-0.5 block text-[11px] ${checked ? 'text-blue-500' : 'text-slate-400'}`}>
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
        className={`group flex h-12 items-center gap-3 rounded-xl border px-3.5 transition-all ${
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
          <span className={`block truncate text-xs font-semibold ${file ? 'text-blue-800' : 'text-slate-600'}`}>
            {file ? file.name : label}
          </span>
        </div>
        {file ? (
          <button
            type="button"
            onClick={onRemove}
            className="flex h-6 w-6 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
          >
            <X size={11} />
          </button>
        ) : (
          <label
            htmlFor={id}
            className="cursor-pointer rounded-lg border border-blue-200 bg-white px-2.5 py-1 text-[11px] font-bold text-blue-600 transition-colors hover:text-blue-700"
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
      {status.type === 'success' ? (
        <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
      ) : (
        <AlertCircle size={16} className="mt-0.5 shrink-0" />
      )}
      <span>{status.message}</span>
    </div>
  )
}

function RegistrationProgressBar({ completed, total, percentage }) {
  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Registration Completion
        </span>
        <span className="text-sm font-bold text-slate-700">
          {completed}/{total} complete
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {percentage}% of mandatory Step-1 fields are ready.
      </p>
    </div>
  )
}

export default function AgentRecordCreation() {
  const [mode, setMode] = useState('transfer')
  const [form, setForm] = useState(INITIAL_FORM)
  const [docs, setDocs] = useState(INITIAL_DOCS)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState(null)
  const [toast, setToast] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [showSin, setShowSin] = useState(false)
  const navigate = useNavigate()
  const toastTimerRef = useRef(null)
  const statusTimerRef = useRef(null)

  const insuranceCompanies = useMemo(() => INSURANCE_COMPANY_OPTIONS, [])

  const basicInfoValid = useMemo(() => {
    return (
      String(form.firstName || '').trim().length > 0 &&
      String(form.lastName || '').trim().length > 0 &&
      validateEmail(form.email) &&
      validateUsCaPhone(form.phone)
    )
  }, [form.firstName, form.lastName, form.email, form.phone])

  const licenceInfoValid = useMemo(() => {
    const score = Number(form.creditScore)
    const scoreValid = !Number.isNaN(score) && score >= 300 && score <= 900
    const requiredDocs = getRequiredDocsForMode(mode)
    return scoreValid && requiredDocs.every((key) => Boolean(docs[key])) && (!form.haveApexa || Boolean(form.apexaId))
  }, [docs, form.apexaId, form.creditScore, form.haveApexa, mode])

  const adminInfoValid = useMemo(() => {
    return (
      String(form.agentId || '').trim().length > 0 &&
      String(form.mga || '').trim().length > 0 &&
      String(form.insuranceCompany || '').trim().length > 0 &&
      String(form.status || '').trim().length > 0 &&
      /^\d{9}$/.test(String(form.fullSin || '').replace(/\D/g, ''))
    )
  }, [form.agentId, form.mga, form.insuranceCompany, form.status, form.fullSin])

  const currentStep = useMemo(() => {
    if (!basicInfoValid) return 1
    if (!licenceInfoValid) return 2
    return 3
  }, [basicInfoValid, licenceInfoValid])

  const registrationProgress = useMemo(() => getStepOneCompletion({ form, docs, mode }), [form, docs, mode])

  useEffect(() => {
    const savedDraft = window.localStorage.getItem(DRAFT_KEY)
    if (!savedDraft) return

    try {
      const parsedDraft = JSON.parse(savedDraft)
      if (parsedDraft.form) setForm({ ...INITIAL_FORM, ...parsedDraft.form })
      if (parsedDraft.docs) setDocs({ ...INITIAL_DOCS, ...parsedDraft.docs })
      if (parsedDraft.mode) setMode(parsedDraft.mode)
    } catch {
      window.localStorage.removeItem(DRAFT_KEY)
    }
  }, [])

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      licenceType: mode === 'new' ? 'New licence application' : 'Existing licence transfer',
      requireSponsorship: mode === 'new' ? true : prev.requireSponsorship,
      eo: mode === 'new' ? 'Not required for new application' : docs.eandODocument ? 'Uploaded' : '',
      apex: prev.haveApexa ? 'APEXA enabled' : 'Not requested',
    }))

    if (mode === 'new') {
      setDocs((prev) => ({
        ...prev,
        transferDocument: null,
        eandODocument: null,
      }))
      setErrors((prev) => ({
        ...prev,
        transferDocument: undefined,
        eandODocument: undefined,
      }))
    }
  }, [docs.eandODocument, mode])

  useEffect(() => {
    window.localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        form,
        docs: Object.fromEntries(Object.keys(docs).map((key) => [key, docs[key] ? { name: docs[key].name } : null])),
        mode,
      }),
    )
  }, [docs, form, mode])

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
      if (statusTimerRef.current) window.clearTimeout(statusTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!toast) return undefined

    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null)
    }, toast.type === 'success' ? 1800 : 3500)

    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
    }
  }, [toast])

  useEffect(() => {
    if (!status || status.type !== 'error') return undefined

    if (statusTimerRef.current) window.clearTimeout(statusTimerRef.current)
    statusTimerRef.current = window.setTimeout(() => {
      setStatus(null)
    }, 3500)

    return () => {
      if (statusTimerRef.current) window.clearTimeout(statusTimerRef.current)
    }
  }, [status])

  const handleChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
    setStatus(null)
  }

  const handleToggle = (key) => (checked) => {
    setForm((prev) => ({
      ...prev,
      [key]: checked,
      ...(key === 'haveApexa' && !checked ? { apexaId: '' } : {}),
      ...(key === 'haveApexa' ? { apex: checked ? 'APEXA enabled' : 'Not requested' } : {}),
    }))
    setErrors((prev) => ({
      ...prev,
      ...(key === 'haveApexa' ? { apexaId: undefined } : {}),
    }))
    setStatus(null)
  }

  const handlePhoneChange = (e) => {
    setForm((prev) => ({ ...prev, phone: formatUsCaPhone(e.target.value) }))
    setErrors((prev) => ({ ...prev, phone: undefined }))
    setStatus(null)
  }

  const handleModeChange = (nextMode) => {
    setMode(nextMode)
    setStatus(null)
    setErrors((prev) => ({
      ...prev,
      transferDocument: undefined,
      eandODocument: undefined,
    }))
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
      const payload = {
        form: {
          ...form,
          name: buildFullName(form.firstName, form.lastName),
          sin: form.fullSin,
          profile: buildProfilePayload(form, mode),
        },
        docs,
        mode,
      }
      const result = await createAgent(payload)
      window.localStorage.removeItem(DRAFT_KEY)
      setStatus({ type: 'success', message: result.message || 'Agent created and onboarding email sent.' })
      setToast({ type: 'success', message: result.message || 'Onboarding email sent.' })
      if (statusTimerRef.current) window.clearTimeout(statusTimerRef.current)
      statusTimerRef.current = window.setTimeout(() => {
        setStatus(null)
        navigate('/admin/agents')
      }, 1800)
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Unable to send onboarding link.' })
      setToast({ type: 'error', message: err.message || 'Unable to send onboarding link.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {toast && (
        <div
          className={`fixed right-5 top-5 z-50 flex w-80 items-start gap-3 rounded-2xl border px-4 py-3.5 text-sm shadow-2xl backdrop-blur-sm transition-all ${
            toast.type === 'success'
              ? 'border-emerald-200 bg-emerald-600 text-white'
              : 'border-red-200 bg-red-600 text-white'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
          ) : (
            <AlertCircle size={17} className="mt-0.5 shrink-0" />
          )}
          <span className="font-semibold leading-snug">{toast.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mx-auto max-w-5xl pb-28">
        <div className="mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-5 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700"
          >
            <ArrowLeft size={13} />
            Back to Agents List
          </button>

          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-400">
                Agent Management
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Create New Agent
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Onboard a new financial agent to the management portal.
              </p>
            </div>

            <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 sm:flex">
              {['Basic Info', 'Licence', 'Admin Fields'].map((step, index) => (
                <div key={step} className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                        index + 1 < currentStep || (index === 2 && adminInfoValid)
                          ? 'bg-emerald-500 text-white'
                          : index + 1 === currentStep
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {index + 1 < currentStep || (index === 2 && adminInfoValid) ? '✓' : index + 1}
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        index + 1 < currentStep || (index === 2 && adminInfoValid)
                          ? 'text-emerald-700'
                          : index + 1 === currentStep
                            ? 'text-blue-700'
                            : 'text-slate-400'
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                  {index < 2 && <div className="h-px w-6 bg-slate-300" />}
                </div>
              ))}
            </div>
          </div>

          <RegistrationProgressBar
            completed={registrationProgress.completed}
            total={registrationProgress.total}
            percentage={registrationProgress.percentage}
          />
        </div>

        <StatusBanner status={status} />

        <div className="space-y-4">
          <SectionCard icon={User} title="Basic Information" accent="blue">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="First Name" error={errors.firstName}>
                    <input
                      value={form.firstName}
                      onChange={handleChange('firstName')}
                      className={inputClass(errors.firstName)}
                      placeholder="e.g. Jonathan"
                    />
                  </Field>

                  <Field label="Last Name" error={errors.lastName}>
                    <input
                      value={form.lastName}
                      onChange={handleChange('lastName')}
                      className={inputClass(errors.lastName)}
                      placeholder="e.g. Doe"
                    />
                  </Field>
                </div>

                <Field
                  label="Email Address"
                  error={errors.email}
                  hint="Use a work email - e.g. name@company.com"
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
                  hint="US/Canada format - 10 digits (+1 optional)"
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

              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Government ID Upload <span className="text-red-500">*</span>
                </p>
                <label
                  htmlFor="government-id-upload"
                  className={`flex min-h-[164px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 text-center transition-all ${
                    docs.governmentId
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/40'
                  }`}
                >
                  <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl ${
                    docs.governmentId ? 'bg-blue-100' : 'border border-slate-200 bg-white'
                  }`}>
                    <CloudUpload size={22} className={docs.governmentId ? 'text-blue-600' : 'text-slate-400'} />
                  </div>
                  <p className="text-sm font-bold text-slate-700">
                    {docs.governmentId ? docs.governmentId.name : 'Drag and drop file here'}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">Supports PDF, PNG, JPG - Max 10 MB</p>
                  <span className="mt-4 inline-block rounded-xl border border-slate-300 bg-white px-4 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-600">
                    Browse Files
                  </span>
                </label>
                <input
                  id="government-id-upload"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  className="hidden"
                  onChange={handleFile('governmentId')}
                />
                {errors.governmentId && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-500">
                    <AlertCircle size={11} />
                    {errors.governmentId}
                  </div>
                )}
              </div>
            </div>
          </SectionCard>

          <SectionCard icon={ShieldCheck} title="Licence Details" accent="violet">
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Licence Type <span className="text-red-500">*</span>
                </p>
                <div className="mb-5 grid grid-cols-2 gap-2">
                  {[
                    {
                      id: 'transfer',
                      icon: CheckCircle2,
                      title: 'Existing Licence Transfer',
                      sub: 'Transferring from another MGA',
                    },
                    {
                      id: 'new',
                      icon: FileText,
                      title: 'New Licence Application',
                      sub: 'First-time registration',
                    },
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
                        }`}>
                          {title}
                        </span>
                        <span className={`mt-0.5 block text-[10px] ${
                          mode === id ? 'text-violet-500' : 'text-slate-400'
                        }`}>
                          {sub}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>

                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Required Documents <span className="text-red-500">*</span>
                </p>
                <div className="space-y-2">
                  {mode === 'transfer' ? (
                    <>
                      <UploadTile
                        id="transfer-document"
                        label="Licence Copy"
                        file={docs.transferDocument}
                        error={errors.transferDocument}
                        onChange={handleFile('transferDocument')}
                        onRemove={() => removeFile('transferDocument')}
                      />
                      <UploadTile
                        id="eando-document"
                        label="E&O Policy"
                        file={docs.eandODocument}
                        error={errors.eandODocument}
                        onChange={handleFile('eandODocument')}
                        onRemove={() => removeFile('eandODocument')}
                      />
                    </>
                  ) : (
                    <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50 px-3.5 py-3 text-xs font-medium text-blue-700">
                      Licence Copy and E&amp;O uploads are hidden for new licence applications. Sponsorship is auto-enabled.
                    </div>
                  )}

                  <UploadTile
                    id="credit-report-document"
                    label="Recent Credit Report"
                    file={docs.creditReportDocument}
                    error={errors.creditReportDocument}
                    onChange={handleFile('creditReportDocument')}
                    onRemove={() => removeFile('creditReportDocument')}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Toggle
                  checked={form.requireSponsorship}
                  onChange={handleToggle('requireSponsorship')}
                  disabled={mode === 'new'}
                  label="Require Sponsorship?"
                  helper={
                    mode === 'new'
                      ? 'Defaulted to Yes for new licence applications'
                      : 'Agent needs sponsor approval letter'
                  }
                />

                <Toggle
                  checked={form.haveApexa}
                  onChange={handleToggle('haveApexa')}
                  label="Have APEXA?"
                  helper="Enable this if the agent already has an APEXA profile"
                />

                {form.haveApexa && (
                  <Field label="APEXA ID" error={errors.apexaId}>
                    <input
                      value={form.apexaId}
                      onChange={handleChange('apexaId')}
                      className={inputClass(errors.apexaId)}
                      placeholder="Enter APEXA ID"
                    />
                  </Field>
                )}

                <Field label="Credit Score" error={errors.creditScore}>
                  <div className="relative">
                    <CreditCard size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={form.creditScore}
                      onChange={handleChange('creditScore')}
                      className={`${inputClass(errors.creditScore)} pl-10`}
                      placeholder="750"
                    />
                  </div>
                </Field>

                {form.creditScore && !errors.creditScore && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-500">Credit Score Range</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                          Number(form.creditScore) >= 700
                            ? 'bg-emerald-100 text-emerald-700'
                            : Number(form.creditScore) >= 600
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {Number(form.creditScore) >= 700 ? 'Good' : Number(form.creditScore) >= 600 ? 'Fair' : 'Poor'}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          Number(form.creditScore) >= 700
                            ? 'bg-emerald-500'
                            : Number(form.creditScore) >= 600
                              ? 'bg-yellow-400'
                              : 'bg-red-400'
                        }`}
                        style={{ width: `${Math.min(100, ((Number(form.creditScore) - 300) / 600) * 100)}%` }}
                      />
                    </div>
                    <div className="mt-1.5 flex justify-between text-[10px] font-medium text-slate-400">
                      <span>300</span>
                      <span>600</span>
                      <span>900</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </SectionCard>

          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            <LockKeyhole
              size={130}
              className="pointer-events-none absolute right-4 top-10 z-0 text-slate-100"
              strokeWidth={1.2}
            />

            <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-b from-slate-50 to-slate-100 px-5 py-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-100">
                  <LockKeyhole size={13} className="text-slate-500" />
                </div>
                <h2 className="text-sm font-bold text-slate-800">Admin Only Fields</h2>
              </div>
              <span className="inline-flex items-center rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
                Restricted
              </span>
            </div>

            <div className="relative z-10 grid gap-4 p-5 lg:grid-cols-2">
              <Field label="Contract Company" error={errors.insuranceCompany}>
                <div className="relative">
                  <Building2 size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={form.insuranceCompany}
                    onChange={handleChange('insuranceCompany')}
                    className={`${selectClass(errors.insuranceCompany)} pl-10 pr-10`}
                  >
                    {insuranceCompanies.map((company) => (
                      <option key={company} value={company}>
                        {company}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </Field>

              <Field label="Access Code" error={errors.accessCode} required={false}>
                <input
                  value={form.accessCode}
                  onChange={handleChange('accessCode')}
                  className={inputClass(errors.accessCode)}
                  placeholder="Secure internal access code"
                />
              </Field>

              <Field label="Status" error={errors.status}>
                <div className="relative">
                  <select
                    value={form.status}
                    onChange={handleChange('status')}
                    className={`${selectClass(errors.status)} pr-10`}
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
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

              <Field label="Comment" error={errors.comment} required={false}>
                <input
                  value={form.comment}
                  onChange={handleChange('comment')}
                  className={inputClass(errors.comment)}
                  placeholder="Internal review comment"
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

              <Field label="Licence Expiry Date" error={errors.licenceExpiryDate} required={false}>
                <input
                  type="date"
                  value={form.licenceExpiryDate}
                  onChange={handleChange('licenceExpiryDate')}
                  className={inputClass(errors.licenceExpiryDate)}
                />
              </Field>

              <Field label="E&O Policy Number" error={errors.eoPolicyNumber} required={false}>
                <input
                  value={form.eoPolicyNumber}
                  onChange={handleChange('eoPolicyNumber')}
                  placeholder="Policy number"
                  className={inputClass(errors.eoPolicyNumber)}
                />
              </Field>

              <Field label="E&O Policy Company" error={errors.eoPolicyCompany} required={false}>
                <input
                  value={form.eoPolicyCompany}
                  onChange={handleChange('eoPolicyCompany')}
                  className={inputClass(errors.eoPolicyCompany)}
                  placeholder="Insurer name"
                />
              </Field>

              <Field label="E&O Policy Expiry Date" error={errors.eoPolicyExpiryDate} required={false}>
                <input
                  type="date"
                  value={form.eoPolicyExpiryDate}
                  onChange={handleChange('eoPolicyExpiryDate')}
                  className={inputClass(errors.eoPolicyExpiryDate)}
                />
              </Field>

              <Field label="Referral Source" error={errors.referralSource} required={false}>
                <input
                  value={form.referralSource}
                  onChange={handleChange('referralSource')}
                  className={inputClass(errors.referralSource)}
                  placeholder="Referral source"
                />
              </Field>

              <Field label="Commission Override (%)" error={errors.commissionOverride} required={false}>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.commissionOverride}
                  onChange={handleChange('commissionOverride')}
                  className={inputClass(errors.commissionOverride)}
                  placeholder="e.g. 10"
                />
              </Field>

              <Field label="Seg Funds Override (%)" error={errors.segFundsOverride} required={false}>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.segFundsOverride}
                  onChange={handleChange('segFundsOverride')}
                  className={inputClass(errors.segFundsOverride)}
                  placeholder="e.g. 12.5"
                />
              </Field>

              <Field label="SIN Number" error={errors.fullSin}>
                <div className="relative">
                  <input
                    type={showSin ? 'text' : 'password'}
                    value={form.fullSin}
                    onChange={handleChange('fullSin')}
                    className={`${inputClass(errors.fullSin)} pr-12`}
                    placeholder="123456789"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSin((prev) => !prev)}
                    className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                  >
                    {showSin ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </Field>

            </div>
            <div className="relative z-10 grid gap-2 p-5 lg:grid-cols-1">
              <Field label="Notes" error={errors.notes} required={false}>
                <textarea
                  rows={4}
                  value={form.notes}
                  onChange={handleChange('notes')}
                  className={textareaClass(errors.notes)}
                  placeholder="Internal onboarding notes"
                />
              </Field>
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-64 right-0 z-30 border-t border-slate-200 bg-white/95 px-6 py-4 shadow-[0_-8px_32px_rgba(15,23,42,0.08)] backdrop-blur-md">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleCanceled}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <X size={14} />
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-11 items-center justify-center gap-2.5 rounded-xl bg-blue-600 px-7 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-blue-300 disabled:shadow-none"
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Sending...
                </>
              ) : (
                <>
                  Save &amp; Send Onboarding Link
                  <Send size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </>
  )
}
