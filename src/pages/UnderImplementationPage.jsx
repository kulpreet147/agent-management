export default function UnderImplementationPage({ title }) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl border border-slate-200 shadow-card p-8">
        <h1 className="text-2xl font-bold text-slate-900">{title || 'Under implementation'}</h1>
        <p className="mt-2 text-sm text-slate-500">
          This section is currently being built. UI and data integration will be added in the next iteration.
        </p>
      </div>
    </div>
  )
}

