import { useState, useEffect } from 'react'
import { Users, Plus, Trash2, RefreshCw, X, User, Calendar, Mail, Phone, ChevronDown } from 'lucide-react'
import { getFamilyMembers, addFamilyMember, updateFamilyMember, removeFamilyMember } from '../../utils/persons.js'

export default function LeadFamilyTab({ personId, lead }) {
  const [familyMembers, setFamilyMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [form, setForm] = useState({ firstName: '', lastName: '', relationship: '', dateOfBirth: '', email: '', phone: '' })

  const loadFamily = () => {
    if (!personId) return
    setLoading(true)
    getFamilyMembers(personId)
      .then((data) => setFamilyMembers(Array.isArray(data) ? data : []))
      .catch(() => setFamilyMembers([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadFamily() }, [personId])

  const openAdd = () => {
    setEditingMember(null)
    setForm({ firstName: '', lastName: '', relationship: '', dateOfBirth: '', email: '', phone: '' })
    setShowModal(true)
  }

  const openEdit = (member) => {
    setEditingMember(member)
    setForm({
      firstName: member.firstName || '',
      lastName: member.lastName || '',
      relationship: member.relationship || '',
      dateOfBirth: member.dateOfBirth ? member.dateOfBirth.split('T')[0] : '',
      email: member.email || '',
      phone: member.phone || '',
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingMember) {
        await updateFamilyMember(personId, editingMember.id, form)
      } else {
        await addFamilyMember(personId, form)
      }
      setShowModal(false)
      loadFamily()
    } catch (err) {
      alert(err.message || 'Failed to save family member')
    }
  }

  const handleRemove = async (memberId, name) => {
    if (!window.confirm(`Remove ${name} from family members?`)) return
    try {
      await removeFamilyMember(personId, memberId)
      loadFamily()
    } catch (err) {
      alert(err.message || 'Failed to remove family member')
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-blue-600" />
          <h3 className="text-sm font-bold text-slate-800">Family Members</h3>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadFamily} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Refresh">
            <RefreshCw size={15} className="text-slate-500" />
          </button>
          <button onClick={openAdd} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 hover:bg-blue-700 transition-colors">
            <Plus size={14} /> Add Member
          </button>
        </div>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw size={18} className="animate-spin text-blue-600 mr-2" />
          <span className="text-sm text-slate-500">Loading family members...</span>
        </div>
      ) : familyMembers.length === 0 ? (
        <div className="py-12 text-center">
          <Users size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm text-slate-500">No family members added yet.</p>
          <button onClick={openAdd} className="mt-3 text-sm text-blue-600 font-semibold hover:underline">Add a family member</button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Relationship</th>
                <th className="px-6 py-3">Date of Birth</th>
                <th className="px-6 py-3">Contact</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {familyMembers.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <User size={14} className="text-blue-600" />
                      </div>
                      <span className="text-sm font-semibold text-slate-800">{m.firstName} {m.lastName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full">{m.relationship}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                      <Calendar size={13} className="text-slate-400" />
                      {m.dateOfBirth ? new Date(m.dateOfBirth).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3 text-xs text-slate-600">
                      {m.email && <span className="flex items-center gap-1"><Mail size={11} /> {m.email}</span>}
                      {m.phone && <span className="flex items-center gap-1"><Phone size={11} /> {m.phone}</span>}
                      {!m.email && !m.phone && <span className="text-slate-400">N/A</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(m)} className="p-1.5 hover:bg-slate-100 rounded transition-colors" title="Edit">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button onClick={() => handleRemove(m.id, `${m.firstName} ${m.lastName}`)} className="p-1.5 hover:bg-red-50 rounded transition-colors" title="Remove">
                        <Trash2 size={14} className="text-red-500" />
                      </button>
                    </div>
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
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">{editingMember ? 'Edit Family Member' : 'Add Family Member'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors">
                <X size={18} className="text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">First Name</label>
                  <input type="text" required value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Last Name</label>
                  <input type="text" required value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Relationship</label>
                <select value={form.relationship} onChange={e => setForm({ ...form, relationship: e.target.value })} required
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white">
                  <option value="">Select...</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Partner">Partner</option>
                  <option value="Child">Child</option>
                  <option value="Parent">Parent</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Date of Birth</label>
                <input type="date" value={form.dateOfBirth} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Phone</label>
                  <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-5 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors">Cancel</button>
                <button type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:opacity-90 transition-all">{editingMember ? 'Update' : 'Add'} Member</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
