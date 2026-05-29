import {
  Bell,
  CalendarClock,
  CheckCircle2,
  CircleHelp,
  FileText,
  Search,
} from 'lucide-react'
import { auth } from '../../utils/auth.js'
import AgentSidebar from '../../components/AgentSidebar.jsx'

const documents = [
  { name: 'Advisor Contract', updated: 'Signed today', status: 'Approved', action: 'View' },
  { name: 'Code of Conduct', updated: 'Signed today', status: 'Approved', action: 'Download' },
  { name: 'Privacy Agreement', updated: 'Signed today', status: 'Approved', action: 'View' }
]

const nextTasks = [
  { label: 'Complete profile verification', status: 'Ready' },
  { label: 'Start compliance training', status: 'Next' },
  { label: 'Review carrier appointment', status: 'Pending' }
]

export default function AgentDashboard() {
  const session = auth.get()
  const agentName = session?.name || 'Sarah Johnson'
  const initials = agentName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="min-h-screen bg-[#eef3f8] text-slate-950">
      <div className="flex h-screen overflow-hidden">
        <AgentSidebar agentName={agentName} initials={initials} />

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex h-14 shrink-0 items-center border-b border-slate-200 bg-white px-6">
            <div className="text-sm font-bold">Agent Dashboard</div>
            <div className="relative ml-8 w-72">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="Search documents, training..."
                className="h-8 w-full rounded-md border border-slate-300 bg-slate-50 pl-9 pr-3 text-[11px] outline-none focus:border-brand-500 focus:bg-white"
              />
            </div>
            <div className="ml-auto flex items-center gap-4 text-slate-500">
              <Bell size={15} />
              <CircleHelp size={15} />
              <div className="grid h-8 w-8 place-items-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                {initials}
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="mx-auto max-w-6xl space-y-5">
              <div>
                <div className="text-[11px] font-semibold text-slate-500">Agents &gt; Dashboard</div>
                <h1 className="mt-1 text-2xl font-bold tracking-tight">Welcome back, {agentName}</h1>
              </div>

              <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Metric icon={CheckCircle2} label="Onboarding Status" value="Active" tone="emerald" />
                <Metric icon={FileText} label="Signed Documents" value="3 Files" tone="blue" />
                <Metric icon={CalendarClock} label="Next Step" value="Training" tone="amber" />
              </section>

              <section className="rounded-lg border border-slate-300 bg-white shadow-card">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <div>
                    <h2 className="text-sm font-bold">Document Review</h2>
                    <p className="mt-0.5 text-[10px] text-slate-500">Your submitted documents are approved and ready.</p>
                  </div>
                  <span className="rounded bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase text-emerald-700">
                    Approved
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-[11px]">
                    <thead className="bg-slate-50 text-[9px] uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-5 py-3 font-bold">Document Name</th>
                        <th className="px-5 py-3 font-bold">Updated</th>
                        <th className="px-5 py-3 font-bold">Status</th>
                        <th className="px-5 py-3 text-right font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {documents.map((document) => (
                        <tr key={document.name} className="hover:bg-slate-50">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="grid h-8 w-8 place-items-center rounded-md bg-brand-50 text-brand-700">
                                <FileText size={15} />
                              </div>
                              <div>
                                <div className="font-bold text-slate-900">{document.name}</div>
                                <div className="text-[10px] text-slate-500">Agent onboarding document</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-slate-600">{document.updated}</td>
                          <td className="px-5 py-4">
                            <span className="rounded bg-emerald-50 px-2 py-1 text-[9px] font-bold uppercase text-emerald-700">
                              {document.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-[10px] font-bold text-slate-700 hover:bg-slate-50">
                              {document.action}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-lg border border-slate-300 bg-white p-5 shadow-card">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-bold">Onboarding Progress</h2>
                    <span className="text-[10px] font-bold text-brand-700">80%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full w-4/5 rounded-full bg-brand-600" />
                  </div>
                  <div className="mt-3 text-[10px] text-slate-500">Documents complete. Training and final profile review remain.</div>
                </div>

                <div className="rounded-lg border border-slate-300 bg-white p-5 shadow-card">
                  <h2 className="text-sm font-bold">Next Tasks</h2>
                  <div className="mt-4 space-y-2">
                    {nextTasks.map((task) => (
                      <div key={task.label} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
                        <span className="text-[11px] font-semibold text-slate-700">{task.label}</span>
                        <span className="text-[10px] font-bold text-slate-500">{task.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function Metric({ icon: Icon, label, value, tone }) {
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-brand-50 text-brand-700',
    amber: 'bg-amber-50 text-amber-700'
  }

  return (
    <div className="rounded-lg border border-slate-300 bg-white p-4 shadow-card">
      <div className="flex items-center gap-3">
        <div className={`grid h-10 w-10 place-items-center rounded-full ${tones[tone]}`}>
          <Icon size={18} />
        </div>
        <div>
          <div className="text-[10px] font-semibold text-slate-500">{label}</div>
          <div className="text-sm font-bold text-slate-950">{value}</div>
        </div>
      </div>
    </div>
  )
}
