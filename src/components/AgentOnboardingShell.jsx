import { CheckCircle2 } from 'lucide-react'
import CommonHeader from './CommonHeader.jsx'

const steps = [
  ['registration', 'Registration'],
  ['signing', 'Document Signing'],
  ['welcome', 'Welcome']
]

export default function AgentOnboardingShell({ activeStep, title, subtitle, children }) {
  const activeIndex = steps.findIndex(([key]) => key === activeStep)

  return (
    <div className="min-h-screen bg-slate-50">
      <CommonHeader title="Agent Management" compact />

      <main className="mx-auto max-w-[1180px] px-6 py-8">
        <div className="mb-7 text-center">
          <h1 className="text-2xl font-bold text-slate-950">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>

        <div className="mx-auto mb-8 flex max-w-[650px] items-center justify-center">
          {steps.map(([key, label], index) => {
            const complete = index < activeIndex
            const active = key === activeStep
            return (
              <div key={key} className="flex flex-1 items-center">
                <div className="flex items-center gap-2">
                  <div
                    className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${
                      active || complete ? 'bg-brand-700 text-white' : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {complete ? <CheckCircle2 size={15} /> : index + 1}
                  </div>
                  <span
                    className={`text-xs font-bold ${
                      active ? 'text-brand-800' : complete ? 'text-slate-700' : 'text-slate-400'
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {index < steps.length - 1 && <div className="mx-4 h-px flex-1 bg-slate-200" />}
              </div>
            )
          })}
        </div>

        {children}
      </main>
    </div>
  )
}
