import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Copy, MailPlus, UserPlus } from 'lucide-react'
import { createAccountInvite } from '../../utils/admins.js'

const initialForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  zipcode: '',
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
  if (!value) return true
  const raw = normalizePhoneDigits(value)
  const digits = raw.length === 11 && raw.startsWith('1') ? raw.slice(1) : raw
  return digits.length === 10
}

function normalizeUsCaPostalCode(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9 -]/g, '')
    .slice(0, 10)
}

function validateUsCaPostalCode(value) {
  if (!value) return true
  const normalized = normalizeUsCaPostalCode(value).trim()
  return /^\d{5}(-\d{4})?$/.test(normalized) || /^[A-Z]\d[A-Z][ -]?\d[A-Z]\d$/.test(normalized)
}

export default function AdminCreate() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldError, setFieldError] = useState({})
  const [createdInvite, setCreatedInvite] = useState(null)

  const handleChange = (field) => (event) => {
    setForm((previous) => ({ ...previous, [field]: event.target.value }))
    if (field === 'phone' || field === 'zipcode') {
      setFieldError((previous) => ({ ...previous, [field]: '' }))
    }
  }

  const handlePhoneChange = (event) => {
    setForm((previous) => ({ ...previous, phone: formatUsCaPhone(event.target.value) }))
    setFieldError((previous) => ({ ...previous, phone: '' }))
  }

  const handleZipcodeChange = (event) => {
    setForm((previous) => ({
      ...previous,
      zipcode: normalizeUsCaPostalCode(event.target.value),
    }))
    setFieldError((previous) => ({ ...previous, zipcode: '' }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setFieldError({})

    if (!validateUsCaPhone(form.phone)) {
      setFieldError((previous) => ({ ...previous, phone: 'Enter a valid US/Canada phone number.' }))
      return
    }

    if (!validateUsCaPostalCode(form.zipcode)) {
      setFieldError((previous) => ({ ...previous, zipcode: 'Enter a valid US/Canada zipcode/postal code.' }))
      return
    }

    setLoading(true)

    try {
      const invite = await createAccountInvite('admin', form)
      setCreatedInvite(invite)
      await navigator.clipboard.writeText(invite.inviteLink)
    } catch (err) {
      setError(err.message || 'Unable to create admin.')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setForm(initialForm)
    setCreatedInvite(null)
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-full min-h-0 flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="flex items-center justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => navigate('/master/admin-management')}
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-brand-700"
            >
              <ArrowLeft size={16} />
              Back to Admin Management
            </button>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900">New Administrator</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Create a new admin account, generate an invite link, and send setup access to their email.
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
            <MailPlus size={16} />
            Invite access
          </div>
        </div>

        {!createdInvite ? (
          <form onSubmit={handleSubmit} className="mt-8 grid gap-4 lg:grid-cols-2">
            {[
              ['firstName', 'First name'],
              ['lastName', 'Last name'],
              ['email', 'Email', 'email'],
              ['phone', 'Phone number'],
              ['address', 'Address'],
              ['zipcode', 'Zipcode'],
            ].map(([field, label, type = 'text']) => (
              <label key={field} className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                  {label}
                </span>
                <input
                  type={type}
                  value={form[field]}
                  onChange={
                    field === 'phone'
                      ? handlePhoneChange
                      : field === 'zipcode'
                        ? handleZipcodeChange
                        : handleChange(field)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
                  placeholder={label}
                  required={field !== 'address' && field !== 'phone'}
                  inputMode={field === 'phone' ? 'tel' : undefined}
                  maxLength={field === 'phone' ? 14 : field === 'zipcode' ? 10 : undefined}
                />
                {(field === 'phone' || field === 'zipcode') && fieldError[field] ? (
                  <span className="mt-1 block text-xs text-red-600">{fieldError[field]}</span>
                ) : null}
              </label>
            ))}

            {error && (
              <div className="lg:col-span-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="lg:col-span-2 flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/master/admin-management')}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
              >
                <UserPlus size={16} className="mr-2" />
                {loading ? 'Creating...' : 'Create Admin & Send Invite'}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-8 max-w-2xl rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
            <h2 className="text-xl font-semibold text-emerald-900">
              Invitation ready for {createdInvite.firstName} {createdInvite.lastName}
            </h2>
            <p className="mt-2 text-sm text-emerald-800">
              The invite link has been generated and copied to your clipboard. Share it with the new admin so they can set their password and sign in.
            </p>

            <div className="mt-5 rounded-xl border border-emerald-200 bg-white p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Invite link</div>
              <div className="mt-2 break-all text-sm text-slate-800">{createdInvite.inviteLink}</div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(createdInvite.inviteLink)}
                  className="inline-flex items-center rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                >
                  <Copy size={16} className="mr-2" />
                  Copy Link
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/master/admin-management')}
                  className="inline-flex items-center rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  Back to Admin List
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Create Another Admin
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
