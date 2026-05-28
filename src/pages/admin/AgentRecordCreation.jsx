import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  CheckCircle2,
  FileCheck2,
  FileUp,
  Save,
  Send,
  X
} from 'lucide-react'
import { createAgent } from '../../utils/agents.js'

const INSURANCE_COMPANIES = {
  Level1: ['Acme Insurance'],
  Level2: ['NorthStar Mutual', 'Acme Insurance'],
  Level3: ['NorthStar Mutual', 'Keystone Assurance'],
  Level4: ['Keystone Assurance']
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
  agentId: '',
  licenceType: '',
  eo: '',
  apex: '',
  creditReport: '',
  sin: '',
  mga: '',
  commissionOverride: '',
  insuranceCompany: 'NorthStar Mutual',
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
    return 'Upload PDF, image, or Word documents only.'
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
    ['name', 'Name is required.'],
    ['email', 'Email is required.'],
    ['agentId', 'Agent ID is required.'],
    ['licenceType', 'Licence type is required.'],
    ['eo', 'E&O reference is required.'],
    ['apex', 'APEXA reference is required.'],
    ['creditReport', 'Credit report reference is required.'],
    ['sin', 'SIN is required.'],
    ['mga', 'MGA reference is required.'],
    ['commissionOverride', 'Commission override is required.'],
    ['insuranceCompany', 'Insurance company is required.'],
    ['agentCode', 'Agent code is required.']
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

  const commission = Number(form.commissionOverride)
  if (
    form.commissionOverride &&
    (Number.isNaN(commission) || commission < 0 || commission > 100)
  ) {
    errors.commissionOverride = 'Enter a percentage from 0 to 100.'
  }

  const licenceDocKey = mode === 'new' ? 'licenceDocument' : 'transferDocument'
  const licenceLabel = mode === 'new' ? 'Licence document' : 'Transfer document'
  const requiredDocs = [
    [licenceDocKey, `${licenceLabel} is required.`],
    ['eandODocument', 'E&O document is required.'],
    ['apexDocument', 'APEXA document is required.'],
    ['creditReportDocument', 'Credit report document is required.']
  ]

  requiredDocs.forEach(([key, message]) => {
    if (!docs[key]) errors[key] = message
  })

  return errors
}

function Field({ label, error, required, children }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2">
        <span>{label}</span>
        {required && <span className="text-red-500">*</span>}
      </div>
      {children}
      {error && (
        <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600">
          <AlertCircle size={13} />
          {error}
        </div>
      )}
    </div>
  )
}

function Section({ title, eyebrow, children }) {
  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-brand-50 to-white">
        <div className="text-[10px] font-bold uppercase tracking-wider text-brand-600">
          {eyebrow}
        </div>
        <h2 className="mt-1 text-lg font-bold text-slate-900">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </section>
  )
}

function inputClass(error) {
  return `w-full rounded-lg border bg-slate-50/60 px-3.5 py-2.5 text-sm outline-none transition focus:bg-white focus:ring-2 ${
    error
      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
      : 'border-slate-200 focus:border-brand-500 focus:ring-brand-100'
  }`
}

function UploadCard({ id, title, helper, file, error, required, onChange, onRemove }) {
  return (
    <div
      className={`rounded-xl border p-4 transition ${
        error
          ? 'border-red-200 bg-red-50/40'
          : file
            ? 'border-brand-200 bg-brand-50/60'
            : 'border-slate-200 bg-white hover:border-brand-200 hover:bg-brand-50/30'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`h-10 w-10 shrink-0 rounded-lg grid place-items-center ${
            file ? 'bg-brand-600 text-white' : 'bg-slate-100 text-brand-600'
          }`}
        >
          {file ? <FileCheck2 size={19} /> : <FileUp size={19} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
            <span>{title}</span>
            {required && <span className="text-red-500">*</span>}
          </div>
          <div className="mt-0.5 text-xs text-slate-500">{helper}</div>

          {file ? (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-brand-100 bg-white px-3 py-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-800">
                  {file.name}
                </div>
                <div className="text-xs text-slate-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
              <button
                type="button"
                onClick={onRemove}
                className="h-8 w-8 shrink-0 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 grid place-items-center transition"
                title="Remove file"
              >
                <X size={15} />
              </button>
            </div>
          ) : (
            <label
              htmlFor={id}
              className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm shadow-brand-600/20 transition hover:bg-brand-700"
            >
              <FileUp size={15} />
              Upload file
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
          {error && (
            <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600">
              <AlertCircle size={13} />
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AgentRecordCreation() {
  const [mode, setMode] = useState('new')
  const [level, setLevel] = useState('Level2')
  const [form, setForm] = useState(INITIAL_FORM)
  const [docs, setDocs] = useState(INITIAL_DOCS)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState(null)
  const [toast, setToast] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const toastTimerRef = useRef(null)

  const insuranceCompanies = useMemo(() => INSURANCE_COMPANIES[level] || [], [level])
  const agentCodes = useMemo(() => AGENT_CODES[level] || [], [level])

  useEffect(() => {
    const savedDraft = window.localStorage.getItem(DRAFT_KEY)
    if (!savedDraft) return

    try {
      const parsedDraft = JSON.parse(savedDraft)
      if (parsedDraft.form) setForm({ ...INITIAL_FORM, ...parsedDraft.form })
      if (parsedDraft.level) setLevel(parsedDraft.level)
      if (parsedDraft.mode) setMode(parsedDraft.mode)
    } catch {
      window.localStorage.removeItem(DRAFT_KEY)
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
    setErrors((previous) => ({
      ...previous,
      insuranceCompany: undefined,
      agentCode: undefined
    }))
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
      setStatus({
        type: 'error',
        message: fileError
      })
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
    setStatus(null)
  }

  const handleSaveDraft = () => {
    window.localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        form,
        level,
        mode,
        savedAt: new Date().toISOString()
      })
    )

    setStatus({
      type: 'success',
      message: 'Draft saved in this browser. Uploaded files need to be selected again before submit.'
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const nextErrors = validateForm(form, docs, mode)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      setStatus({
        type: 'error',
        message: 'Please fix the highlighted fields before submitting.'
      })
      return
    }

    setSubmitting(true)
    try {
      const result = await createAgent({ form, docs, level, mode })
      window.localStorage.removeItem(DRAFT_KEY)
      setStatus({
        type: 'success',
        message: result.message || 'Agent profile created successfully.'
      })
      setToast({
        type: 'success',
        message: result.message || 'Agent profile created successfully.'
      })
      setForm(INITIAL_FORM)
      setDocs(INITIAL_DOCS)
      setMode('new')
      setLevel('Level2')

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
        message: err.message || 'Unable to create agent profile.'
      })
      setToast({
        type: 'error',
        message: err.message || 'Unable to create agent profile.'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const completionCount = useMemo(() => {
    const fields = Object.values(form).filter((value) => String(value || '').trim()).length
    const uploaded = Object.values(docs).filter(Boolean).length
    return fields + uploaded
  }, [docs, form])

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current)
      }
    }
  }, [])

  return (
    <>
      {toast && (
        <div
          className={`fixed right-5 top-24 z-50 w-[320px] rounded-2xl border px-4 py-3 text-sm shadow-xl transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-600 border-emerald-700 text-white'
              : 'bg-red-600 border-red-700 text-white'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            </div>
            <div className="min-w-0 text-sm font-semibold leading-snug">
              {toast.message}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-[1600px] mx-auto">
        <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700 ring-1 ring-brand-100">
            <CheckCircle2 size={14} />
            {completionCount}/18 completed
          </div>
          <h1 className="mt-3 text-2xl font-bold text-slate-900">
            Agent Record Creation
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Create an agent profile with validated details, conditional licence workflow, and required documents.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-sm font-semibold px-3.5 py-2.5 rounded-lg transition"
          >
            <Save size={15} />
            Save Draft
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-300 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-sm shadow-brand-600/20 transition"
          >
            <Send size={15} />
            {submitting ? 'Submitting...' : 'Submit Profile'}
          </button>
        </div>
      </div>

      {status && (
        <div
          className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${
            status.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {status.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {status.message}
        </div>
      )}

      <Section eyebrow="Step 1" title="Core Agent Details">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Name" required error={errors.name}>
            <input
              value={form.name}
              onChange={handleChange('name')}
              className={inputClass(errors.name)}
              placeholder="Agent full name"
            />
          </Field>

          <Field label="Email" required error={errors.email}>
            <input
              type="email"
              value={form.email}
              onChange={handleChange('email')}
              className={inputClass(errors.email)}
              placeholder="name@agency.com"
            />
          </Field>

          <Field label="Agent ID" required error={errors.agentId}>
            <input
              value={form.agentId}
              onChange={handleChange('agentId')}
              className={inputClass(errors.agentId)}
              placeholder="Unique identifier"
            />
          </Field>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Licence Type" required error={errors.licenceType}>
            <input
              value={form.licenceType}
              onChange={handleChange('licenceType')}
              className={inputClass(errors.licenceType)}
              placeholder="e.g. New licence"
            />
          </Field>

          <Field label="E&O" required error={errors.eo}>
            <input
              value={form.eo}
              onChange={handleChange('eo')}
              className={inputClass(errors.eo)}
              placeholder="Policy / reference"
            />
          </Field>

          <Field label="APEXA" required error={errors.apex}>
            <input
              value={form.apex}
              onChange={handleChange('apex')}
              className={inputClass(errors.apex)}
              placeholder="Contract / reference"
            />
          </Field>
        </div>
      </Section>

      <Section eyebrow="Step 2" title="Licence Workflow & Agent Level">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-1">
            {[
              ['new', 'New Licence'],
              ['transfer', 'Transfer']
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => handleModeChange(value)}
                type="button"
                className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
                  mode === value
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="ml-auto w-full sm:w-auto">
            <Field label="Agent Level" required>
              <select
                value={level}
                onChange={handleLevelChange}
                className="w-full sm:w-[240px] rounded-lg border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-sm focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none"
              >
                {Object.keys(INSURANCE_COMPANIES).map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Field label="Insurance Company" required error={errors.insuranceCompany}>
            <select
              value={form.insuranceCompany}
              onChange={handleChange('insuranceCompany')}
              className={inputClass(errors.insuranceCompany)}
            >
              {insuranceCompanies.length === 0 ? (
                <option value="">No options</option>
              ) : (
                insuranceCompanies.map((company) => (
                  <option key={company} value={company}>
                    {company}
                  </option>
                ))
              )}
            </select>
          </Field>

          <Field label="Agent Code" required error={errors.agentCode}>
            <select
              value={form.agentCode}
              onChange={handleChange('agentCode')}
              className={inputClass(errors.agentCode)}
            >
              {agentCodes.length === 0 ? (
                <option value="">No options</option>
              ) : (
                agentCodes.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))
              )}
            </select>
          </Field>

          <Field label="Commission Override" required error={errors.commissionOverride}>
            <input
              value={form.commissionOverride}
              onChange={handleChange('commissionOverride')}
              className={inputClass(errors.commissionOverride)}
              placeholder="e.g. 12.5"
            />
          </Field>
        </div>
      </Section>

      <Section eyebrow="Step 3" title="Regulatory IDs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Credit Report" required error={errors.creditReport}>
            <input
              value={form.creditReport}
              onChange={handleChange('creditReport')}
              className={inputClass(errors.creditReport)}
              placeholder="Reference / score"
            />
          </Field>

          <Field label="SIN" required error={errors.sin}>
            <input
              value={form.sin}
              onChange={handleChange('sin')}
              className={inputClass(errors.sin)}
              placeholder="9 digits"
            />
          </Field>

          <Field label="MGA" required error={errors.mga}>
            <input
              value={form.mga}
              onChange={handleChange('mga')}
              className={inputClass(errors.mga)}
              placeholder="MGA reference"
            />
          </Field>
        </div>
      </Section>

      <Section eyebrow="Step 4" title="Document Uploads">
        <div className="mb-5 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-900">
          Upload PDF, image, or Word documents. Required files are checked before profile submission.
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <UploadCard
            id="licence-document"
            title={mode === 'new' ? 'Licence Document' : 'Transfer Licence Document'}
            helper={mode === 'new' ? 'Proof for new licence workflow' : 'Transfer authorization document'}
            required
            file={mode === 'new' ? docs.licenceDocument : docs.transferDocument}
            error={mode === 'new' ? errors.licenceDocument : errors.transferDocument}
            onChange={handleFile(mode === 'new' ? 'licenceDocument' : 'transferDocument')}
            onRemove={() => removeFile(mode === 'new' ? 'licenceDocument' : 'transferDocument')}
          />

          <UploadCard
            id="eando-document"
            title="E&O Document"
            helper="Errors and omissions coverage proof"
            required
            file={docs.eandODocument}
            error={errors.eandODocument}
            onChange={handleFile('eandODocument')}
            onRemove={() => removeFile('eandODocument')}
          />

          <UploadCard
            id="apexa-document"
            title="APEXA Document"
            helper="Contract or appointment confirmation"
            required
            file={docs.apexDocument}
            error={errors.apexDocument}
            onChange={handleFile('apexDocument')}
            onRemove={() => removeFile('apexDocument')}
          />

          <UploadCard
            id="credit-report-document"
            title="Credit Report Document"
            helper="Credit report or background verification file"
            required
            file={docs.creditReportDocument}
            error={errors.creditReportDocument}
            onChange={handleFile('creditReportDocument')}
            onRemove={() => removeFile('creditReportDocument')}
          />

          <UploadCard
            id="supporting-document"
            title="Other Supporting Documents"
            helper="Optional additional document"
            file={docs.otherSupporting}
            error={errors.otherSupporting}
            onChange={handleFile('otherSupporting')}
            onRemove={() => removeFile('otherSupporting')}
          />
        </div>
      </Section>
    </form>
    </>                                 
  )

}
