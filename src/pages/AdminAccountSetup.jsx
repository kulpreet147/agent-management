import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { activateAccountInvite, getAccountInvite } from '../utils/admins.js'

function PasswordRule({ valid, label }) {
  return (
    <div className="flex items-center gap-2 text-[11px] font-medium">
      <CheckCircle2
        size={13}
        className={valid ? 'text-emerald-500' : 'text-slate-300'}
        fill={valid ? 'currentColor' : 'none'}
      />
      <span className={valid ? 'text-slate-700' : 'text-slate-400'}>{label}</span>
    </div>
  )
}

export default function AdminAccountSetup() {
  const { inviteToken } = useParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [invite, setInvite] = useState({
    loading: true,
    valid: false,
    admin: null,
    message: '',
  })

  const rules = useMemo(
    () => ({
      minLength: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    }),
    [password],
  )

  const canSubmit = Object.values(rules).every(Boolean) && password === confirmPassword

  useEffect(() => {
    let mounted = true

    async function verifyInvite() {
      if (!inviteToken) {
        setInvite({
          loading: false,
          valid: false,
          admin: null,
          message: 'Invitation link is missing or invalid.',
        })
        return
      }

      try {
        const response = await getAccountInvite('admin', inviteToken)
        if (!mounted) return

        const admin = response?.admin || response?.user || response

        const blocked = Boolean(admin?.isBlocked || admin?.blocked || admin?.status === 'blocked')
        if (!admin || blocked) {
          setInvite({
            loading: false,
            valid: false,
            admin: null,
            message: blocked ? 'Your access is denied by master admin.' : 'Invitation link is invalid or expired.',
          })
          return
        }

        setInvite({
          loading: false,
          valid: true,
          admin,
          message: '',
        })
      } catch (err) {
        if (!mounted) return
        setInvite({
          loading: false,
          valid: false,
          admin: null,
          message: err.message || 'Invitation link is invalid or expired.',
        })
      }
    }

    verifyInvite()

    return () => {
      mounted = false
    }
  }, [inviteToken])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!canSubmit) {
      setError('Please enter a strong password and confirm it.')
      return
    }

    if (!invite.valid || !inviteToken) {
      setError('Invitation link is invalid or expired.')
      return
    }

    setLoading(true)
    try {
      const updatedAdmin = await activateAccountInvite('admin', inviteToken, password)
      setSuccess(`Welcome, ${updatedAdmin.firstName}. Your account is ready.`)
      window.setTimeout(() => navigate('/login'), 1800)
    } catch (err) {
      setError(err.message || 'Unable to activate account.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="h-[88px] border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-full max-w-[920px] items-center justify-between px-6">
          <div className="text-sm font-bold text-brand-800">Administrator Setup</div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <ShieldCheck size={14} className="text-slate-400" />
            Secure Onboarding
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[920px] px-6 py-8">
        {invite.loading ? (
          <div className="mx-auto max-w-[420px] rounded-lg border border-slate-300 bg-white p-8 text-center shadow-card">
            <div className="text-sm font-bold text-slate-900">Checking secure invitation...</div>
            <div className="mt-2 text-xs text-slate-500">
              Please wait while we verify your setup link.
            </div>
          </div>
        ) : !invite.valid ? (
          <div className="mx-auto max-w-[420px] rounded-lg border border-red-200 bg-white p-8 text-center shadow-card">
            <div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-red-50 text-red-600">
              <AlertCircle size={22} />
            </div>
            <h1 className="mt-4 text-lg font-bold text-slate-950">Invitation Link Invalid</h1>
            <p className="mt-2 text-sm text-slate-500">
              {invite.message || 'This account setup link is no longer valid.'}
            </p>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="mt-5 inline-flex items-center rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200"
            >
              Return to login
            </button>
          </div>
        ) : (
          <div className="mx-auto max-w-[520px] rounded-2xl border border-slate-200 bg-white p-8 shadow-card">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-[11px] font-semibold tracking-wide text-brand-700">
              <ShieldCheck size={12} />
              Welcome
            </div>

            <h1 className="mt-4 text-3xl font-bold text-slate-900">
              Hello {invite.admin?.firstName || 'there'},
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Your master administrator has created your account. Please set a password to activate admin access.
            </p>

            {success && (
              <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="text-[11px] font-semibold tracking-wide text-slate-600">
                  EMAIL
                </label>
                <input
                  value={invite.admin?.email || ''}
                  disabled
                  readOnly
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-600 outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold tracking-wide text-slate-600">
                  CREATE PASSWORD
                </label>
                <div className="mt-1.5 relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter new password"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 pr-10 text-sm placeholder:text-slate-400 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold tracking-wide text-slate-600">
                  CONFIRM PASSWORD
                </label>
                <div className="mt-1.5 relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Confirm password"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 pr-10 text-sm placeholder:text-slate-400 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <PasswordRule valid={rules.minLength} label="At least 8 characters" />
                <PasswordRule valid={rules.uppercase} label="One uppercase letter" />
                <PasswordRule valid={rules.number} label="One number" />
                <PasswordRule valid={rules.special} label="One special character" />
                {confirmPassword && password !== confirmPassword && (
                  <span className="text-[11px] font-medium text-red-600">Passwords do not match.</span>
                )}
              </div>

              {error && (
                <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </div>
              )}
              {invite.message && !error && (
                <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {invite.message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !canSubmit}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-700 active:bg-brand-800 disabled:cursor-not-allowed disabled:bg-brand-300 text-white font-semibold py-3 transition shadow-sm shadow-brand-600/20"
              >
                {loading ? 'Activating account...' : 'Create Password & Continue'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}
