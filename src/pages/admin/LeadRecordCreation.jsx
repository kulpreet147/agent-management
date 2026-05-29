import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
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

const AVAILABLE_AGENTS = [
  { name: 'John Doe', role: 'Senior Agent', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDxMZalfX-J1y-uh21kDlryk7WwlXgaP9Rx5ZWGRNze3xLSW04RqoR7v6Gi_BU59_K5hU-k_j4-0MoLrvECy5dSn6uiTmFOImBDs2aZQEo8Bn_0BNBDdcV9MjGftTYLeP0oc02HEMm5Ner6OkUrpXY84EZpoZtCqMDuNTrI7IChidc7i5MmSCui_dbM5pCJ9vY3-FGKltjLnpq2uNafHvK-tvzmub31wiAlNewwQItGiUxN-qvM7wxiDTSoknudjscv0MTbr4e6imE' },
  { name: 'Alice Smith', role: 'Field Specialist', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBk2kmzVv5tYK76YO6CiyY8-JKyEe5un6ZPy964zwpL2P3fvEsxIBt-NdgLUYoee4zhUTGIVv9YwbfZqFIrRsx42aZ6O4SStS5jPzlBWipNJ9LsPpsCAa-NjMoXRk5JNoxwbb-RnSt5bKOJ8-ModKZ__UihdBq6tkmSKGnfXZxee4PARLOmR4H8_fxleCvAsGO4dfzIKCU6wrCHm7YUfqlfqD7oky8larwY3SuE0Sr9lJKV8KOaCGhmoORas7JddYBYXbBy-YW4nMA' },
  { name: 'Sarah Jenkins', role: 'Senior Agent', img: '' },
  { name: 'Michael Chen', role: 'Lead Specialist', img: '' },
  { name: 'Emma Wilson', role: 'Field Agent', img: '' }
]

export default function LeadRecordCreation() {
  const navigate = useNavigate()
  const [priority, setPriority] = useState('')
  const [showAgentPicker, setShowAgentPicker] = useState(false)
  const [agents, setAgents] = useState([
    { name: 'John Doe', role: 'Senior Agent', split: 50, img: AVAILABLE_AGENTS[0].img },
    { name: 'Alice Smith', role: 'Field Specialist', split: 35, img: AVAILABLE_AGENTS[1].img }
  ])

  const totalSplit = useMemo(() => agents.reduce((sum, a) => sum + a.split, 0), [agents])
  const isBalanced = totalSplit === 100
  const unassigned = AVAILABLE_AGENTS.filter(
    (a) => !agents.some((assigned) => assigned.name === a.name)
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
      { name: agent.name, role: agent.role, split: splits[newCount - 1], img: agent.img }
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

  const handleSubmit = (e) => {
    e.preventDefault()
    alert('Lead processed and assigned successfully!')
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
              <input className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="Enter first name" type="text" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 tracking-wider">LAST NAME</label>
              <input className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="Enter last name" type="text" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 tracking-wider">PHONE NUMBER</label>
              <input className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="+1 (555) 000-0000" type="tel" maxLength={10} onInput={(e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10) }} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 tracking-wider">DATE OF BIRTH</label>
              <input className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" type="date" max={today} />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 tracking-wider">EMAIL ADDRESS</label>
              <input className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="example@email.com" type="email" />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 tracking-wider">RESIDENTIAL ADDRESS</label>
              <textarea className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="Street, City, State, ZIP" rows="2" />
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
              <select className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white">
                <option>Select Status</option>
                <option>Single</option>
                <option>Married</option>
                <option>Divorced</option>
                <option>Widowed</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 tracking-wider">RESIDENCY STATUS</label>
              <select className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white">
                <option>Citizen</option>
                <option>Permanent Resident</option>
                <option>Visa Holder</option>
              </select>
            </div>
            <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg">
              <div className="flex items-center gap-3">
                <Smile size={20} className="text-slate-400" />
                <span className="text-sm">Smoking Status</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input className="sr-only peer" type="checkbox" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>
            <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-slate-400 text-xl font-bold">&#x1F37A;</span>
                <span className="text-sm">Alcohol Consumption</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input className="sr-only peer" type="checkbox" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 tracking-wider">KNOWN HEALTH ISSUES</label>
              <input className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="Specify if any (e.g. Hypertension, Diabetes)" type="text" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 tracking-wider">OCCUPATION</label>
              <input className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="Job title" type="text" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 tracking-wider">EMPLOYER</label>
              <input className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="Company name" type="text" />
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
                <select className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white">
                  <option>Facebook Ads</option>
                  <option>Google Search</option>
                  <option>Referral</option>
                  <option>Direct Call</option>
                  <option>Landing Page</option>
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
                  {unassigned.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-slate-500">All agents have been assigned.</div>
                  ) : (
                    unassigned.map((agent) => (
                      <button
                        key={agent.name}
                        type="button"
                        onClick={() => addAgent(agent)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left"
                      >
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600">
                          {agent.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{agent.name}</p>
                          <p className="text-xs text-slate-500">{agent.role}</p>
                        </div>
                        <UserPlus size={16} className="ml-auto text-slate-400" />
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
            {agents.length < AVAILABLE_AGENTS.length && (
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
            className="px-8 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 shadow-md transition-all flex items-center gap-2"
          >
            <Save size={16} />
            Save & Assign
          </button>
        </div>
      </footer>
    </div>
  )
}
