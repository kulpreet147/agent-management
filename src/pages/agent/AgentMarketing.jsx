import { useState } from 'react'
import { BarChart3, FileText, Megaphone, Palette, Share2, Target } from 'lucide-react'
import AgentSidebar from '../../components/AgentSidebar.jsx'
import CommonHeader from '../../components/CommonHeader.jsx'
import { auth } from '../../utils/auth.js'

const marketingSections = [
  {
    icon: FileText,
    title: 'Approved Materials',
    description: 'Brochures, product one-pagers, email templates, and client-ready documents.',
    status: 'Library setup',
  },
  {
    icon: Palette,
    title: 'Brand Assets',
    description: 'Logo files, profile photo guidance, disclosure text, and approved visual assets.',
    status: 'Templates pending',
  },
  {
    icon: Share2,
    title: 'Campaigns',
    description: 'Reusable outreach campaigns for leads, renewals, referrals, and client education.',
    status: 'Planning',
  },
  {
    icon: BarChart3,
    title: 'Marketing Performance',
    description: 'Track campaign opens, lead source performance, and conversion impact.',
    status: 'Data integration',
  },
]

export default function AgentMarketing() {
  const session = auth.get()
  const agentName = session?.name || 'Agent'
  const initials = agentName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const [headerSearch, setHeaderSearch] = useState('')

  return (
    <div className="min-h-screen bg-[#eef3f8] text-slate-950">
      <div className="flex h-screen overflow-hidden">
        <AgentSidebar agentName={agentName} initials={initials} />

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <CommonHeader
            title="Marketing"
            searchValue={headerSearch}
            onSearchChange={setHeaderSearch}
            searchPlaceholder="Search marketing resources..."
            compact
          />

          <div className="flex-1 overflow-y-auto p-6">
            <div className="mx-auto max-w-6xl space-y-5">
              <div>
                <div className="text-xs font-semibold text-slate-500">Agents &gt; Marketing</div>
                <h1 className="mt-1 text-2xl font-bold tracking-tight">Marketing Center</h1>
              </div>

              <section className="grid gap-4 md:grid-cols-3">
                <Metric icon={Megaphone} label="Campaigns" value="0 Active" />
                <Metric icon={FileText} label="Materials" value="Coming Soon" />
                <Metric icon={Target} label="Lead Sources" value="Connected" />
              </section>

              <section className="grid gap-4 md:grid-cols-2">
                {marketingSections.map((section) => {
                  const Icon = section.icon
                  return (
                    <div key={section.title} className="rounded-lg border border-slate-300 bg-white p-5 shadow-card">
                      <div className="flex items-start gap-4">
                        <div className="grid h-10 w-10 place-items-center rounded-md bg-blue-50 text-blue-700">
                          <Icon size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <h2 className="text-base font-bold text-slate-900">{section.title}</h2>
                            <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-500">
                              {section.status}
                            </span>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-slate-500">{section.description}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-slate-300 bg-white p-4 shadow-card">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-blue-50 text-blue-700">
          <Icon size={18} />
        </div>
        <div>
          <div className="text-xs font-semibold text-slate-500">{label}</div>
          <div className="text-base font-bold text-slate-950">{value}</div>
        </div>
      </div>
    </div>
  )
}
