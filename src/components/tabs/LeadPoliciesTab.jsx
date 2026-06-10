import { useState, useEffect } from 'react'
import { Shield, Plus, Trash2, RefreshCw, X, Calendar, DollarSign } from 'lucide-react'
import { getPolicies, addPolicy, removePolicy } from '../../utils/persons.js'

export default function LeadPoliciesTab({ personId, lead }) {
  const [policies, setPolicies] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ policyNumber: '', policyType: '', carrier: '', product: '', effectiveDate: '', renewalDate: '', expiryDate: '', premium: '', coverageAmount: '', status: 'active' })

  const loadPolicies = () => {
    if (!personId) return
    setLoading(true)
    getPolicies(personId)
      .then((data) => setPolicies(Array.isArray(data) ? data : []))
      .catch(() => setPolicies([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadPolicies() }, [personId])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!form.policyNumber || !form.policyType) { alert('Policy number and type are required'); return }
    try {
      await addPolicy(personId, form)
      setShowModal(false)
      setForm({ policyNumber: '', policyType: '', carrier: '', product: '', effectiveDate: '', renewalDate: '', expiryDate: '', premium: '', coverageAmount: '', status: 'active' })
      loadPolicies()
    } catch (err) { alert(err.message || 'Failed to add policy') }
  }

  const handleRemove = async (policyId, policyNumber) => {
    if (!window.confirm(`Remove policy ${policyNumber}?`)) return
    try {
      await removePolicy(personId, policyId)
      loadPolicies()
    } catch (err) { alert(err.message || 'Failed to remove policy') }
  }

  const statusStyle = (s) =>
    s === 'active' ? 'bg-emerald-100 text-emerald-700' :
    s === 'lapsed' ? 'bg-red-100 text-red-700' :
    'bg-amber-100 text-amber-700'

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-blue-600" />
          <h3 className="text-sm font-bold text-slate-800">Policies</h3>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadPolicies} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><RefreshCw size={15} className="text-slate-500" /></button>
          <button onClick={() => setShowModal(true)} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 hover:bg-blue-700"><Plus size={14} /> Add Policy</button>
        </div>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-12"><RefreshCw size={18} className="animate-spin text-blue-600 mr-2" /><span className="text-sm text-slate-500">Loading policies...</span></div>
      ) : policies.length === 0 ? (
        <div className="py-12 text-center">
          <Shield size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm text-slate-500">No policies added yet.</p>
          <button onClick={() => setShowModal(true)} className="mt-3 text-sm text-blue-600 font-semibold hover:underline">Add a policy</button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                <th className="px-6 py-3">Policy #</th>
                <th className="px-6 py-3">Type / Carrier</th>
                <th className="px-6 py-3">Product</th>
                <th className="px-6 py-3">Effective</th>
                <th className="px-6 py-3">Premium</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {policies.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-semibold text-slate-800">{p.policyNumber}</td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-800">{p.policyType}</span>
                    {p.carrier && <span className="text-xs text-slate-500 block">{p.carrier}</span>}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{p.product || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {p.effectiveDate ? new Date(p.effectiveDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                    {p.premium ? `CHF ${Number(p.premium).toLocaleString()}` : 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${statusStyle(p.status)}`}>{p.status}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleRemove(p.id, p.policyNumber)} className="p-1.5 hover:bg-red-50 rounded transition-colors" title="Remove">
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(23, 28, 31, 0.6)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Add Policy</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-slate-100 rounded-full"><X size={18} className="text-slate-500" /></button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Policy Number *</label>
                  <input type="text" required value={form.policyNumber} onChange={e => setForm({ ...form, policyNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Policy Type *</label>
                  <select value={form.policyType} onChange={e => setForm({ ...form, policyType: e.target.value })} required
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white">
                    <option value="">Select...</option>
                    <option value="Term Life">Term Life</option>
                    <option value="Whole Life">Whole Life</option>
                    <option value="Critical Illness">Critical Illness</option>
                    <option value="Disability">Disability</option>
                    <option value="Health">Health</option>
                    <option value="Investment">Investment</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Carrier</label>
                  <input type="text" value={form.carrier} onChange={e => setForm({ ...form, carrier: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Product</label>
                  <input type="text" value={form.product} onChange={e => setForm({ ...form, product: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Effective</label>
                  <input type="date" value={form.effectiveDate} onChange={e => setForm({ ...form, effectiveDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Renewal</label>
                  <input type="date" value={form.renewalDate} onChange={e => setForm({ ...form, renewalDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Expiry</label>
                  <input type="date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Premium (CHF)</label>
                  <input type="number" step="0.01" value={form.premium} onChange={e => setForm({ ...form, premium: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Coverage (CHF)</label>
                  <input type="number" step="0.01" value={form.coverageAmount} onChange={e => setForm({ ...form, coverageAmount: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white">
                  <option value="active">Active</option>
                  <option value="lapsed">Lapsed</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-5 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100">Cancel</button>
                <button type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:opacity-90">Add Policy</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
