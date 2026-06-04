import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { auth } from '../utils/auth.js'

export default function PasswordReset() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(true)
  const [validToken, setValidToken] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setError('Invalid password reset link.')
        setValidating(false)
        return
      }

      try {
        await auth.validatePasswordResetToken(token)
        setValidToken(true)
      } catch (err) {
        setError(err.message || 'Reset link is invalid or expired.')
      } finally {
        setValidating(false)
      }
    }

    validateToken()
  }, [token])

  const rules = useMemo(
    () => ({
      minLength: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    }),
    [password],
  )

  const passwordsMatch = password && confirmPassword && password === confirmPassword
  const canSubmit = Object.values(rules).every(Boolean) && passwordsMatch

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!canSubmit) {
      setError('Please enter a strong password and confirm it.')
      return
    }

    if (!token) {
      setError('Invalid password reset link.')
      return
    }

    setLoading(true)
    try {
      await auth.resetPassword({ token, password })
      setMessage('Password updated successfully. Redirecting to login...')
      window.setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      setError(err.message || 'Unable to reset password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-slate-50">
      <div className="flex flex-col px-8 sm:px-14 py-10">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-brand-600 text-white grid place-items-center shadow-sm">
            <Eye size={18} />
          </div>
          <span className="text-xl font-bold text-brand-700 tracking-tight">Insurely</span>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-soft border border-slate-100 p-8">
            <h1 className="mt-5 text-3xl font-bold text-slate-900">Reset password</h1>
            <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
              Use the secure link you received by email to set a new password.
            </p>

            {validating ? (
              <div className="mt-8 text-sm text-slate-600">Verifying reset link...</div>
            ) : validToken ? (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="text-[11px] font-semibold tracking-wide text-slate-600">
                    NEW PASSWORD
                  </label>
                  <div className="mt-1.5 relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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
                    CONFIRM NEW PASSWORD
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-sm placeholder:text-slate-400 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition"
                  />
                </div>

                <div className="grid gap-2 text-[12px] text-slate-600">
                  <span className={rules.minLength ? 'text-slate-700' : 'text-red-600'}>
                    • At least 8 characters
                  </span>
                  <span className={rules.uppercase ? 'text-slate-700' : 'text-red-600'}>
                    • One uppercase letter
                  </span>
                  <span className={rules.number ? 'text-slate-700' : 'text-red-600'}>
                    • One number
                  </span>
                  <span className={rules.special ? 'text-slate-700' : 'text-red-600'}>
                    • One special character
                  </span>
                  {confirmPassword && !passwordsMatch ? (
                    <span className="text-red-600">Passwords do not match.</span>
                  ) : null}
                </div>

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    {error}
                  </div>
                )}
                {message && (
                  <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !canSubmit}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-700 active:bg-brand-800 disabled:cursor-not-allowed disabled:bg-brand-300 text-white font-semibold py-3 transition shadow-sm shadow-brand-600/20"
                >
                  {loading ? 'Resetting password...' : 'Reset password'}
                </button>
              </form>
            ) : (
              <div className="mt-6 space-y-4 text-sm text-slate-600">
                <p>{error || 'This password reset link is no longer valid.'}</p>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Return to login
                </button>
              </div>
            )}
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
            <h2 className="text-4xl font-bold leading-tight">Security-first password recovery</h2>
            <p className="mt-4 text-white/75 leading-relaxed">
              Use the secure link from your inbox to choose a new password. The link expires after 10 minutes.
            </p>
          </div>
          <div className="text-[11px] text-white/50 tracking-wide">(c) 2026 Insurely TECHNOLOGIES INC. - ALL RIGHTS RESERVED.</div>
        </div>
      </div>
    </div>
  )
}
