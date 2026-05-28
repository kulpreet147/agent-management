import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CircleHelp, FileText, PenLine, Search, Send, Trash2 } from 'lucide-react'
import { auth } from '../../utils/auth.js'
import { updateAgentOnboardingStatus } from '../../utils/agents.js'

const documents = [
  ['Advisor Contract', 'Pending'],
  ['Code of Conduct', 'Pending'],
  ['Privacy Policy', 'Not started']
]

export default function AgentDocumentSigning() {
  const session = auth.get()
  const navigate = useNavigate()
  const [signature, setSignature] = useState('')
  const [agree, setAgree] = useState(false)
  const [loading, setLoading] = useState(false)
  const canSubmit = signature.trim() && agree

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!canSubmit) return

    setLoading(true)
    try {
      await updateAgentOnboardingStatus(session.id, 4)
      auth.update({ onboardingStatus: 4 })
      navigate('/agent/dashboard')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-[#f4f8fc] text-slate-950">
      <div className="h-11 border-b border-slate-200 bg-white">
        <div className="flex h-full items-center px-6">
          <div className="text-xs font-bold text-slate-950">Agent Management</div>
          <div className="mx-4 h-4 w-px bg-slate-200" />
          <div className="text-[10px] font-semibold text-slate-500">Document Signing</div>
          <div className="relative ml-6 w-[360px]">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="h-7 w-full rounded-md border border-slate-300 bg-slate-50 pl-8 pr-2 text-[10px]" placeholder="Search documents..." />
          </div>
          <div className="ml-auto flex items-center gap-4 text-slate-500">
            <Bell size={13} />
            <CircleHelp size={13} />
            <div className="grid h-7 w-7 place-items-center rounded-full bg-brand-700 text-[10px] font-bold text-white">
              AD
            </div>
          </div>
        </div>
      </div>

      <main className="flex min-h-0 flex-1">
        <aside className="relative w-[178px] shrink-0 border-r border-slate-200 bg-white">
          <div className="p-4">
            <h2 className="text-sm font-bold">Your Documents</h2>
            <p className="mt-1 text-[10px] text-slate-500">Review and sign your contracts.</p>
          </div>
          <div className="px-2">
            {documents.map(([name, status], index) => (
              <button
                key={name}
                type="button"
                className={`mb-2 flex w-full items-center gap-2 rounded-md px-3 py-3 text-left ${
                  index === 0 ? 'border border-brand-200 bg-brand-50' : 'hover:bg-slate-50'
                }`}
              >
                <span className="flex-1">
                  <span className="block text-[11px] font-bold text-slate-800">{name}</span>
                  <span className="block text-[9px] text-slate-500">{status}</span>
                </span>
                <FileText size={12} className={index === 0 ? 'text-brand-700' : 'text-slate-500'} />
              </button>
            ))}
          </div>
          <div className="absolute bottom-3 left-3 right-3 rounded-md bg-slate-50 p-3">
            <div className="text-[10px] font-bold text-slate-700">Completion Progress</div>
            <div className="mt-2 h-1.5 rounded-full bg-slate-200">
              <div className="h-full w-1/3 rounded-full bg-brand-700" />
            </div>
            <div className="mt-2 text-[9px] text-slate-500">1 of 3 documents signed</div>
          </div>
        </aside>

        <form onSubmit={handleSubmit} className="flex min-w-0 flex-1 flex-col">
          <section className="min-h-0 flex-1 overflow-y-auto px-8 py-5">
            <div className="mx-auto min-h-[500px] max-w-[630px] bg-white px-12 py-9 shadow-soft">
              <div className="mb-8 flex justify-between text-[8px] font-bold text-slate-400">
                <span>LEGAL DOCUMENT</span>
                <span>CONTRACT ID: ACT-884-2024</span>
              </div>
              <h1 className="text-center text-base font-bold underline">Independent Advisor Agreement</h1>
              <Paragraph title="1. Scope of Services">
                This Advisor shall provide strategic consulting, administrative support, and market
                analysis as specifically detailed in Exhibit A attached hereto.
              </Paragraph>
              <Paragraph title="2. Compensation & Billing">
                Advisor shall be compensated at the rates specified in the fee schedule. Invoices must
                be submitted monthly via the Agent Portal.
              </Paragraph>
              <Paragraph title="3. Confidentiality & Non-Disclosure">
                Advisor acknowledges that they will have access to confidential information, including
                trade secrets, customer data, and proprietary algorithms.
              </Paragraph>
            </div>
          </section>

          <section className="shrink-0 border-t border-slate-200 bg-white px-8 py-4">
            <div className="mx-auto grid max-w-[760px] grid-cols-[1fr_240px] gap-5">
              <div>
                <div className="mb-2 inline-flex h-6 items-center gap-1 rounded-full bg-brand-700 px-3 text-[10px] font-bold text-white">
                  <PenLine size={11} />
                  Type
                </div>
                <input
                  value={signature}
                  onChange={(event) => setSignature(event.target.value)}
                  className="h-16 w-full rounded-md border border-slate-300 text-center font-serif text-base italic outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  placeholder="Type your full name..."
                />
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={!canSubmit || loading}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-emerald-600 text-[11px] font-bold text-white disabled:bg-emerald-300"
                >
                  <Send size={13} />
                  {loading ? 'Submitting...' : 'Submit Signature'}
                </button>
                <button
                  type="button"
                  onClick={() => setSignature('')}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white text-[11px] font-bold text-slate-700"
                >
                  <Trash2 size={13} />
                  Clear
                </button>
                <label className="flex items-start gap-1.5 text-[9px] text-slate-500">
                  <input type="checkbox" checked={agree} onChange={(event) => setAgree(event.target.checked)} className="mt-0.5" />
                  I agree that this is a legally binding electronic signature.
                </label>
              </div>
            </div>
          </section>
        </form>
      </main>
    </div>
  )
}

function Paragraph({ title, children }) {
  return (
    <section className="mt-7">
      <h2 className="text-sm font-bold">{title}</h2>
      <p className="mt-3 text-xs leading-6 text-slate-600">{children}</p>
    </section>
  )
}
