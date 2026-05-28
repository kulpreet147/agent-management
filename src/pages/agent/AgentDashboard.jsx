import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCircle2, Circle, CircleHelp, Info, UserRound } from 'lucide-react'
import { auth } from '../../utils/auth.js'
import { updateAgentOnboardingStatus } from '../../utils/agents.js'

export default function AgentDashboard() {
  const session = auth.get()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(Number(session?.onboardingStatus || 4))
  const dashboardActive = status >= 5
  const displayName = session?.name || 'Sarah Johnson'

  const handleContinue = async () => {
    if (!session?.id || dashboardActive) return

    setLoading(true)
    try {
      await updateAgentOnboardingStatus(session.id, 5)
      auth.update({ onboardingStatus: 5 })
      setStatus(5)
      navigate('/agent/dashboard')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f8fc] text-slate-950">
      <header className="h-11 border-b border-slate-200 bg-white">
        <div className="flex h-full items-center px-8">
          <div className="text-xs font-bold text-slate-950">Agent Management</div>
          <div className="ml-auto flex items-center gap-4 text-slate-500">
            <Bell size={13} />
            <CircleHelp size={13} />
            <div className="text-right leading-tight">
              <div className="text-[10px] font-bold text-slate-900">{displayName}</div>
              <div className="text-[9px] text-slate-500">Agent In-Onboarding</div>
            </div>
            <div className="grid h-7 w-7 place-items-center rounded-full bg-slate-800 text-white">
              <UserRound size={14} />
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 py-7">
        <div className="text-center">
          <h1 className="text-xl font-bold tracking-tight">Welcome, {displayName}</h1>
          <p className="mt-1 text-xs text-slate-500">Complete your onboarding to get started.</p>
        </div>

        <section className="mx-auto mt-5 max-w-[440px] rounded-lg border border-slate-300 bg-white p-5 shadow-card">
          <div className="grid grid-cols-4 text-center">
            {['Account Setup', 'Registration', 'Documents', 'Profile & Training'].map((label, index) => {
              const complete = index < 3 || dashboardActive
              const active = index === 3 && !dashboardActive
              return (
                <div key={label} className="relative">
                  {index > 0 && (
                    <div className="absolute right-1/2 top-[12px] h-0.5 w-full -translate-x-3 bg-brand-700" />
                  )}
                  <div
                    className={`relative z-10 mx-auto grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold ${
                      complete
                        ? 'bg-brand-700 text-white'
                        : active
                          ? 'border-[5px] border-brand-700 bg-white text-brand-700'
                          : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {complete ? <CheckCircle2 size={13} fill="currentColor" /> : ''}
                  </div>
                  <div className="mt-2 text-[9px] font-bold text-slate-950">{label}</div>
                </div>
              )
            })}
          </div>

          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between text-[10px] font-bold text-slate-950">
              <span>Overall Progress</span>
              <span className="text-brand-700">60%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full w-[60%] rounded-full bg-brand-700" />
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2 rounded-md border border-brand-100 bg-brand-50 px-3 py-2 text-[10px] text-brand-900">
            <Info size={13} className="shrink-0" />
            Your documents have been approved. Please complete your profile to continue.
          </div>

          <div className="mt-5">
            <h2 className="text-sm font-bold text-slate-950">Onboarding Checklist</h2>
            <div className="mt-3 space-y-2">
              <ChecklistRow label="Account Created" status="Completed" complete />
              <ChecklistRow label="Registration Complete" status="Completed" complete />
              <ChecklistRow label="Documents Signed" status="Completed" complete />
              <ChecklistRow label="Profile Setup Pending" status={dashboardActive ? 'Completed' : 'In Progress'} complete={dashboardActive} icon="hourglass" />
              <ChecklistRow label="Training Not Started" status={dashboardActive ? 'Available' : 'Locked'} />
            </div>
          </div>

          <div className="mt-5 border-t border-slate-200 pt-3">
            <button
              type="button"
              onClick={handleContinue}
              disabled={loading || dashboardActive}
              className="h-10 w-full rounded-md bg-brand-700 text-[11px] font-bold text-white shadow-sm hover:bg-brand-800 disabled:bg-brand-300"
            >
              {dashboardActive ? 'Dashboard Active' : loading ? 'Continuing...' : 'Continue Onboarding  ->'}
            </button>
          </div>
        </section>

        <p className="mt-4 text-center text-[10px] text-slate-500">
          You will get access to leads and full portal once onboarding is complete.
        </p>
      </main>
    </div>
  )
}

function ChecklistRow({ label, status, complete = false, icon }) {
  return (
    <div className="flex h-9 items-center gap-3 rounded-md border border-slate-300 bg-slate-50 px-3">
      <div className={`grid h-4 w-4 place-items-center rounded-full ${complete ? 'bg-brand-700 text-white' : 'bg-white text-slate-600'}`}>
        {complete ? <CheckCircle2 size={11} fill="currentColor" /> : icon === 'hourglass' ? <span className="text-[10px]">H</span> : <Circle size={11} />}
      </div>
      <div className="flex-1 text-[11px] font-semibold text-slate-800">{label}</div>
      <div className={`text-[9px] font-bold uppercase ${complete || status === 'In Progress' ? 'text-brand-700' : 'text-slate-700'}`}>
        {status}
      </div>
    </div>
  )
}
