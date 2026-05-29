import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck
} from 'lucide-react'
import { activateAgentInvite, getAgentInvite } from '../utils/agents.js'

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

function Step({ number, label, active, complete }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold ${
          active || complete ? 'bg-brand-700 text-white' : 'bg-slate-200 text-slate-500'
        }`}
      >
        {complete ? <CheckCircle2 size={14} /> : number}
      </div>
      <span
        className={`text-xs font-bold ${
          active ? 'text-brand-800' : complete ? 'text-slate-700' : 'text-slate-400'
        }`}
      >
        {label}
      </span>
    </div>
  )
}

export default function AgentAccountSetup() {
  const { inviteToken } = useParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [status, setStatus] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [inviteState, setInviteState] = useState({
    loading: true,
    valid: false,
    agent: null,
    expiresAt: null,
    message: ''
  })

  const rules = useMemo(
    () => ({
      minLength: password.length >= 8,
      number: /\d/.test(password),
      uppercase: /[A-Z]/.test(password),
      special: /[^A-Za-z0-9]/.test(password)
    }),
    [password]
  )

  const strength = Object.values(rules).filter(Boolean).length
  const passwordsMatch = password && confirmPassword && password === confirmPassword
  const canActivate = Object.values(rules).every(Boolean) && passwordsMatch

  useEffect(() => {
    let isMounted = true

    if (!inviteToken) {
      setInviteState({
        loading: false,
        valid: false,
        agent: null,
        expiresAt: null,
        message: 'Invite link is missing or invalid.'
      })
      return
    }

    getAgentInvite(inviteToken)
      .then((data) => {
        if (!isMounted) return
        setInviteState({
          loading: false,
          valid: true,
          agent: data.agent,
          expiresAt: data.expiresAt,
          message: ''
        })
      })
      .catch((err) => {
        if (!isMounted) return
        setInviteState({
          loading: false,
          valid: false,
          agent: null,
          expiresAt: null,
          message: err.message || 'Invite link is invalid or expired.'
        })
      })

    return () => {
      isMounted = false
    }
  }, [inviteToken])

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!inviteState.valid || !inviteToken) {
      setStatus({
        type: 'error',
        message: 'This invite link is expired or invalid.'
      })
      return
    }

    if (!canActivate) {
      setStatus({
        type: 'error',
        message: 'Please create a strong password and confirm it before activating.'
      })
      return
    }

    setSubmitting(true)
    try {
      const result = await activateAgentInvite(inviteToken, password)
      setStatus({
        type: 'success',
        message: result.message || 'Account activated successfully.'
      })
      window.setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      setInviteState({
        loading: false,
        valid: false,
        agent: null,
        expiresAt: null,
        message: err.message || 'Invite link is invalid or expired.'
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="h-[88px] border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-full max-w-[920px] items-center justify-between px-6">
          <div className="text-sm font-bold text-brand-800">Agent Management</div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <ShieldCheck size={14} className="text-slate-400" />
            Secure Setup
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[920px] px-6 py-7">
        <div className="mx-auto mb-6 flex max-w-[520px] items-center justify-between">
          <Step number="1" label="Verify Email" complete />
          <div className="mx-4 h-px flex-1 bg-slate-200" />
          <Step number="2" label="Set Password" active />
          <div className="mx-4 h-px flex-1 bg-slate-200" />
          <Step number="3" label="Enable MFA" />
        </div>

        {inviteState.loading ? (
          <div className="mx-auto max-w-[370px] rounded-lg border border-slate-300 bg-white p-8 text-center shadow-card">
            <div className="text-sm font-bold text-slate-900">Checking secure link...</div>
            <div className="mt-2 text-xs text-slate-500">
              Please wait while we verify your invite.
            </div>
          </div>
        ) : !inviteState.valid ? (
          <div className="mx-auto max-w-[370px] rounded-lg border border-red-200 bg-white p-8 text-center shadow-card">
            <div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-red-50 text-red-600">
              <AlertCircle size={22} />
            </div>
            <h1 className="mt-4 text-lg font-bold text-slate-950">Invite Link Expired</h1>
            <p className="mt-2 text-sm text-slate-500">
              {inviteState.message || 'This account setup link is no longer valid.'}
            </p>
            <p className="mt-4 text-xs text-slate-400">
              Please contact your admin to send a new onboarding link.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mx-auto max-w-[370px] overflow-hidden rounded-lg border border-slate-300 bg-white shadow-card"
          >
            <section className="p-6">
              <h1 className="text-lg font-bold text-slate-950">Create Your Password</h1>
              <p className="mt-1 text-xs text-slate-500">
                Ensure {inviteState.agent?.email || 'your account'} is protected with a strong,
                unique password.
              </p>

              {status && (
                <div
                  className={`mt-4 rounded-md border px-3 py-2 text-xs font-semibold ${
                    status.type === 'success'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-red-200 bg-red-50 text-red-700'
                  }`}
                >
                  {status.message}
                </div>
              )}

              <label className="mt-5 block">
                <span className="mb-1.5 block text-xs font-bold text-slate-800">
                  New Password
                </span>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 pr-10 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((previous) => !previous)}
                    className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-slate-500 hover:bg-slate-100"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </label>

              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all ${
                    strength >= 4
                      ? 'bg-emerald-500'
                      : strength >= 2
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.max(strength, 1) * 25}%` }}
                />
              </div>
              <div className="mt-1 text-[11px] font-semibold text-red-500">
                {strength >= 4 ? 'Strong password' : 'Strong password required'}
              </div>

              <label className="mt-4 block">
                <span className="mb-1.5 block text-xs font-bold text-slate-800">
                  Confirm Password
                </span>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 pr-10 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                    placeholder="Confirm password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((previous) => !previous)}
                    className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-slate-500 hover:bg-slate-100"
                    title={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {confirmPassword && !passwordsMatch && (
                  <span className="mt-1.5 block text-xs font-medium text-red-600">
                    Passwords do not match.
                  </span>
                )}
              </label>

              <div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-2">
                <PasswordRule valid={rules.minLength} label="Min 8 chars" />
                <PasswordRule valid={rules.uppercase} label="One uppercase" />
                <PasswordRule valid={rules.number} label="One number" />
                <PasswordRule valid={rules.special} label="One special char" />
              </div>
            </section>

            <div className="bg-slate-50 px-6 pb-6">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-emerald-600 text-sm font-bold text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
              >
                {submitting ? 'Activating...' : 'Confirm & Activate Account'}
                <LockKeyhole size={15} />
              </button>
              <div className="mt-5 text-center text-[11px] text-slate-400">
                Having trouble setting up?{' '}
                <button type="button" className="font-semibold text-brand-700">
                  Contact Admin Support
                </button>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  )
}
