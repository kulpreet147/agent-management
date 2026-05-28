import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import AgentOnboardingShell from '../../components/AgentOnboardingShell.jsx'
import { auth } from '../../utils/auth.js'
import { updateAgentOnboardingStatus } from '../../utils/agents.js'

export default function AgentWelcome() {
  const session = auth.get()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleContinue = async () => {
    setLoading(true)
    try {
      await updateAgentOnboardingStatus(session.id, 5)
      auth.update({ onboardingStatus: 5 })
      navigate('/agent/dashboard')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AgentOnboardingShell
      activeStep="welcome"
      title="Welcome, your onboarding is ready"
      subtitle="Your registration and document signing steps are complete."
    >
      <div className="mx-auto max-w-[520px] rounded-lg border border-slate-300 bg-white p-8 text-center shadow-card">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 size={30} />
        </div>
        <h2 className="mt-5 text-xl font-bold text-slate-950">Registration Successful</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Your account setup, registration details, and signed documents have been saved.
          Continue to your onboarding dashboard to track remaining items.
        </p>
        <button
          type="button"
          onClick={handleContinue}
          disabled={loading}
          className="mt-7 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-brand-700 text-sm font-bold text-white disabled:bg-brand-300"
        >
          {loading ? 'Opening dashboard...' : 'Continue Onboarding'}
          <ArrowRight size={16} />
        </button>
      </div>
    </AgentOnboardingShell>
  )
}
