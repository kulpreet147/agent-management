import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  Shield,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  ArrowRight,
  Lock
} from 'lucide-react'
import { ClearAuthMessage, LoginAsync, PasswordRecoveryAsync } from '../redux/authSlice.js'
import { auth } from '../utils/auth.js'
import { APP_VERSION } from '../version.js'

export default function Login() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loginAsAgent, setLoginAsAgent] = useState(false)
  const [recoverySent, setRecoverySent] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [validationError, setValidationError] = useState('')
  const [logoutNotice, setLogoutNotice] = useState(null)
  const { loginLoading, recoveryLoading, recoveryMessage, loginError, recoveryError } = useSelector((state) => state.auth)
  const loading = loginLoading
  const sendingRecovery = recoveryLoading
  const error = validationError || loginError || recoveryError || logoutNotice?.message

  useEffect(() => {
    if (resendCooldown <= 0) return undefined

    const timer = window.setInterval(() => {
      setResendCooldown((value) => (value > 0 ? value - 1 : 0))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [resendCooldown])

  useEffect(() => {
    dispatch(ClearAuthMessage())
    setValidationError('')
    setRecoverySent(false)
  }, [dispatch, loginAsAgent])

  useEffect(() => {
    const notice = auth.consumeLogoutNotice()
    if (notice) {
      setLogoutNotice(notice)
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    dispatch(ClearAuthMessage())
    setValidationError('')
    setLogoutNotice(null)

    if (!email || !password) {
      setValidationError('Please enter both credentials.')
      return
    }

    try {
      const session = await dispatch(
        LoginAsync({
          email,
          password,
          loginAs: loginAsAgent ? 'agent' : 'admin',
        }),
      )

      if (!session?.role) {
        return
      }

      if (session.role === 'agent') {
        const status = Number(session.onboardingStatus || 2)
        if (status >= 5) navigate('/agent/dashboard')
        else if (status >= 4) navigate('/agent/onboarding-progress')
        else if (status >= 3) navigate('/agent/sign-documents')
        else navigate('/agent/registration')
        return
      }

      navigate(session.role === 'master_admin' ? '/master' : '/admin')
    } catch {
      return
    }
  }

  const handlePasswordRecovery = async () => {
    dispatch(ClearAuthMessage())
    setValidationError('')
    setLogoutNotice(null)

    if (resendCooldown > 0) {
      return
    }

    if (!email) {
      setValidationError('Please enter your registered email first.')
      return
    }

    try {
      const response = await dispatch(
        PasswordRecoveryAsync({
          email,
          loginAs: loginAsAgent ? 'agent' : 'admin',
        }),
      )
      if (response?.message || recoveryMessage) {
        setRecoverySent(true)
        setResendCooldown(60)
      }
    } catch { }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-slate-50">
      <div className="flex flex-col px-8 sm:px-14 py-10">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-brand-600 text-white grid place-items-center shadow-sm">
            <Shield size={18} />
          </div>
          <span className="text-xl font-bold text-brand-700 tracking-tight">Insurely</span>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-soft border border-slate-100 p-8">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-brand-700 bg-brand-50 border border-brand-100 rounded-full px-2.5 py-1">
              <Lock size={12} />
              AUTHORIZED PERSONNEL ONLY
            </div>

            <h1 className="mt-5 text-3xl font-bold text-slate-900">Login</h1>
            <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
              Enter your credentials to access the secure management portal.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <button
                type="button"
                onClick={() => setLoginAsAgent((value) => !value)}
                className={`flex w-full items-center justify-between rounded-xl border p-1 text-sm font-semibold transition ${loginAsAgent ? 'border-brand-200 bg-brand-50' : 'border-slate-200 bg-slate-50'
                  }`}
              >
                <span
                  className={`flex-1 rounded-lg py-2 text-center ${!loginAsAgent ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'
                    }`}
                >
                  Admin
                </span>
                <span
                  className={`flex-1 rounded-lg py-2 text-center ${loginAsAgent ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'
                    }`}
                >
                  Login as Agent
                </span>
              </button>

              <div>
                <label className="text-[11px] font-semibold tracking-wide text-slate-600">
                  {loginAsAgent ? 'AGENT EMAIL' : 'WORK EMAIL'}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={loginAsAgent ? 'agent@email.com' : 'name@agentflow.io'}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-sm placeholder:text-slate-400 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold tracking-wide text-slate-600">
                  SECURITY PASSWORD
                </label>
                <div className="mt-1.5 relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 pr-10 text-sm placeholder:text-slate-400 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={handlePasswordRecovery}
                    disabled={sendingRecovery || resendCooldown > 0}
                    className="text-brand-600 font-semibold hover:underline disabled:opacity-50"
                  >
                    {sendingRecovery
                      ? 'Sending recovery link...'
                      : resendCooldown > 0
                        ? `Resend in ${resendCooldown}s`
                        : recoverySent
                          ? 'Resend recovery link'
                          : 'Account Recovery'}
                  </button>
                  {sendingRecovery ? (
                    <span className="text-slate-500">Sending link...</span>
                  ) : recoverySent ? (
                    <span className="text-slate-500">
                      Link sent. Check your email.
                      {resendCooldown > 0 ? ` You can resend in ${resendCooldown}s.` : ''}
                    </span>
                  ) : null}
                </div>
                {recoveryMessage && (
                  <div className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                    {recoveryMessage}
                  </div>
                )}
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-700 active:bg-brand-800 disabled:cursor-not-allowed disabled:bg-brand-300 text-white font-semibold py-3 transition shadow-sm shadow-brand-600/20"
              >
                {loading ? 'Signing in...' : 'Continue to Dashboard'}
                <ArrowRight size={18} />
              </button>
            </form>
          </div>
        </div>

        <div className="flex items-center gap-6 text-[11px] text-slate-400 tracking-wide font-medium">
          <span>PRIVACY POLICY</span>
          <span>TERMS OF USE</span>
          <span>GLOBAL SUPPORT</span>
          <span className="ml-auto rounded bg-slate-200 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500">
            v{APP_VERSION}
          </span>
        </div>
      </div>

      <div className="hidden lg:block relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, #1d2f7d 0%, #1a36d8 55%, #152055 100%)'
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.12] mix-blend-overlay"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 30%, white 0.5px, transparent 0.6px), radial-gradient(circle at 70% 80%, white 0.5px, transparent 0.6px)',
            backgroundSize: '40px 40px, 60px 60px'
          }}
        />
        <div className="relative h-full flex flex-col justify-between p-14 text-white">
          <div className="h-0.5 w-14 bg-white/60 rounded-full" />

          <div className="max-w-md">
            <h2 className="text-4xl font-bold leading-tight">
              Enterprise Security,
              <br />
              Redefined.
            </h2>
            <p className="mt-4 text-white/75 leading-relaxed">
              Insurely delivers a sophisticated, bank-grade infrastructure designed for managing
              complex global insurance ecosystems with absolute precision.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <FeatureCard
                icon={<ShieldCheck size={18} />}
                title="AES-256 Protocol"
                body="Advanced military-grade data encryption standards for every transaction."
              />
              <FeatureCard
                icon={<KeyRound size={18} />}
                title="Dynamic MFA"
                body="Multi-layered adaptive authentication to safeguard critical access points."
              />
            </div>
          </div>

          <div className="text-[11px] text-white/50 tracking-wide">
            © {new Date().getFullYear()} Insurely TECHNOLOGIES INC. - ALL RIGHTS RESERVED.
          </div>
        </div>
      </div>
    </div>
  )
}

function FeatureCard({ icon, title, body }) {
  return (
    <div className="rounded-xl bg-white/10 border border-white/15 backdrop-blur-sm p-4">
      <div className="h-8 w-8 rounded-lg bg-white/15 grid place-items-center text-white">
        {icon}
      </div>
      <div className="mt-3 text-sm font-semibold">{title}</div>
      <div className="mt-1 text-[12px] text-white/70 leading-relaxed">{body}</div>
    </div>
  )
}
