import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  ArrowLeft,
  Send,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  AlertTriangle,
  Pencil,
  Trash2,
  Plus,
  Users,
  PlusCircle
} from 'lucide-react'

export default function LeadNeedAnalysis() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const lead = state?.lead

  if (!lead) {
    navigate('/admin/leads', { replace: true })
    return null
  }

  const [sendState, setSendState] = useState('idle')

  const handleSend = () => {
    setSendState('sending')
    setTimeout(() => {
      setSendState('sent')
      setTimeout(() => {
        setSendState('idle')
      }, 2000)
    }, 1500)
  }

  const leadId = lead.id || '#44829'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(`/admin/leads/${leadId.replace('#', '')}`, { state: { lead } })}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <span className="text-lg font-bold text-slate-900">Need Analysis Report — {lead.name}</span>
          <span className="text-slate-300 mx-1">/</span>
          <span className="text-sm text-slate-500">Lead ID: {leadId}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <FileText size={16} />
            Preview PDF
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={sendState !== 'idle'}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
              sendState === 'sent'
                ? 'bg-green-600 text-white'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {sendState === 'sending' ? (
              <>
                <Clock size={16} className="animate-spin" />
                Sending...
              </>
            ) : sendState === 'sent' ? (
              <>
                <CheckCircle size={16} />
                Sent
              </>
            ) : (
              <>
                <Send size={16} />
                Send to Client
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress Tracking */}
      <section className="bg-slate-50 border border-slate-200 rounded-xl p-6">
        <div className="max-w-[900px] mx-auto flex items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">REPORT COMPLETION: 65%</span>
              <span className="text-xs text-slate-500">3 of 6 Sections Complete</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 w-[65%] rounded-full transition-all duration-1000" />
            </div>
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1">
              <CheckCircle size={14} /> Profile
            </span>
            <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full flex items-center gap-1">
              <Clock size={14} /> Financials
            </span>
            <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full flex items-center gap-1">
              <AlertCircle size={14} /> Family
            </span>
          </div>
        </div>
      </section>

      {/* Report Card */}
      <div className="max-w-[900px] mx-auto">
        <article className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 min-h-[1200px] flex flex-col">
          {/* Logo & Header */}
          <div className="flex justify-between items-start mb-10">
            <div className="w-32 h-12 bg-blue-600/10 rounded-lg flex items-center justify-center">
              <span className="text-lg font-bold text-blue-600">LM</span>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-blue-600">Need Analysis Report</h2>
              <p className="text-sm text-slate-500">Generated: Oct 24, 2023</p>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-10 flex gap-3 rounded-r-lg">
            <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 italic">
              Disclaimer: This report is based on information provided by the client and is intended for illustrative purposes only. It does not constitute a formal financial plan or a contract of insurance.
            </p>
          </div>

          {/* Section 1: Client Profile */}
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-semibold text-blue-600">1. Client Profile</h3>
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div className="grid grid-cols-2 gap-y-4 gap-x-12 border-t border-slate-200 pt-4">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Full Name</span>
                <p className="text-base font-semibold text-slate-800">{lead.name}</p>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Date of Birth</span>
                <p className="text-base font-semibold text-slate-800">May 12, 1985 (38 Years)</p>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Occupation</span>
                <p className="text-base font-semibold text-slate-800">Software Engineer</p>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Marital Status</span>
                <p className="text-base font-semibold text-slate-800">Married</p>
              </div>
            </div>
          </section>

          {/* Section 2: Financial Overview */}
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-blue-600">2. Financial Overview</h3>
                <AlertCircle size={20} className="text-orange-500" />
              </div>
              <button className="text-blue-600 text-xs font-bold flex items-center gap-1 hover:underline">
                <Pencil size={14} /> Edit Data
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4 border-t border-slate-200 pt-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Annual Income</span>
                <span className="text-lg font-semibold text-slate-800">$145,000</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg">
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Total Assets</span>
                <span className="text-lg font-semibold text-slate-800">$320,000</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border border-dashed border-orange-400">
                <span className="text-[10px] font-bold text-orange-700 uppercase block mb-1">Total Liabilities</span>
                <span className="text-lg font-semibold text-slate-500 italic">Data Missing</span>
              </div>
            </div>
          </section>

          {/* Section 3: Existing Insurance */}
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-semibold text-blue-600">3. Existing Insurance</h3>
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <th className="py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Provider</th>
                  <th className="py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Coverage Amt</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="py-3 text-sm font-semibold text-slate-800">MetLife Insurance</td>
                  <td className="py-3 text-sm text-slate-600">Term Life (20 Year)</td>
                  <td className="py-3 text-sm font-semibold text-slate-800 text-right">$500,000</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 text-sm font-semibold text-slate-800">Prudential</td>
                  <td className="py-3 text-sm text-slate-600">Personal Accident</td>
                  <td className="py-3 text-sm font-semibold text-slate-800 text-right">$150,000</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Section 4: Recommended Products */}
          <section className="mb-10 p-6 bg-blue-50/30 rounded-xl border border-blue-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-blue-600">4. Recommended Products</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white rounded-lg shadow-sm">
                <thead>
                  <tr className="bg-blue-600 text-white">
                    <th className="p-3 text-left text-[11px] font-bold uppercase tracking-wider">Product Name</th>
                    <th className="p-3 text-right text-[11px] font-bold uppercase tracking-wider">Sum Assured</th>
                    <th className="p-3 text-right text-[11px] font-bold uppercase tracking-wider">Est. Premium</th>
                    <th className="p-3 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                    <td className="p-3">
                      <input className="bg-transparent border-none p-0 focus:ring-0 font-semibold w-full outline-none" type="text" defaultValue="Elite Protection Plus" />
                    </td>
                    <td className="p-3 text-right">
                      <input className="bg-transparent border-none p-0 focus:ring-0 font-semibold text-right w-full outline-none" type="text" defaultValue="$1,200,000" />
                    </td>
                    <td className="p-3 text-right">
                      <input className="bg-transparent border-none p-0 focus:ring-0 font-semibold text-right w-full outline-none" type="text" defaultValue="$285.50 /mo" />
                    </td>
                    <td className="p-3">
                      <button className="text-slate-400 hover:text-red-600 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                    <td className="p-3">
                      <input className="bg-transparent border-none p-0 focus:ring-0 font-semibold w-full outline-none" type="text" defaultValue="Critical Illness Advance" />
                    </td>
                    <td className="p-3 text-right">
                      <input className="bg-transparent border-none p-0 focus:ring-0 font-semibold text-right w-full outline-none" type="text" defaultValue="$250,000" />
                    </td>
                    <td className="p-3 text-right">
                      <input className="bg-transparent border-none p-0 focus:ring-0 font-semibold text-right w-full outline-none" type="text" defaultValue="$82.00 /mo" />
                    </td>
                    <td className="p-3">
                      <button className="text-slate-400 hover:text-red-600 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
              <button className="mt-4 w-full py-2 border-2 border-dashed border-blue-300 text-blue-600 font-bold rounded-lg hover:bg-blue-50/50 transition-colors flex items-center justify-center gap-2">
                <Plus size={16} />
                Add Custom Recommendation
              </button>
            </div>
          </section>

          {/* Section 5: Gap Analysis */}
          <section className="mb-10">
            <h3 className="text-lg font-semibold text-blue-600 mb-4">5. Gap Analysis</h3>
            <div className="grid grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-800">Income Protection Gap</span>
                    <span className="text-sm font-bold text-red-600">$700,000</span>
                  </div>
                  <div className="overflow-hidden h-4 rounded bg-slate-200 flex">
                    <div className="bg-blue-600 h-full" style={{ width: '42%' }} />
                    <div className="bg-red-200 h-full" style={{ width: '58%' }} />
                  </div>
                  <div className="flex justify-between text-[10px] mt-1 text-slate-500 uppercase font-bold">
                    <span>Existing: $500k</span>
                    <span>Goal: $1.2M</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-800">Critical Illness Gap</span>
                    <span className="text-sm font-bold text-red-600">$250,000</span>
                  </div>
                  <div className="overflow-hidden h-4 rounded bg-slate-200 flex">
                    <div className="bg-red-200 h-full" style={{ width: '100%' }} />
                  </div>
                  <div className="flex justify-between text-[10px] mt-1 text-slate-500 uppercase font-bold">
                    <span>Existing: $0</span>
                    <span>Goal: $250k</span>
                  </div>
                </div>
              </div>
              <div className="aspect-square bg-slate-50 rounded-lg p-4 flex flex-col items-center justify-center text-center">
                <div className="w-32 h-32 relative mb-4">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle className="stroke-current text-red-200" cx="18" cy="18" fill="none" r="16" strokeWidth="4" />
                    <circle className="stroke-current text-blue-600" cx="18" cy="18" fill="none" r="16" strokeDasharray="42 100" strokeWidth="4" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-xl font-bold text-blue-600 leading-none">42%</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Covered</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 px-4">
                  Based on current life stage goals, Mr. {lead.name.split(' ').pop()} is currently 58% under-insured for primary income protection.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6: Family Details (Missing) */}
          <section className="mb-10 bg-red-50/50 border border-red-200 rounded-xl p-8 text-center flex flex-col items-center">
            <Users size={48} className="text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">6. Family Details (Missing)</h3>
            <p className="text-sm text-slate-500 max-w-[400px] mb-6">
              Family dependency data is critical for accurate education funding and spouse protection analysis. Please complete this section to finalize the report.
            </p>
            <button className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-all flex items-center gap-2">
              <PlusCircle size={16} />
              Add Family Members
            </button>
          </section>

          {/* Footer Disclaimer */}
          <footer className="mt-auto pt-10 border-t border-slate-200">
            <div className="text-[10px] text-slate-500 leading-relaxed text-justify space-y-2">
              <p>
                This Need Analysis Report is an illustrative tool provided by LeadMaster Pro for agents to assist clients in identifying potential financial gaps. The figures presented are based on current market assumptions and the specific inputs provided during the client discovery phase. LeadMaster Pro makes no guarantees regarding the accuracy of future projections or the eligibility of the client for specific insurance products.
              </p>
              <p>
                Investment and insurance involves risks. Past performance is not indicative of future results. Clients should consult with qualified legal, tax, and financial advisors before making any major financial decisions. Confidentiality notice: This document contains sensitive personal and financial data. Unauthorized distribution or reproduction is strictly prohibited under Enterprise Privacy Protocols.
              </p>
            </div>
            <div className="mt-8 flex justify-between items-center text-xs text-slate-500">
              <span>LeadMaster Pro | 2023 | Confidential</span>
              <span>Page 1 of 1</span>
            </div>
          </footer>
        </article>
      </div>
    </div>
  )
}
