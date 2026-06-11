import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  CheckCircle,
  AlertTriangle,
  Plus,
  Trash2,
  Home,
  Wallet,
  TrendingUp,
  Shield,
  Users,
  Target,
  DollarSign,
  Loader2,
  FileText,
  Send,
  Eye,
  X,
  Mail,
  Calculator,
} from 'lucide-react'
import { getNeedAnalysis, saveNeedAnalysis, getLead, sendNeedAnalysisToClient } from '../utils/leads'
import { auth } from '../utils/auth.js'
import { previewNeedAnalysisPDF, getNeedAnalysisPDFBlob } from '../utils/needAnalysisPdf.js'
import { notify } from '../utils/notify.js'
import { getPersonByPersonId, getFamilyMembers, addFamilyMember, updateFamilyMember, removeFamilyMember, getOrCreatePersonByLeadId } from '../utils/persons.js'

const emptyAsset = { description: '', value: 0 }
const emptyPolicy = { provider: '', type: '', coverageAmount: 0, premium: 0 }
const emptyRecommendedProduct = { product: '', coverageAmount: null, proposedPremium: null }

function num(val) {
  const n = Number(String(val).replace(/[^0-9.\-]/g, ''))
  return isNaN(n) ? 0 : n
}

function formatCurrency(val) {
  const n = num(val)
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function parseNum(val) {
  if (val === null || val === undefined || val === '') return null
  const n = Number(String(val).replace(/[^0-9.\-]/g, ''))
  return isNaN(n) ? null : n
}

function CurrencyInput({ label, value, onChange, placeholder = '0' }) {
  const [raw, setRaw] = useState(value != null ? String(value) : '')
  useEffect(() => {
    setRaw(value != null ? String(value) : '')
  }, [value])

  return (
    <div>
      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
        <input
          type="text"
          value={raw}
          placeholder={placeholder}
          onChange={(e) => {
            setRaw(e.target.value)
            onChange(parseNum(e.target.value))
          }}
          className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>
    </div>
  )
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div
        className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-slate-300'}`}
        onClick={() => onChange(!checked)}
      >
        <div
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`}
        />
      </div>
      <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{label}</span>
    </label>
  )
}

function SectionHeader({ icon: Icon, title, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    teal: 'bg-teal-50 border-teal-200 text-teal-700',
  }
  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${colors[color]} mb-4`}>
      <Icon size={18} />
      <h3 className="text-sm font-bold uppercase tracking-wider">{title}</h3>
    </div>
  )
}

export default function NeedAnalysisForm({ role = 'admin' }) {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { leadId } = useParams()
  const lead = state?.lead

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState(null)
  const [analysisId, setAnalysisId] = useState(null)
  const [hasBeenSaved, setHasBeenSaved] = useState(false)
  const [pdfPreviewing, setPdfPreviewing] = useState(false)
  const [sendModalOpen, setSendModalOpen] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const sendingEmailRef = useRef(false)
  const [sendResult, setSendResult] = useState(null)
  const [familyMembers, setFamilyMembers] = useState([])
  const [personId, setPersonId] = useState(null)
  const [familyLoading, setFamilyLoading] = useState(true)
  const [showFamilyModal, setShowFamilyModal] = useState(false)
  const [editingFamilyMember, setEditingFamilyMember] = useState(null)
  const [familyForm, setFamilyForm] = useState({ firstName: '', lastName: '', relationship: '', dateOfBirth: '', email: '', phone: '' })

  const session = auth.get()
  const backPath = role === 'agent' ? `/agent/leads/${leadId}` : `/admin/leads/${leadId}`

  const [form, setForm] = useState({
    ownHouse: false,
    houseValue: null,
    mortgageRemaining: null,
    rrsp: null,
    tfsa: null,
    lifeInsuranceForKids: false,
    educationPlansRESP: false,
    educationPlanAmount: null,
    otherAssets: [],
    outstandingMortgage: null,
    lineOfCredit: null,
    creditCardDebt: null,
    carLoan: null,
    monthlyExpenses: null,
    annualIncomePrimary: null,
    annualIncomeSpouse: null,
    totalHouseholdIncome: null,
    lifeInsurance: false,
    criticalIllness: false,
    disability: false,
    groupInsurance: false,
    groupInsuranceCoverage: null,
    groupInsuranceCompany: '',
    existingPolicies: [],
    spouseOccupation: '',
    spouseIncome: null,
    desiredCoverage: null,
    budgetMonthly: null,
    coverageNotes: '',
    recommendedProducts: [],
  })

  const isMarried = lead?.maritalStatus === 'Married'

  const set = (key) => (val) => setForm((prev) => ({ ...prev, [key]: val }))

  useEffect(() => {
    async function load() {
      if (!leadId) return
      try {
        const [analysis, leadData] = await Promise.all([
          getNeedAnalysis(leadId).catch(() => null),
          lead ? Promise.resolve(lead) : getLead(leadId).catch(() => null),
        ])
        if (analysis && analysis.id) {
          setAnalysisId(analysis.id)
          setHasBeenSaved(true)
          setForm({
            ownHouse: analysis.ownHouse ?? false,
            houseValue: analysis.houseValue,
            mortgageRemaining: analysis.mortgageRemaining,
            rrsp: analysis.rrsp,
            tfsa: analysis.tfsa,
            lifeInsuranceForKids: analysis.lifeInsuranceForKids ?? false,
            educationPlansRESP: analysis.educationPlansRESP ?? false,
            educationPlanAmount: analysis.educationPlanAmount,
            otherAssets: Array.isArray(analysis.otherAssets) ? analysis.otherAssets : [],
            outstandingMortgage: analysis.outstandingMortgage,
            lineOfCredit: analysis.lineOfCredit,
            creditCardDebt: analysis.creditCardDebt,
            carLoan: analysis.carLoan,
            monthlyExpenses: analysis.monthlyExpenses,
            annualIncomePrimary: analysis.annualIncomePrimary,
            annualIncomeSpouse: analysis.annualIncomeSpouse,
            totalHouseholdIncome: analysis.totalHouseholdIncome,
            lifeInsurance: analysis.lifeInsurance ?? false,
            criticalIllness: analysis.criticalIllness ?? false,
            disability: analysis.disability ?? false,
            groupInsurance: analysis.groupInsurance ?? false,
            groupInsuranceCoverage: analysis.groupInsuranceCoverage,
            groupInsuranceCompany: analysis.groupInsuranceCompany || '',
            existingPolicies: Array.isArray(analysis.existingPolicies) ? analysis.existingPolicies : [],
            spouseOccupation: analysis.spouseOccupation || '',
            spouseIncome: analysis.spouseIncome,
            desiredCoverage: analysis.desiredCoverage,
            budgetMonthly: analysis.budgetMonthly,
            coverageNotes: analysis.coverageNotes || '',
            recommendedProducts: Array.isArray(analysis.recommendedProducts) ? analysis.recommendedProducts : [],
          })
        } else if (leadData) {
          setForm((prev) => ({
            ...prev,
            annualIncomePrimary: parseNum(leadData.annualIncome),
          }))
        }

        // Fetch personUuid and family members
        const personIdentifier = leadData?.leadId || leadId
        try {
          const person = await getOrCreatePersonByLeadId(leadData || { leadId: personIdentifier })
          setPersonId(person.id)
          const members = await getFamilyMembers(person.id)
          setFamilyMembers(Array.isArray(members) ? members : [])
        } catch {
          setPersonId(null)
          setFamilyMembers([])
        }
      } catch (err) {
        console.error('Failed to load need analysis', err)
      } finally {
        setLoading(false)
        setFamilyLoading(false)
      }
    }
    load()
  }, [leadId])

  useEffect(() => {
    if (!isMarried) {
      setForm((prev) => ({
        ...prev,
        spouseOccupation: '',
        spouseIncome: null,
        annualIncomeSpouse: null,
      }))
    }
  }, [isMarried])

  const loadFamilyMembers = async () => {
    if (!personId) {
      setFamilyMembers([])
      setFamilyLoading(false)
      return
    }
    try {
      const members = await getFamilyMembers(personId)
      setFamilyMembers(Array.isArray(members) ? members : [])
    } catch {
      setFamilyMembers([])
    } finally {
      setFamilyLoading(false)
    }
  }

  const openAddFamilyMember = () => {
    if (!personId) return
    setEditingFamilyMember(null)
    setFamilyForm({ firstName: '', lastName: '', relationship: '', dateOfBirth: '', email: '', phone: '' })
    setShowFamilyModal(true)
  }

  const openEditFamilyMember = (member) => {
    setEditingFamilyMember(member)
    setFamilyForm({
      firstName: member.firstName || '',
      lastName: member.lastName || '',
      relationship: member.relationship || '',
      dateOfBirth: member.dateOfBirth ? member.dateOfBirth.split('T')[0] : '',
      email: member.email || '',
      phone: member.phone || '',
    })
    setShowFamilyModal(true)
  }

  const handleFamilySubmit = async (e) => {
    e.preventDefault()
    if (!personId) {
      alert('Person record not found for this lead. Please refresh the page or contact support.')
      return
    }
    try {
      if (editingFamilyMember) {
        await updateFamilyMember(personId, editingFamilyMember.id, familyForm)
      } else {
        await addFamilyMember(personId, familyForm)
      }
      setShowFamilyModal(false)
      loadFamilyMembers()
    } catch (err) {
      alert(err.message || 'Failed to save family member')
    }
  }

  const handleRemoveFamilyMember = async (memberId, name) => {
    if (!window.confirm(`Remove ${name} from family members?`)) return
    if (!personId) return
    try {
      await removeFamilyMember(personId, memberId)
      loadFamilyMembers()
    } catch (err) {
      alert(err.message || 'Failed to remove family member')
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveMsg(null)
    try {
      await saveNeedAnalysis(leadId, form)
      setHasBeenSaved(true)
      setSaveMsg('saved')
      setTimeout(() => setSaveMsg(null), 3000)
    } catch (err) {
      setSaveMsg('error')
      setTimeout(() => setSaveMsg(null), 3000)
    } finally {
      setSaving(false)
    }
  }

  const addOtherAsset = () => setForm((p) => ({ ...p, otherAssets: [...p.otherAssets, { ...emptyAsset }] }))
  const removeOtherAsset = (i) => setForm((p) => ({ ...p, otherAssets: p.otherAssets.filter((_, idx) => idx !== i) }))
  const updateOtherAsset = (i, key, val) =>
    setForm((p) => ({ ...p, otherAssets: p.otherAssets.map((a, idx) => (idx === i ? { ...a, [key]: val } : a)) }))

  const addPolicy = () => setForm((p) => ({ ...p, existingPolicies: [...p.existingPolicies, { ...emptyPolicy }] }))
  const removePolicy = (i) => setForm((p) => ({ ...p, existingPolicies: p.existingPolicies.filter((_, idx) => idx !== i) }))
  const updatePolicy = (i, key, val) =>
    setForm((p) => ({ ...p, existingPolicies: p.existingPolicies.map((a, idx) => (idx === i ? { ...a, [key]: val } : a)) }))

  const addRecommendedProduct = () => setForm((p) => ({ ...p, recommendedProducts: [...p.recommendedProducts, { ...emptyRecommendedProduct }] }))
  const removeRecommendedProduct = (i) => setForm((p) => ({ ...p, recommendedProducts: p.recommendedProducts.filter((_, idx) => idx !== i) }))
  const updateRecommendedProduct = (i, key, val) =>
    setForm((p) => ({ ...p, recommendedProducts: p.recommendedProducts.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)) }))

  const sections = useMemo(() => [
    {
      key: 'assets',
      label: 'Assets',
      weight: 1,
      filled: Boolean(
        (form.ownHouse && (form.houseValue || form.mortgageRemaining)) ||
        form.rrsp || form.tfsa || form.lifeInsuranceForKids ||
        form.educationPlansRESP || (form.otherAssets || []).some((a) => a.description || a.value)
      ),
    },
    {
      key: 'liabilities',
      label: 'Liabilities',
      weight: 1,
      filled: Boolean(
        form.outstandingMortgage || form.lineOfCredit ||
        form.creditCardDebt || form.carLoan || form.monthlyExpenses
      ),
    },
    {
      key: 'income',
      label: 'Income',
      weight: 1,
      filled: Boolean(
        form.annualIncomePrimary || form.annualIncomeSpouse || form.totalHouseholdIncome
      ),
    },
    {
      key: 'insurance',
      label: 'Existing Insurance',
      weight: 1,
      filled: Boolean(
        form.lifeInsurance || form.criticalIllness || form.disability ||
        form.groupInsurance || (form.existingPolicies || []).some((p) => p.provider || p.type) ||
        hasBeenSaved
      ),
    },
    {
      key: 'family',
      label: 'Family Details',
      weight: 1,
      filled: isMarried
        ? Boolean(
            familyMembers.length > 0 ||
            form.spouseOccupation || form.spouseIncome ||
            hasBeenSaved
          )
        : Boolean(
            familyMembers.length > 0 ||
            hasBeenSaved
          ),
    },
    {
      key: 'coverage',
      label: 'Coverage Requirements',
      weight: 1,
      filled: Boolean(form.desiredCoverage || form.budgetMonthly || form.coverageNotes),
    },
  ], [form, hasBeenSaved, familyMembers, isMarried])

  const completedCount = sections.filter((s) => s.filled).length
  const totalSections = sections.length
  const progressPct = Math.round((completedCount / totalSections) * 100)
  const isComplete = completedCount === totalSections

  const handlePreviewPDF = () => {
    setPdfPreviewing(true)
    try {
      previewNeedAnalysisPDF(form, lead, session)
    } catch (err) {
      console.error('PDF generation failed', err)
      notify.error('Failed to generate PDF. Please try again.')
    } finally {
      setPdfPreviewing(false)
    }
  }

  const openSendModal = () => {
    if (!isComplete) {
      notify.warning('Please complete all sections before sending to the client.')
      return
    }
    setSendResult(null)
    setSendModalOpen(true)
  }

  const handleSendToClient = async (overrideEmail) => {
    if (sendingEmailRef.current) return
    sendingEmailRef.current = true
    const targetEmail = (overrideEmail || lead?.email || '').trim()
    if (!targetEmail) {
      notify.warning('Client email is required.')
      sendingEmailRef.current = false
      return
    }
    setSendingEmail(true)
    setSendResult(null)
    try {
      const blob = getNeedAnalysisPDFBlob(form, lead, session)
      const base64 = await blobToBase64(blob)
      const result = await sendNeedAnalysisToClient(leadId, {
        pdfBase64: base64,
        clientEmail: targetEmail,
      })
      setSendResult({ ok: true, ...result })
    } catch (err) {
      setSendResult({ ok: false, message: err.message || 'Failed to send report' })
    } finally {
      sendingEmailRef.current = false
      setSendingEmail(false)
    }
  }

  const blobToBase64 = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result || ''
      const base64 = String(result).split(',')[1] || ''
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-[#eef3f8]">
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(backPath, lead ? { state: { lead } } : undefined)}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Need Analysis</h1>
            <p className="text-sm text-slate-500">{lead?.name || 'Lead'} — Lead ID: {lead?.leadId || leadId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {saveMsg === 'saved' && (
            <span className="text-green-600 text-sm font-medium flex items-center gap-1">
              <CheckCircle size={16} /> Saved
            </span>
          )}
          {saveMsg === 'error' && (
            <span className="text-red-600 text-sm font-medium flex items-center gap-1">
              <AlertTriangle size={16} /> Error saving
            </span>
          )}
          <button
            onClick={handlePreviewPDF}
            disabled={pdfPreviewing}
            className="px-3 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {pdfPreviewing ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />}
            Preview PDF
          </button>
          <button
            onClick={openSendModal}
            disabled={!isComplete}
            title={isComplete ? 'Send the report to the client via email' : 'Complete all sections to enable sending'}
            className="px-3 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} />
            Send to Client
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`grid h-9 w-9 place-items-center rounded-full ${isComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
              {isComplete ? <CheckCircle size={18} /> : <FileText size={18} />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Form Completion</h3>
              <p className="text-xs text-slate-500">
                {completedCount} of {totalSections} sections completed
                {isComplete ? ' — Ready to send to client' : ' — Keep going!'}
              </p>
            </div>
          </div>
          <span className={`text-2xl font-bold ${isComplete ? 'text-emerald-600' : 'text-blue-600'}`}>
            {progressPct}%
          </span>
        </div>
        <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isComplete ? 'bg-emerald-500' : 'bg-blue-600'}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="mt-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {sections.map((s) => (
            <div
              key={s.key}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium ${
                s.filled
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
            >
              {s.filled ? <CheckCircle size={12} /> : <div className="h-3 w-3 rounded-full border-2 border-slate-300" />}
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Section 1: Assets */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
        <SectionHeader icon={Home} title="Assets" color="green" />
        <div className="grid grid-cols-2 gap-4">
          <Toggle label="Own House" checked={form.ownHouse} onChange={set('ownHouse')} />
          {form.ownHouse && (
            <>
              <CurrencyInput label="House Value" value={form.houseValue} onChange={set('houseValue')} />
              <CurrencyInput label="Mortgage Remaining" value={form.mortgageRemaining} onChange={set('mortgageRemaining')} />
            </>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <CurrencyInput label="RRSP" value={form.rrsp} onChange={set('rrsp')} />
          <CurrencyInput label="TFSA" value={form.tfsa} onChange={set('tfsa')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Toggle label="Life Insurance for Kids" checked={form.lifeInsuranceForKids} onChange={set('lifeInsuranceForKids')} />
          <Toggle label="Education Plans (RESP)" checked={form.educationPlansRESP} onChange={set('educationPlansRESP')} />
          {form.educationPlansRESP && (
            <CurrencyInput label="RESP Amount Saved" value={form.educationPlanAmount} onChange={set('educationPlanAmount')} />
          )}
        </div>

        {/* Other Assets */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-700">Other Assets</span>
            <button onClick={addOtherAsset} className="text-blue-600 text-xs font-bold flex items-center gap-1 hover:underline">
              <Plus size={14} /> Add
            </button>
          </div>
          {form.otherAssets.length === 0 && (
            <p className="text-xs text-slate-400 italic">No other assets added</p>
          )}
          {form.otherAssets.map((asset, i) => (
            <div key={i} className="flex items-center gap-3 mb-2">
              <input
                type="text"
                placeholder="Description (e.g. Car, Investment)"
                value={asset.description}
                onChange={(e) => updateOtherAsset(i, 'description', e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <div className="relative w-36">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input
                  type="text"
                  placeholder="0"
                  value={asset.value || ''}
                  onChange={(e) => updateOtherAsset(i, 'value', parseNum(e.target.value))}
                  className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <button onClick={() => removeOtherAsset(i)} className="text-slate-400 hover:text-red-600">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Section 2: Liabilities */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <SectionHeader icon={Wallet} title="Liabilities" color="red" />
        <div className="grid grid-cols-2 gap-4">
          <CurrencyInput label="Outstanding Mortgage" value={form.outstandingMortgage} onChange={set('outstandingMortgage')} />
          <CurrencyInput label="Line of Credit" value={form.lineOfCredit} onChange={set('lineOfCredit')} />
          <CurrencyInput label="Credit Card Debt" value={form.creditCardDebt} onChange={set('creditCardDebt')} />
          <CurrencyInput label="Car Loan" value={form.carLoan} onChange={set('carLoan')} />
          <CurrencyInput label="Monthly Expenses" value={form.monthlyExpenses} onChange={set('monthlyExpenses')} />
        </div>
      </section>

      {/* Section 3: Income */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <SectionHeader icon={TrendingUp} title="Income" color="blue" />
        <div className={`grid gap-4 ${isMarried ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <CurrencyInput label="Annual Income (Primary)" value={form.annualIncomePrimary} onChange={set('annualIncomePrimary')} />
          {isMarried && (
            <CurrencyInput label="Annual Income (Spouse)" value={form.annualIncomeSpouse} onChange={set('annualIncomeSpouse')} />
          )}
          <CurrencyInput label="Total Household Income" value={form.totalHouseholdIncome} onChange={set('totalHouseholdIncome')} />
        </div>
      </section>

      {/* Section 4: Existing Insurance */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <SectionHeader icon={Shield} title="Existing Insurance" color="purple" />
        <div className="grid grid-cols-2 gap-4">
          <Toggle label="Life Insurance" checked={form.lifeInsurance} onChange={set('lifeInsurance')} />
          <Toggle label="Critical Illness" checked={form.criticalIllness} onChange={set('criticalIllness')} />
          <Toggle label="Disability" checked={form.disability} onChange={set('disability')} />
          <Toggle label="Group Insurance (Employer)" checked={form.groupInsurance} onChange={set('groupInsurance')} />
          {form.groupInsurance && (
            <>
              <CurrencyInput label="Group Insurance Coverage" value={form.groupInsuranceCoverage} onChange={set('groupInsuranceCoverage')} />
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Company</label>
                <input
                  type="text"
                  value={form.groupInsuranceCompany}
                  onChange={(e) => set('groupInsuranceCompany')(e.target.value)}
                  placeholder="e.g. TechCorp Group Benefits"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </>
          )}
        </div>

        {/* Existing Policies Table */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-700">Existing Policies</span>
            <button onClick={addPolicy} className="text-blue-600 text-xs font-bold flex items-center gap-1 hover:underline">
              <Plus size={14} /> Add Policy
            </button>
          </div>
          {form.existingPolicies.length > 0 && (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <th className="py-2 text-[11px] font-bold text-slate-500 uppercase">Provider</th>
                  <th className="py-2 text-[11px] font-bold text-slate-500 uppercase">Type</th>
                  <th className="py-2 text-[11px] font-bold text-slate-500 uppercase text-right">Coverage</th>
                  <th className="py-2 text-[11px] font-bold text-slate-500 uppercase text-right">Premium</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {form.existingPolicies.map((p, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="py-2">
                      <input type="text" value={p.provider} onChange={(e) => updatePolicy(i, 'provider', e.target.value)}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
                    </td>
                    <td className="py-2">
                      <input type="text" value={p.type} onChange={(e) => updatePolicy(i, 'type', e.target.value)}
                        placeholder="e.g. Term Life"
                        className="w-full px-2 py-1 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
                    </td>
                    <td className="py-2">
                      <input type="text" value={p.coverageAmount || ''} onChange={(e) => updatePolicy(i, 'coverageAmount', parseNum(e.target.value))}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-sm text-right focus:ring-1 focus:ring-blue-500 outline-none" />
                    </td>
                    <td className="py-2">
                      <input type="text" value={p.premium || ''} onChange={(e) => updatePolicy(i, 'premium', parseNum(e.target.value))}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-sm text-right focus:ring-1 focus:ring-blue-500 outline-none" />
                    </td>
                    <td className="py-2 text-center">
                      <button onClick={() => removePolicy(i)} className="text-slate-400 hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {form.existingPolicies.length === 0 && (
            <p className="text-xs text-slate-400 italic">No policies added</p>
          )}
        </div>
      </section>

      {/* Section 5: Family Details */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <SectionHeader icon={Users} title="Family Details" color="orange" />

        {isMarried && (
          <>
            {/* Spouse Additional Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Spouse Occupation</label>
                <input type="text" value={form.spouseOccupation} onChange={(e) => set('spouseOccupation')(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <CurrencyInput label="Spouse Income" value={form.spouseIncome} onChange={set('spouseIncome')} />
            </div>
          </>
        )}

        {!isMarried && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
            Spouse details are only applicable for married clients. Only dependent family members can be added.
          </div>
        )}

        {/* Family Members from Persons API */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-700">Family Members</span>
            {personId && (
              <button onClick={openAddFamilyMember} className="text-blue-600 text-xs font-bold flex items-center gap-1 hover:underline">
                <Plus size={14} /> Add Member
              </button>
            )}
          </div>
          {!personId ? (
            <p className="text-xs text-slate-400 italic">Person record not available. Family members will appear here once the person record is created.</p>
          ) : familyLoading ? (
            <p className="text-xs text-slate-400 italic">Loading family members...</p>
          ) : familyMembers.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No family members added yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left">
                    <th className="py-2 text-[11px] font-bold text-slate-500 uppercase">Name</th>
                    <th className="py-2 text-[11px] font-bold text-slate-500 uppercase">Relationship</th>
                    <th className="py-2 text-[11px] font-bold text-slate-500 uppercase">Date of Birth</th>
                    <th className="py-2 text-[11px] font-bold text-slate-500 uppercase">Contact</th>
                    <th className="w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {familyMembers.map((m) => (
                    <tr key={m.id} className="border-b border-slate-100">
                      <td className="py-2 text-sm text-slate-800">{m.firstName} {m.lastName}</td>
                      <td className="py-2">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-medium rounded-full">{m.relationship}</span>
                      </td>
                      <td className="py-2 text-sm text-slate-600">
                        {m.dateOfBirth ? new Date(m.dateOfBirth).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                      </td>
                      <td className="py-2 text-xs text-slate-600">
                        {m.email && <span>{m.email}</span>}
                        {m.email && m.phone && <span> / </span>}
                        {m.phone && <span>{m.phone}</span>}
                        {!m.email && !m.phone && <span className="text-slate-400">N/A</span>}
                      </td>
                      <td className="py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openEditFamilyMember(m)} className="text-slate-400 hover:text-blue-600" title="Edit">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button onClick={() => handleRemoveFamilyMember(m.id, `${m.firstName} ${m.lastName}`)} className="text-slate-400 hover:text-red-600" title="Remove">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Section 6: Coverage Requirements */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <SectionHeader icon={Target} title="Coverage Requirements" color="teal" />
        <div className="grid grid-cols-2 gap-4">
          <CurrencyInput label="Desired Coverage Amount" value={form.desiredCoverage} onChange={set('desiredCoverage')} />
          <CurrencyInput label="Monthly Budget" value={form.budgetMonthly} onChange={set('budgetMonthly')} />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Notes / Reasoning</label>
          <textarea
            value={form.coverageNotes}
            onChange={(e) => set('coverageNotes')(e.target.value)}
            rows={3}
            placeholder="e.g. If I'm no longer around, I want my wife and children to be able to live comfortably for the next 20 years."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
          />
        </div>

        {/* Recommended Insurance Products */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-700">Recommended Insurance Products</span>
            <button onClick={addRecommendedProduct} className="text-blue-600 text-xs font-bold flex items-center gap-1 hover:underline">
              <Plus size={14} /> Add Product
            </button>
          </div>
          {form.recommendedProducts.length === 0 && (
            <p className="text-xs text-slate-400 italic">No recommended products added yet</p>
          )}
          {form.recommendedProducts.length > 0 && (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <th className="py-2 text-[11px] font-bold text-slate-500 uppercase">Product</th>
                  <th className="py-2 text-[11px] font-bold text-slate-500 uppercase text-right">Coverage Amount</th>
                  <th className="py-2 text-[11px] font-bold text-slate-500 uppercase text-right">Proposed Premium</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {form.recommendedProducts.map((r, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="py-2">
                      <select
                        value={r.product}
                        onChange={(e) => updateRecommendedProduct(i, 'product', e.target.value)}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                      >
                        <option value="">Select product...</option>
                        <option value="Term Life">Term Life</option>
                        <option value="Whole Life">Whole Life</option>
                        <option value="Universal Life">Universal Life</option>
                        <option value="Critical Illness">Critical Illness</option>
                        <option value="Disability">Disability</option>
                        <option value="Health Insurance">Health Insurance</option>
                        <option value="Travel Insurance">Travel Insurance</option>
                        <option value="Annuities">Annuities</option>
                      </select>
                    </td>
                    <td className="py-2">
                      <input
                        type="text"
                        value={r.coverageAmount || ''}
                        onChange={(e) => updateRecommendedProduct(i, 'coverageAmount', parseNum(e.target.value))}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-sm text-right focus:ring-1 focus:ring-blue-500 outline-none"
                      />
                    </td>
                    <td className="py-2">
                      <input
                        type="text"
                        value={r.proposedPremium || ''}
                        onChange={(e) => updateRecommendedProduct(i, 'proposedPremium', parseNum(e.target.value))}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-sm text-right focus:ring-1 focus:ring-blue-500 outline-none"
                      />
                    </td>
                    <td className="py-2 text-center">
                      <button onClick={() => removeRecommendedProduct(i)} className="text-slate-400 hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* WinQuote Coming Soon Banner */}
        <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-blue-100 text-blue-600 shrink-0">
              <Calculator size={22} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-bold text-slate-800">Live Insurance Quotes</h4>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase rounded-full tracking-wider">
                  Coming Soon
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Run live quotes directly from WinQuote (Canadian life insurance rate engine) and compare rates from multiple carriers — right from the Need Analysis form.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Summary Stats */}
      <section className="bg-slate-50 rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Financial Summary</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Total Assets</span>
            <span className="text-lg font-bold text-green-600">
              ${formatCurrency(
                num(form.rrsp) + num(form.tfsa) + num(form.houseValue) +
                form.otherAssets.reduce((s, a) => s + num(a.value), 0)
              )}
            </span>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Total Liabilities</span>
            <span className="text-lg font-bold text-red-600">
              ${formatCurrency(
                num(form.outstandingMortgage) + num(form.lineOfCredit) +
                num(form.creditCardDebt) + num(form.carLoan)
              )}
            </span>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Net Worth</span>
            <span className={`text-lg font-bold ${
              (num(form.rrsp) + num(form.tfsa) + num(form.houseValue) +
                form.otherAssets.reduce((s, a) => s + num(a.value), 0)) -
              (num(form.outstandingMortgage) + num(form.lineOfCredit) +
                num(form.creditCardDebt) + num(form.carLoan)) >= 0
                ? 'text-blue-600' : 'text-red-600'
            }`}>
              ${formatCurrency(
                num(form.rrsp) + num(form.tfsa) + num(form.houseValue) +
                form.otherAssets.reduce((s, a) => s + num(a.value), 0) -
                num(form.outstandingMortgage) - num(form.lineOfCredit) -
                num(form.creditCardDebt) - num(form.carLoan)
              )}
            </span>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Coverage Needed</span>
            <span className="text-lg font-bold text-purple-600">
              ${formatCurrency(form.desiredCoverage)}
            </span>
          </div>
        </div>
      </section>

      {/* Bottom Save */}
      <div className="flex justify-end pb-8 gap-3">
        <button
          onClick={handlePreviewPDF}
          disabled={pdfPreviewing}
          className="px-5 py-3 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {pdfPreviewing ? <Loader2 size={18} className="animate-spin" /> : <Eye size={18} />}
          Preview PDF
        </button>
        <button
          onClick={openSendModal}
          disabled={!isComplete}
          className="px-5 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={18} />
          Send to Client
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {saving ? 'Saving...' : 'Save Need Analysis'}
        </button>
      </div>
    </div>

    {showFamilyModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(23, 28, 31, 0.6)', backdropFilter: 'blur(8px)' }}
        onClick={(e) => { if (e.target === e.currentTarget) setShowFamilyModal(false) }}>
        <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-900">{editingFamilyMember ? 'Edit Family Member' : 'Add Family Member'}</h3>
            <button onClick={() => setShowFamilyModal(false)} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors">
              <X size={18} className="text-slate-500" />
            </button>
          </div>
          <form onSubmit={handleFamilySubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">First Name</label>
                <input type="text" required value={familyForm.firstName} onChange={e => setFamilyForm({ ...familyForm, firstName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Last Name</label>
                <input type="text" required value={familyForm.lastName} onChange={e => setFamilyForm({ ...familyForm, lastName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Relationship</label>
              <select value={familyForm.relationship} onChange={e => setFamilyForm({ ...familyForm, relationship: e.target.value })} required
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
              <input type="date" value={familyForm.dateOfBirth} onChange={e => setFamilyForm({ ...familyForm, dateOfBirth: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Email</label>
                <input type="email" value={familyForm.email} onChange={e => setFamilyForm({ ...familyForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Phone</label>
                <input type="text" value={familyForm.phone} onChange={e => setFamilyForm({ ...familyForm, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowFamilyModal(false)}
                className="px-5 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors">Cancel</button>
              <button type="submit"
                className="px-5 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:opacity-90 transition-all">{editingFamilyMember ? 'Update' : 'Add'} Member</button>
            </div>
          </form>
        </div>
      </div>
    )}

    {sendModalOpen && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }}
        onClick={(e) => { if (e.target === e.currentTarget && !sendingEmail) setSendModalOpen(false) }}
      >
        <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                <Send size={16} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Send Report to Client</h3>
                <p className="text-xs text-slate-500">PDF will be attached to the email</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => !sendingEmail && setSendModalOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors"
            >
              <X size={18} className="text-slate-500" />
            </button>
          </div>

          {sendResult?.ok ? (
            <div className="p-6 space-y-4">
              <div className="flex flex-col items-center text-center py-2">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-700 mb-3">
                  <CheckCircle size={28} />
                </div>
                <h4 className="text-base font-bold text-slate-800">Report Sent Successfully</h4>
                <p className="text-sm text-slate-500 mt-1">
                  A copy of the Need Analysis Report has been emailed to the client.
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Report ID</span>
                  <span className="font-bold text-slate-800">{sendResult.reportId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sent To</span>
                  <span className="font-bold text-slate-800">{sendResult.sentTo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sent At</span>
                  <span className="font-bold text-slate-800">
                    {new Date(sendResult.sentAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSendModalOpen(false)}
                className="w-full py-2.5 bg-slate-900 text-white rounded-lg font-semibold hover:bg-black transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <SendEmailForm
              lead={lead}
              defaultEmail={lead?.email || ''}
              sending={sendingEmail}
              error={sendResult?.ok === false ? sendResult.message : null}
              onSubmit={handleSendToClient}
              onCancel={() => !sendingEmail && setSendModalOpen(false)}
            />
          )}
        </div>
      </div>
    )}
  </div>
  )
}

function SendEmailForm({ lead, defaultEmail, sending, error, onSubmit, onCancel }) {
  const [email, setEmail] = useState(defaultEmail)
  useEffect(() => { setEmail(defaultEmail) }, [defaultEmail])
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(email) }}
      className="p-6 space-y-5"
    >
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        The full Need Analysis Report (PDF) will be generated and sent to the client with a secure review link.
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          Client Name
        </label>
        <input
          type="text"
          value={lead?.name || 'Valued Client'}
          readOnly
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-700"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          Client Email
        </label>
        <div className="relative">
          <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="client@example.com"
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          />
        </div>
      </div>
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={sending}
          className="px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={sending || !email}
          className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {sending ? 'Sending...' : 'Send Report'}
        </button>
      </div>
    </form>
  )
}
