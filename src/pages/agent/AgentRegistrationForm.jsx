import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Bell, CircleHelp, FileText, LockKeyhole, Shield, Upload } from 'lucide-react'
import { auth } from '../../utils/auth.js'
import { updateAgentOnboardingStatus } from '../../utils/agents.js'

export default function AgentRegistrationForm() {
  const session = auth.get()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [creditReport, setCreditReport] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    try {
      await updateAgentOnboardingStatus(session.id, 3)
      auth.update({ onboardingStatus: 3 })
      navigate('/agent/sign-documents')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f8fc] text-slate-950">
      <AgentHeader initials="AS" />

      <main className="px-6 pb-8 pt-7">
        <section className="mx-auto max-w-[620px]">
          <div className="mb-5 text-center">
            <h1 className="text-xl font-bold tracking-tight">Complete Your Registration</h1>
            <p className="mt-1 text-[11px] text-slate-500">
              Provide your details to complete your professional agent profile for the platform.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-card">
            <div className="p-5">
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <Field label="Full Name">
                  <input className={inputClass} defaultValue={session?.name || 'Alexander Sterling'} />
                </Field>
                <Field label="Email Address">
                  <input className={inputClass} defaultValue={session?.email || 'alex.sterling@agency-portal.com'} />
                </Field>
                <Field label="Phone Number">
                  <input className={inputClass} defaultValue="+1 (555) 000-0000" />
                </Field>
                <Field label="Licence Type">
                  <div className="relative">
                    <input className={`${inputClass} pr-8`} defaultValue="Principal Broker (Class A)" />
                    <LockKeyhole size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  </div>
                </Field>
              </div>

              <Field label="Identification Document (Passport/Driver's Licence)">
                <label className="mt-1 flex h-[124px] cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-center hover:border-brand-300 hover:bg-brand-50">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-50 text-brand-700">
                    <Upload size={17} />
                  </div>
                  <div className="mt-2 text-[11px] font-bold text-slate-700">Click or drag file to upload</div>
                  <div className="mt-0.5 text-[10px] text-slate-500">PDF, JPG, or PNG (Max 10MB)</div>
                  <input type="file" className="hidden" />
                </label>
              </Field>

              <div className="mt-3 grid grid-cols-[1fr_1.45fr_90px] gap-3">
                <Field label="Credit Score">
                  <input className={inputClass} defaultValue="e.g. 750" />
                </Field>
                <Field label="Credit Report Upload">
                  <label className="flex h-8 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-300 bg-white text-[11px] font-semibold text-slate-700 hover:bg-slate-50">
                    <FileText size={12} />
                    Attach Report
                    <input
                      type="file"
                      className="hidden"
                      onChange={(event) => setCreditReport(event.target.files?.[0]?.name || '')}
                    />
                  </label>
                </Field>
                <div className="self-end truncate rounded-md border border-slate-300 bg-slate-50 px-2 py-2 text-center text-[10px] font-semibold text-slate-500">
                  {creditReport || 'No file selected'}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4">
              <button type="button" className="h-9 rounded-md border border-slate-300 bg-white px-4 text-[11px] font-bold text-slate-700">
                Save Draft
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-9 items-center gap-2 rounded-md bg-brand-700 px-4 text-[11px] font-bold text-white disabled:bg-brand-300"
              >
                {loading ? 'Saving...' : 'Save & Continue'}
                <ArrowRight size={13} />
              </button>
            </div>
          </form>

          <div className="mt-4 flex justify-center gap-8 text-[9px] font-bold uppercase tracking-wider text-slate-400">
            <span className="inline-flex items-center gap-1"><Shield size={11} /> Secure SSL Encryption</span>
            <span className="inline-flex items-center gap-1"><Shield size={11} /> GDPR Compliant Data Handling</span>
          </div>
          <footer className="mt-6 border-t border-slate-200 pt-4 text-center text-[10px] text-slate-400">
            <div className="mb-2 flex justify-center gap-6 font-semibold text-slate-500">
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
              <span>Contact Support</span>
            </div>
            © 2024 Agent Management Portal. All rights reserved.
          </footer>
        </section>
      </main>
    </div>
  )
}

export function AgentHeader({ initials = 'SJ', name = 'Sarah Johnson', subtitle = 'Agent In-Onboarding' }) {
  return (
    <header className="h-11 border-b border-slate-200 bg-white">
      <div className="flex h-full items-center px-8">
        <div className="text-xs font-bold text-slate-950">Agent Management</div>
        <div className="ml-auto flex items-center gap-4 text-slate-500">
          <Bell size={13} />
          <CircleHelp size={13} />
          <div className="text-right leading-tight">
            <div className="text-[10px] font-bold text-slate-900">{name}</div>
            <div className="text-[9px] text-slate-500">{subtitle}</div>
          </div>
          <div className="grid h-7 w-7 place-items-center rounded-full bg-slate-800 text-[10px] font-bold text-white">
            {initials}
          </div>
        </div>
      </div>
    </header>
  )
}

function Field({ label, children }) {
  return (
    <label className="block text-[10px] font-bold text-slate-700">
      {label}
      {children}
    </label>
  )
}

const inputClass =
  'mt-1 h-8 w-full rounded-md border border-slate-300 bg-slate-50 px-2.5 text-[11px] font-medium text-slate-700 outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100'
