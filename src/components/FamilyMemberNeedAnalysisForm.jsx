import { useState, useEffect } from 'react'
import { X, Save, Loader2, Home, Wallet, TrendingUp, Shield, Target, DollarSign, Eye, Send, FileText, CheckCircle, AlertTriangle } from 'lucide-react'
import { getNeedAnalysis, saveNeedAnalysis, sendNeedAnalysisToClient } from '../utils/persons.js'
import { previewNeedAnalysisPDF, getNeedAnalysisPDFBlob } from '../utils/needAnalysisPdf.js'
import { auth } from '../utils/auth.js'

const num = (val) => { const n = Number(String(val).replace(/[^0-9.\-]/g, '')); return isNaN(n) ? 0 : n }
const parseNum = (val) => { if (val === null || val === undefined || val === '') return null; const n = Number(String(val).replace(/[^0-9.\-]/g, '')); return isNaN(n) ? null : n }

function CurrencyInput({ label, value, onChange }) {
  const [raw, setRaw] = useState(value != null ? String(value) : '')
  useEffect(() => { setRaw(value != null ? String(value) : '') }, [value])
  return (
    <div>
      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">CHF</span>
        <input type="text" value={raw} placeholder="0"
          onChange={(e) => { setRaw(e.target.value); onChange(parseNum(e.target.value)) }}
          className="w-full pl-12 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
      </div>
    </div>
  )
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-slate-300'}`} onClick={() => onChange(!checked)}>
        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
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
  }
  return (
    <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border ${colors[color] || colors.blue}`}>
      <Icon size={16} />
      <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
    </div>
  )
}

function FieldRow({ children }) {
  return <div className="grid grid-cols-2 gap-4">{children}</div>
}

export default function FamilyMemberNeedAnalysisForm({ personId, member, onClose, onSaved }) {
  const isChild = member?.relationship === 'Child'
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState(null)
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
    totalHouseholdIncome: null,
    lifeInsurance: false,
    criticalIllness: false,
    disability: false,
    groupInsurance: false,
    groupInsuranceCoverage: null,
    groupInsuranceCompany: '',
    existingPolicies: [],
    desiredCoverage: null,
    budgetMonthly: null,
    coverageNotes: '',
    recommendedProducts: [],
  })

  useEffect(() => {
    (async () => {
      try {
        const existing = await getNeedAnalysis(personId, member?.id)
        if (existing) {
          setForm({ ...form, ...existing })
        } else if (!isChild) {
          const main = await getNeedAnalysis(personId).catch(() => null)
          if (main) {
            setForm((prev) => ({
              ...prev,
              ownHouse: main.ownHouse || false,
              houseValue: main.houseValue || null,
              mortgageRemaining: main.mortgageRemaining || null,
              outstandingMortgage: main.outstandingMortgage || null,
              monthlyExpenses: main.monthlyExpenses || null,
              totalHouseholdIncome: main.totalHouseholdIncome || null,
            }))
          }
        }
      } catch { /* ignore */ }
      setLoading(false)
    })()
  }, [personId, member?.id])

  const set = (field) => (val) => setForm((prev) => ({ ...prev, [field]: val }))

  const addOtherAsset = () => setForm((prev) => ({ ...prev, otherAssets: [...prev.otherAssets, { description: '', value: 0 }] }))
  const updateOtherAsset = (i, field) => (val) => setForm((prev) => {
    const arr = [...prev.otherAssets]; arr[i] = { ...arr[i], [field]: field === 'value' ? parseNum(val) : val }; return { ...prev, otherAssets: arr }
  })
  const removeOtherAsset = (i) => setForm((prev) => ({ ...prev, otherAssets: prev.otherAssets.filter((_, idx) => idx !== i) }))

  const addPolicy = () => setForm((prev) => ({ ...prev, existingPolicies: [...prev.existingPolicies, { provider: '', type: '', coverageAmount: 0, premium: 0 }] }))
  const updatePolicy = (i, field) => (val) => setForm((prev) => {
    const arr = [...prev.existingPolicies]; arr[i] = { ...arr[i], [field]: ['coverageAmount', 'premium'].includes(field) ? parseNum(val) : val }; return { ...prev, existingPolicies: arr }
  })
  const removePolicy = (i) => setForm((prev) => ({ ...prev, existingPolicies: prev.existingPolicies.filter((_, idx) => idx !== i) }))

  const addProduct = () => setForm((prev) => ({ ...prev, recommendedProducts: [...prev.recommendedProducts, { product: '', coverageAmount: null, proposedPremium: null, familyMemberId: member?.id || null }] }))
  const updateProduct = (i, field) => (val) => setForm((prev) => {
    const arr = [...prev.recommendedProducts]; arr[i] = { ...arr[i], [field]: ['coverageAmount', 'proposedPremium'].includes(field) ? parseNum(val) : val }; return { ...prev, recommendedProducts: arr }
  })
  const removeProduct = (i) => setForm((prev) => ({ ...prev, recommendedProducts: prev.recommendedProducts.filter((_, idx) => idx !== i) }))

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const ENTITY_FIELDS = ['id', 'personId', 'createdBy', 'createdByRole', 'createdAt', 'updatedAt', 'familyMember', 'person']
      const payload = {}
      for (const key of Object.keys(form)) {
        if (!ENTITY_FIELDS.includes(key)) {
          payload[key] = form[key]
        }
      }
      payload.familyMemberId = member?.id || null
      payload.annualIncomeSpouse = null
      payload.spouseName = null
      payload.spouseDOB = null
      payload.spouseOccupation = null
      payload.spouseIncome = null
      payload.children = []
      await saveNeedAnalysis(personId, payload)
      onSaved?.()
      onClose()
    } catch (err) {
      alert(err.message || 'Failed to save need analysis')
    }
    setSaving(false)
  }

  const handlePreviewPDF = () => {
    try {
      const memberLead = {
        name: `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Family Member',
        leadId: personId,
        email: member.email || '',
        phone: member.phone || '',
        maritalStatus: member.relationship === 'Spouse' ? 'Married' : null,
      }
      const session = auth.get()
      previewNeedAnalysisPDF(form, memberLead, session)
    } catch (err) {
      alert('Failed to generate PDF: ' + (err.message || 'Unknown error'))
    }
  }

  const handleSendToClient = async () => {
    if (sending) return
    setSending(true)
    setSendResult(null)
    try {
      const memberLead = {
        name: `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Family Member',
        leadId: personId,
        email: member.email || '',
        phone: member.phone || '',
        maritalStatus: member.relationship === 'Spouse' ? 'Married' : null,
      }
      const session = auth.get()
      const blob = getNeedAnalysisPDFBlob(form, memberLead, session)
      const reader = new FileReader()
      const base64 = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result.split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
      const result = await sendNeedAnalysisToClient(personId, { pdfBase64: base64, clientEmail: member.email || undefined, familyMemberId: member?.id || undefined })
      setSendResult({ ok: true, ...result })
    } catch (err) {
      setSendResult({ ok: false, message: err.message || 'Failed to send report' })
    }
    setSending(false)
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(23, 28, 31, 0.6)', backdropFilter: 'blur(4px)' }}>
        <div className="bg-white rounded-2xl p-8 flex items-center gap-3"><Loader2 size={20} className="animate-spin text-blue-600" /><span className="text-sm text-slate-500">Loading...</span></div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(23, 28, 31, 0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose() }}>
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900">Need Analysis — {member.firstName} {member.lastName}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{member.relationship} &middot; {member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No DOB'}</p>
          </div>
          <button onClick={onClose} disabled={saving} className="p-1.5 hover:bg-slate-200 rounded-full transition-colors"><X size={18} className="text-slate-500" /></button>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">

          {!isChild && (
            <>
              <SectionHeader icon={Home} title="Assets" color="blue" />
              <div className="space-y-3 pl-2">
                <Toggle label="Own a house?" checked={form.ownHouse} onChange={set('ownHouse')} />
                {form.ownHouse && (
                  <FieldRow>
                    <CurrencyInput label="House Value" value={form.houseValue} onChange={set('houseValue')} />
                    <CurrencyInput label="Mortgage Remaining" value={form.mortgageRemaining} onChange={set('mortgageRemaining')} />
                  </FieldRow>
                )}
                <FieldRow>
                  <CurrencyInput label="RRSP" value={form.rrsp} onChange={set('rrsp')} />
                  <CurrencyInput label="TFSA" value={form.tfsa} onChange={set('tfsa')} />
                </FieldRow>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Other Assets</span>
                    <button type="button" onClick={addOtherAsset} className="text-[11px] font-bold text-blue-600 hover:underline">+ Add</button>
                  </div>
                  {form.otherAssets.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 mb-2">
                      <input type="text" value={a.description} onChange={(e) => updateOtherAsset(i, 'description')(e.target.value)} placeholder="Description" className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                      <input type="text" value={a.value || ''} onChange={(e) => updateOtherAsset(i, 'value')(e.target.value)} placeholder="Value" className="w-28 px-3 py-1.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                      <button type="button" onClick={() => removeOtherAsset(i)} className="text-red-500 hover:text-red-700 text-sm font-bold px-1">&times;</button>
                    </div>
                  ))}
                </div>
              </div>

              <SectionHeader icon={Wallet} title="Liabilities" color="orange" />
              <div className="space-y-3 pl-2">
                <FieldRow>
                  <CurrencyInput label="Outstanding Mortgage" value={form.outstandingMortgage} onChange={set('outstandingMortgage')} />
                  <CurrencyInput label="Line of Credit" value={form.lineOfCredit} onChange={set('lineOfCredit')} />
                </FieldRow>
                <FieldRow>
                  <CurrencyInput label="Credit Card Debt" value={form.creditCardDebt} onChange={set('creditCardDebt')} />
                  <CurrencyInput label="Car Loan" value={form.carLoan} onChange={set('carLoan')} />
                </FieldRow>
                <CurrencyInput label="Monthly Expenses" value={form.monthlyExpenses} onChange={set('monthlyExpenses')} />
              </div>

              <SectionHeader icon={TrendingUp} title="Income" color="green" />
              <div className="space-y-3 pl-2">
                <CurrencyInput label="Annual Income" value={form.annualIncomePrimary} onChange={set('annualIncomePrimary')} />
                <CurrencyInput label="Total Household Income" value={form.totalHouseholdIncome} onChange={set('totalHouseholdIncome')} />
              </div>

              <SectionHeader icon={Shield} title="Existing Insurance" color="purple" />
              <div className="space-y-3 pl-2">
                <Toggle label="Life Insurance" checked={form.lifeInsurance} onChange={set('lifeInsurance')} />
                <Toggle label="Critical Illness" checked={form.criticalIllness} onChange={set('criticalIllness')} />
                <Toggle label="Disability Insurance" checked={form.disability} onChange={set('disability')} />
                <Toggle label="Group Insurance (Employer)" checked={form.groupInsurance} onChange={set('groupInsurance')} />
                {form.groupInsurance && (
                  <FieldRow>
                    <CurrencyInput label="Group Coverage" value={form.groupInsuranceCoverage} onChange={set('groupInsuranceCoverage')} />
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Company</label>
                      <input type="text" value={form.groupInsuranceCompany || ''} onChange={(e) => set('groupInsuranceCompany')(e.target.value)} placeholder="Employer name"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </FieldRow>
                )}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Existing Policies</span>
                    <button type="button" onClick={addPolicy} className="text-[11px] font-bold text-blue-600 hover:underline">+ Add</button>
                  </div>
                  {form.existingPolicies.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 mb-2">
                      <input type="text" value={p.provider} onChange={(e) => updatePolicy(i, 'provider')(e.target.value)} placeholder="Provider" className="w-24 px-3 py-1.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                      <input type="text" value={p.type} onChange={(e) => updatePolicy(i, 'type')(e.target.value)} placeholder="Type" className="w-24 px-3 py-1.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                      <input type="text" value={p.coverageAmount || ''} onChange={(e) => updatePolicy(i, 'coverageAmount')(e.target.value)} placeholder="Coverage" className="w-28 px-3 py-1.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                      <input type="text" value={p.premium || ''} onChange={(e) => updatePolicy(i, 'premium')(e.target.value)} placeholder="Premium" className="w-24 px-3 py-1.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                      <button type="button" onClick={() => removePolicy(i)} className="text-red-500 hover:text-red-700 text-sm font-bold px-1">&times;</button>
                    </div>
                  ))}
                </div>
              </div>

              <SectionHeader icon={Target} title="Coverage Requirements" color="blue" />
              <div className="space-y-3 pl-2">
                <FieldRow>
                  <CurrencyInput label="Desired Coverage Amount" value={form.desiredCoverage} onChange={set('desiredCoverage')} />
                  <CurrencyInput label="Monthly Budget" value={form.budgetMonthly} onChange={set('budgetMonthly')} />
                </FieldRow>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Notes</label>
                  <textarea value={form.coverageNotes || ''} onChange={(e) => set('coverageNotes')(e.target.value)} rows={2} placeholder="Additional notes..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                </div>
              </div>
            </>
          )}

          {isChild && (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700 mb-2">
                Showing age-appropriate fields for a {member.relationship?.toLowerCase()}.
              </div>
              <SectionHeader icon={Home} title="Education & Savings" color="blue" />
              <div className="space-y-3 pl-2">
                <Toggle label="Education Plan (RESP)" checked={form.educationPlansRESP} onChange={set('educationPlansRESP')} />
                {form.educationPlansRESP && (
                  <CurrencyInput label="Education Plan Amount" value={form.educationPlanAmount} onChange={set('educationPlanAmount')} />
                )}
                <Toggle label="Life Insurance for Child" checked={form.lifeInsuranceForKids} onChange={set('lifeInsuranceForKids')} />
              </div>

              <SectionHeader icon={Shield} title="Existing Policies" color="purple" />
              <div className="space-y-3 pl-2">
                <p className="text-xs text-slate-500">Any insurance policies purchased for this child.</p>
                {form.existingPolicies.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 mb-2">
                    <input type="text" value={p.provider} onChange={(e) => updatePolicy(i, 'provider')(e.target.value)} placeholder="Provider" className="w-24 px-3 py-1.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                    <input type="text" value={p.type} onChange={(e) => updatePolicy(i, 'type')(e.target.value)} placeholder="Type" className="w-24 px-3 py-1.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                    <input type="text" value={p.coverageAmount || ''} onChange={(e) => updatePolicy(i, 'coverageAmount')(e.target.value)} placeholder="Coverage" className="w-28 px-3 py-1.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                    <input type="text" value={p.premium || ''} onChange={(e) => updatePolicy(i, 'premium')(e.target.value)} placeholder="Premium" className="w-24 px-3 py-1.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                    <button type="button" onClick={() => removePolicy(i)} className="text-red-500 hover:text-red-700 text-sm font-bold px-1">&times;</button>
                  </div>
                ))}
                <button type="button" onClick={addPolicy} className="text-xs font-bold text-blue-600 hover:underline">+ Add Policy</button>
              </div>
            </>
          )}

          <SectionHeader icon={DollarSign} title="Recommended Products" color="green" />
          <div className="space-y-3 pl-2">
            {form.recommendedProducts.map((r, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <input type="text" value={r.product} onChange={(e) => updateProduct(i, 'product')(e.target.value)} placeholder="Product name" className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="text" value={r.coverageAmount || ''} onChange={(e) => updateProduct(i, 'coverageAmount')(e.target.value)} placeholder="Coverage CHF" className="w-28 px-3 py-1.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="text" value={r.proposedPremium || ''} onChange={(e) => updateProduct(i, 'proposedPremium')(e.target.value)} placeholder="Premium CHF" className="w-24 px-3 py-1.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                <button type="button" onClick={() => removeProduct(i)} className="text-red-500 hover:text-red-700 text-sm font-bold px-1">&times;</button>
              </div>
            ))}
            <button type="button" onClick={addProduct} className="text-xs font-bold text-blue-600 hover:underline">+ Add Recommended Product</button>
          </div>
        </form>

        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {sendResult && (
              sendResult.ok ? (
                <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-3 py-1.5 rounded-lg">
                  <CheckCircle size={14} /> Sent to {sendResult.sentTo}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-red-700 bg-red-50 px-3 py-1.5 rounded-lg">
                  <AlertTriangle size={14} /> {sendResult.message}
                </div>
              )
            )}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={handlePreviewPDF} disabled={saving || sending}
              className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5">
              <Eye size={13} /> Preview PDF
            </button>
            <button type="button" onClick={handleSendToClient} disabled={saving || sending}
              className="px-4 py-2 rounded-lg bg-green-600 text-white text-xs font-bold hover:opacity-90 transition-colors flex items-center gap-1.5">
              {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              {sending ? 'Sending...' : 'Send to Client'}
            </button>
            <button type="button" onClick={onClose} disabled={saving || sending}
              className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors">Cancel</button>
            <button type="submit" onClick={handleSave} disabled={saving || sending}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:opacity-90 transition-colors flex items-center gap-1.5">
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              {saving ? 'Saving...' : 'Save Need Analysis'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}