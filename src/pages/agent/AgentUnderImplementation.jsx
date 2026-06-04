import { useState } from 'react'
import AgentSidebar from '../../components/AgentSidebar.jsx'
import CommonHeader from '../../components/CommonHeader.jsx'
import { auth } from '../../utils/auth.js'

export default function AgentUnderImplementation({ title, breadcrumb }) {
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
    <div className="min-h-screen bg-[#eef3f8] text-slate-1500">
      <div className="flex h-screen overflow-hidden">
        <AgentSidebar agentName={agentName} initials={initials} />

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <CommonHeader
            title={title || 'Under implementation'}
            searchValue={headerSearch}
            onSearchChange={setHeaderSearch}
            searchPlaceholder="Search..."
            compact
          />

          <div className="flex-1 overflow-y-auto p-6">
            <div className="mx-auto max-w-6xl space-y-5">
              <div>
                <div className="text-xs font-semibold text-slate-500">{breadcrumb || `Agents > ${title}`}</div>
                <h1 className="mt-1 text-2xl font-bold tracking-tight">{title || 'Under implementation'}</h1>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-card">
                <h2 className="text-xl font-bold text-slate-900">Under implementation</h2>
                <p className="mt-2 text-sm text-slate-500">
                  This section is currently being built. UI and data integration will be added in the next iteration.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
