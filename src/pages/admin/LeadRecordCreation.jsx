import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createLead } from '../../utils/leads.js'
import { getAgents } from '../../utils/agents.js'
import { notify } from '../../utils/notify.js'
import {
  ArrowLeft,
  User,
  UserCheck,
  List,
  Users,
  UserPlus,
  Trash2,
  Save,
  Info,
  AlertTriangle,
  Check,
  Smile,
  X
} from 'lucide-react'

const today = new Date().toISOString().split('T')[0]

const priorityStyles = {
  HOT: { default: 'border-red-100 bg-red-50 text-red-700 hover:border-red-500', active: 'border-red-500 bg-red-50 text-red-700', badge: 'bg-red-600' },
  WARM: { default: 'border-orange-100 bg-orange-50 text-orange-700 hover:border-orange-500', active: 'border-orange-500 bg-orange-50 text-orange-700', badge: 'bg-orange-600' },
  COLD: { default: 'border-blue-100 bg-blue-50 text-blue-700 hover:border-blue-500', active: 'border-blue-500 bg-blue-50 text-blue-700', badge: 'bg-blue-600' }
}

const PRIORITY_KEYS = ['HOT', 'WARM', 'COLD']

export default function LeadRecordCreation() {
  const navigate = useNavigate()
  const [priority, setPriority] = useState('')
  const [showAgentPicker, setShowAgentPicker] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [availableAgents, setAvailableAgents] = useState([])
  const [agentsLoading, setAgentsLoading] = useState(true)
  const [agents, setAgents] = useState([])

  useEffect(() => {
    setAgentsLoading(true)
    getAgents()
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.agents || [])
        const active = list.filter(
          (a) => a.status === 'active' && a.accountActivationStatus === 1
        )
        setAvailableAgents(active)
      })
      .catch((err) => {
        console.error('Failed to fetch agents:', err)
        setAvailableAgents([])
      })
      .finally(() => setAgentsLoading(false))
  }, [])

  const totalSplit = useMemo(() => agents.reduce((sum, a) => sum + a.split, 0), [agents])
  const isBalanced = totalSplit === 100
  const unassigned = availableAgents.filter(
    (a) => !agents.some((assigned) => assigned.agentId === a.agentId)
  )

  const balanceSplits = (count) => {
    const even = Math.floor(100 / count)
    const remainder = 100 - even * count
    return Array.from({ length: count }, (_, i) => even + (i === count - 1 ? remainder : 0))
  }

  const addAgent = (agent) => {
    const newCount = agents.length + 1
    const splits = balanceSplits(newCount)
    const updated = [
      ...agents.map((a, i) => ({ ...a, split: splits[i] })),
      {
        agentId: agent.agentId,
        agentUuid: agent.id,
        name: agent.name,
        role: agent.agentLevel || 'Agent',
        split: splits[newCount - 1],
        img: '',
      }
    ]
    setAgents(updated)
    setShowAgentPicker(false)
  }

  const updateSplit = (index, value) => {
    const raw = Number(value)
    const clamped = Math.min(Math.max(isNaN(raw) ? 0 : raw, 0), 100)
    const updated = agents.map((a, i) => ({ ...a, split: i === index ? clamped : a.split }))
    const others = updated.filter((_, i) => i !== index)
    const otherTotal = others.reduce((s, a) => s + a.split, 0)
    const remaining = 100 - clamped
    if (otherTotal > 0 && remaining >= 0) {
      updated.forEach((a, i) => {
        if (i !== index) {
          a.split = Math.round((a.split / otherTotal) * remaining)
        }
      })
    }
    if (remaining >= 0) {
      const sum = updated.reduce((s, a) => s + a.split, 0)
      const diff = 100 - sum
      if (diff !== 0) {
        const lastOtherIndex = updated.findLastIndex((_, i) => i !== index)
        if (lastOtherIndex >= 0) {
          updated[lastOtherIndex].split += diff
        }
      }
    }
    setAgents(updated)
  }

  const removeAgent = (index) => {
    const remaining = agents.filter((_, i) => i !== index)
    const splits = balanceSplits(remaining.length)
    setAgents(remaining.map((a, i) => ({ ...a, split: splits[i] })))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const form = e.currentTarget
      const formData = new FormData(form)
      const products = ['Term Life', 'Whole Life', 'Health Insurance', 'Annuities']
      const productInterest = {}
      products.forEach((p) => { productInterest[p] = formData.getAll('productInterest').includes(p) })

      const payload = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        phone: formData.get('phone'),
        dateOfBirth: formData.get('dateOfBirth') || undefined,
        email: formData.get('email') || undefined,
        address: formData.get('address') || undefined,
        maritalStatus: formData.get('maritalStatus') || undefined,
        residencyStatus: formData.get('residencyStatus') || undefined,
        smokingStatus: formData.get('smokingStatus') === 'on' || undefined,
        alcoholStatus: formData.get('alcoholStatus') === 'on' || undefined,
        healthIssues: formData.get('healthIssues') || undefined,
        occupation: formData.get('occupation') || undefined,
        employer: formData.get('employer') || undefined,
        productInterest: Object.keys(productInterest).filter((k) => productInterest[k]).length > 0 ? productInterest : undefined,
        leadSource: formData.get('leadSource') || undefined,
        leadPriority: priority ? priority.toLowerCase() : undefined,
      }

      if (agents.length > 0 && totalSplit === 100) {
        payload.assignments = agents.map((a) => ({
          agentId: a.agentUuid || a.agentId,
          commissionShare: a.split,
        }))
      }

      await createLead(payload)
      navigate('/admin/leads')
    } catch (err) {
      notify.error(err.message || 'Failed to create lead.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center">
      <div className="w-full max-w-[900px] mb-6">
        <button
          type="button"
          onClick={() => navigate('/admin/leads')}
          className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          <ArrowLeft size={18} />
          Back to Lead Management
        </button>
      </div>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[900px] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-24"
        id="leadForm"
      >
        <div className="p-8 border-b border-slate-200">
          <div className="flex items-center gap-2 mb-6">
            <User size={22} className="text-blue-600" />
            <h3 className="text-lg font-bold text-slate-900">Basic Information</h3>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 tracking-wider">FIRST NAME</label>
              <input name="firstName" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="Enter first name" type="text" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 tracking-wider">LAST NAME</label>
              <input name="lastName" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="Enter last name" type="text" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 tracking-wider">PHONE NUMBER</label>
              <input name="phone" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="+1 (555) 000-0000" type="tel" maxLength={10} onInput={(e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10) }} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 tracking-wider">DATE OF BIRTH</label>
              <input name="dateOfBirth" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" type="date" max={today} />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 tracking-wider">EMAIL ADDRESS</label>
              <input name="email" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="example@email.com" type="email" />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 tracking-wider">RESIDENTIAL ADDRESS</label>
              <textarea name="address" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="Street, City, State, ZIP" rows="2" />
            </div>
          </div>
        </div>

        <div className="p-8 border-b border-slate-200 bg-slate-50/30">
          <div className="flex items-center gap-2 mb-6">
            <UserCheck size={22} className="text-blue-600" />
            <h3 className="text-lg font-bold text-slate-900">Personal Details</h3>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 tracking-wider">MARITAL STATUS</label>
              <select name="maritalStatus" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white">
                <option value="">Select Status</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 tracking-wider">RESIDENCY STATUS</label>
              <select name="residencyStatus" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white">
                <option value="Citizen">Citizen</option>
                <option value="Permanent Resident">Permanent Resident</option>
                <option value="Visa Holder">Visa Holder</option>
              </select>
            </div>
            <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg">
              <div className="flex items-center gap-3">
                <Smile size={20} className="text-slate-400" />
                <span className="text-sm">Smoking Status</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input name="smokingStatus" className="sr-only peer" type="checkbox" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>
            <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-slate-400 text-xl font-bold">&#x1F37A;</span>
                <span className="text-sm">Alcohol Consumption</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input name="alcoholStatus" className="sr-only peer" type="checkbox" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 tracking-wider">KNOWN HEALTH ISSUES</label>
              <input name="healthIssues" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="Specify if any (e.g. Hypertension, Diabetes)" type="text" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 tracking-wider">OCCUPATION</label>
              <input name="occupation" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="Job title" type="text" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 tracking-wider">EMPLOYER</label>
              <input name="employer" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="Company name" type="text" />
            </div>
          </div>
        </div>

        <div className="p-8 border-b border-slate-200">
          <div className="flex items-center gap-2 mb-6">
            <List size={22} className="text-blue-600" />
            <h3 className="text-lg font-bold text-slate-900">Lead Details</h3>
          </div>
          <div className="space-y-6">
            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Interested Products</label>
              <div className="flex flex-wrap gap-4">
                {['Term Life', 'Whole Life', 'Health Insurance', 'Annuities'].map((product) => (
                  <label
                    key={product}
                    className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      name="productInterest"
                      value={product}
                      defaultChecked={product === 'Health Insurance'}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <span className="text-sm">{product}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 tracking-wider">LEAD SOURCE</label>
                <select name="leadSource" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white">
                  <option value="">Select source</option>
                  <option value="Facebook Ads">Facebook Ads</option>
                  <option value="Google Search">Google Search</option>
                  <option value="Referral">Referral</option>
                  <option value="Direct Call">Direct Call</option>
                  <option value="Landing Page">Landing Page</option>
                </select>
              </div>
              <div className="flex flex-col gap-3">
                <label className="text-xs font-bold text-slate-500 tracking-wider">PRIORITY LEVEL</label>
                <div className="grid grid-cols-3 gap-3">
                  {PRIORITY_KEYS.map((key) => {
                    const st = priorityStyles[key]
                    const isActive = priority === key
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setPriority(key)}
                        className={`relative flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${isActive ? st.active : st.default}`}
                      >
                        {isActive && (
                          <div className={`absolute -top-2 -right-2 ${st.badge} text-white p-0.5 rounded-full`}>
                            <Check size={14} />
                          </div>
                        )}
                        <span className="text-xs font-bold">{key}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 bg-slate-50/20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Users size={22} className="text-blue-600" />
              <h3 className="text-lg font-bold text-slate-900">Agent Assignment</h3>
            </div>
            <div className={`px-4 py-2 rounded-lg flex items-center gap-2 ${isBalanced ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {isBalanced ? <Check size={16} /> : <AlertTriangle size={16} />}
              <span className="text-xs font-bold tracking-wider">Total: {totalSplit}%{!isBalanced && ' — needs to be 100%'}</span>
            </div>
          </div>
          <div className="space-y-4">
            {agents.map((agent, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center overflow-hidden border border-slate-200">
                    {agent.img ? (
                      <img alt={agent.name} className="w-full h-full object-cover" src={agent.img} />
                    ) : (
                      <span className="text-sm font-bold text-blue-600">
                        {agent.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{agent.name}</p>
                    <p className="text-xs text-slate-500">{agent.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">SPLIT %</label>
                    <div className="relative w-24">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={agent.split}
                        onChange={(e) => updateSplit(index, e.target.value)}
                        className="w-full pl-3 pr-8 py-2 rounded-lg border border-slate-300 focus:border-blue-500 outline-none transition-all"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">%</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAgent(index)}
                    className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
            {showAgentPicker && (
              <div className="bg-white border border-blue-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700">Select Agent</span>
                  <button
                    type="button"
                    onClick={() => setShowAgentPicker(false)}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="divide-y divide-slate-100">
                  {agentsLoading ? (
                    <div className="px-4 py-6 text-center text-sm text-slate-500">Loading agents…</div>
                  ) : unassigned.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-slate-500">All available agents have been assigned.</div>
                  ) : (
                    unassigned.map((agent) => (
                      <button
                        key={agent.id}
                        type="button"
                        onClick={() => addAgent(agent)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left"
                      >
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600">
                          {(agent.name || '?').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{agent.name}</p>
                          <p className="text-xs text-slate-500">{agent.agentLevel || 'Agent'}</p>
                        </div>
                        <UserPlus size={16} className="ml-auto text-slate-400" />
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
            {agents.length < availableAgents.length && (
              <button
                type="button"
                onClick={() => setShowAgentPicker(!showAgentPicker)}
                className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:text-blue-600 hover:border-blue-500 hover:bg-blue-50/30 transition-all flex items-center justify-center gap-2"
              >
                <UserPlus size={20} />
                <span className="text-sm font-bold">Add Another Agent</span>
              </button>
            )}
          </div>
        </div>
      </form>

      <footer className="fixed bottom-0 left-[280px] right-0 bg-white border-t border-slate-200 px-8 py-4 flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
        <div className="flex items-center gap-4 text-slate-500">
          <Info size={18} />
          <p className="text-sm">Lead ID will be automatically generated upon saving.</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="px-6 py-2.5 rounded-lg border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all"
          >
            Save Draft
          </button>
          <button
            type="submit"
            form="leadForm"
            disabled={submitting}
            className="px-8 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 shadow-md transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={16} />
            {submitting ? 'Saving...' : 'Save & Assign'}
          </button>
        </div>
      </footer>
    </div>
  )
}
