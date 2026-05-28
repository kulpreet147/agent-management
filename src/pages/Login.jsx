import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Shield,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  ArrowRight,
  Lock
} from 'lucide-react'
import { auth } from '../utils/auth.js'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [keepActive, setKeepActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Please enter both credentials.')
      return
    }

    setLoading(true)
    try {
      const session = await auth.login({ email, password })
      navigate(session.role === 'master_admin' ? '/master' : '/admin')
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-slate-50">
      <div className="flex flex-col px-8 sm:px-14 py-10">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-brand-600 text-white grid place-items-center shadow-sm">
            <Shield size={18} />
          </div>
          <span className="text-xl font-bold text-brand-700 tracking-tight">AgentFlow</span>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-soft border border-slate-100 p-8">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-brand-700 bg-brand-50 border border-brand-100 rounded-full px-2.5 py-1">
              <Lock size={12} />
              AUTHORIZED PERSONNEL ONLY
            </div>

            <h1 className="mt-5 text-3xl font-bold text-slate-900">Login</h1>
            <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
              Enter your enterprise credentials to access the secure administrative control center.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="text-[11px] font-semibold tracking-wide text-slate-600">
                  WORK EMAIL
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@agentflow.io"
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

              <div className="flex items-center justify-between text-sm">
                <label className="inline-flex items-center gap-2 text-slate-600">
                  <input
                    type="checkbox"
                    checked={keepActive}
                    onChange={(e) => setKeepActive(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  Keep session active
                </label>
                <a href="#" className="text-brand-600 font-semibold hover:underline">
                  Account Recovery
                </a>
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
              AgentFlow delivers a sophisticated, bank-grade infrastructure designed for managing
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
            (c) 2024 AGENTFLOW TECHNOLOGIES INC. - ALL RIGHTS RESERVED.
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
