import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Shield } from 'lucide-react'
import { useToast } from '../../hooks/useToast.js'
import { auth } from '../../utils/auth.js'
import { updateAgentOnboardingStatus, updateAgentRegistrationDetails } from '../../utils/agents.js'
import CommonHeader from '../../components/CommonHeader.jsx'

export default function AgentRegistrationForm() {
  const session = auth.get()
  const navigate = useNavigate()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [registrationDetails, setRegistrationDetails] = useState({
    city: '',
    residence: 'Owned',
    postalCode: '',
  })

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!registrationDetails.city.trim() || !registrationDetails.postalCode.trim()) {
      toast.warning('Please fill City and Postal Code.', 'Missing Details')
      return
    }
    setLoading(true)
    try {
      await updateAgentRegistrationDetails(session.id, registrationDetails)
      await updateAgentOnboardingStatus(session.id, 3)
      auth.update({ onboardingStatus: 3 })
      navigate('/agent/onboarding-progress')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f8fc] text-slate-950">
      <CommonHeader title="Agent Management" compact />

      <main className="px-6 pb-8 pt-7">
        <section className="mx-auto max-w-[620px]">
          <div className="mb-5 text-center">
            <h1 className="text-xl font-bold tracking-tight">Complete Your Registration</h1>
            <p className="mt-1 text-[11px] text-slate-500">
              Provide only the remaining personal details required to continue onboarding.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-card">
            <div className="p-5">
              <div className="mb-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
                Basic profile and document details were already provided by admin.
              </div>

              <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                <Field label="City">
                  <input
                    className={inputClass}
                    value={registrationDetails.city}
                    onChange={(event) =>
                      setRegistrationDetails((prev) => ({ ...prev, city: event.target.value }))
                    }
                    placeholder="e.g. Toronto"
                  />
                </Field>
                <Field label="Residence">
                  <select
                    className={inputClass}
                    value={registrationDetails.residence}
                    onChange={(event) =>
                      setRegistrationDetails((prev) => ({ ...prev, residence: event.target.value }))
                    }
                  >
                    <option value="Owned">Owned</option>
                    <option value="Rental">Rental</option>
                  </select>
                </Field>
                <Field label="Postal Code">
                  <input
                    className={inputClass}
                    value={registrationDetails.postalCode}
                    onChange={(event) =>
                      setRegistrationDetails((prev) => ({ ...prev, postalCode: event.target.value }))
                    }
                    placeholder="e.g. M5V 2L1"
                  />
                </Field>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4">
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
