import { useState } from 'react'
import { RefreshCw, X, TrendingUp, Send, CheckCircle, Calculator } from 'lucide-react'
import { runQuote, selectQuote as apiSelectQuote, emailQuote as apiEmailQuote } from '../utils/leads.js'

export default function QuoteModal({ lead, onClose, onQuoteSaved }) {
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [quoteResults, setQuoteResults] = useState([])
  const [quoteError, setQuoteError] = useState(null)
  const [selectedQuote, setSelectedQuote] = useState(null)
  const [quoteSaving, setQuoteSaving] = useState(false)
  const [quoteConfirm, setQuoteConfirm] = useState(null)

  const leadId = lead?.id || lead?.uuid
  const leadName = lead?.name || `${lead?.firstName || ''} ${lead?.lastName || ''}`.trim() || 'Unknown Lead'

  const runQuoteSearch = async () => {
    setQuoteLoading(true)
    setQuoteError(null)
    setQuoteResults([])
    setSelectedQuote(null)
    setQuoteConfirm(null)
    try {
      const data = await runQuote(leadId, { deductible: 2500, limit: 5 })
      const currency = data?.currency || 'CHF'
      const results = (data?.quotes || []).map((q, i, arr) => {
        const premium = Number(q.premiumMonthly) || 0
        const minPremium = Math.min(...arr.map((x) => Number(x.premiumMonthly) || 0))
        return {
          internalId: q.id,
          quoteId: q.quoteId,
          name: q.carrier,
          carrier: q.carrier,
          model: q.model,
          premium,
          currency,
          coverage: `${currency} ${q.deductible?.toLocaleString?.() || q.deductible || '—'} deductible`,
          term: q.model || 'Standard',
          rating: 4.0 + (i % 5) * 0.1,
          isBest: premium === minPremium,
        }
      })
      setQuoteResults(results)
    } catch (err) {
      setQuoteError(err.message || 'Failed to fetch quotes from PrimAI')
    } finally {
      setQuoteLoading(false)
    }
  }

  const handleSelectQuote = (quote) => {
    setSelectedQuote(quote)
    setQuoteConfirm({
      quote,
      quoteInternalId: quote.internalId,
      quoteId: quote.quoteId,
      leadName,
      leadEmail: lead?.email,
    })
  }

  const handleConfirmQuote = async () => {
    if (!quoteConfirm) return
    setQuoteSaving(true)
    try {
      const selected = await apiSelectQuote(leadId, quoteConfirm.quoteInternalId)
      let emailResult = null
      let emailError = null
      try {
        emailResult = await apiEmailQuote(leadId, quoteConfirm.quoteInternalId, quoteConfirm.leadEmail)
      } catch (e) {
        emailError = e?.message || 'Email delivery failed'
      }
      const log = {
        action: 'quote_saved',
        details: {
          summary: emailResult
            ? `Quote ${selected.quoteId} saved & emailed to ${emailResult.clientEmail} — ${selected.carrier} at ${selected.premiumMonthly} ${selected.currency}/mo`
            : `Quote ${selected.quoteId} saved (email failed) — ${selected.carrier} at ${selected.premiumMonthly} ${selected.currency}/mo`,
          quoteInternalId: selected.id,
          quoteId: selected.quoteId,
          carrier: selected.carrier,
          premium: selected.premiumMonthly,
          currency: selected.currency,
          deductible: selected.deductible,
          model: selected.model,
          region: selected.region,
          emailedToClient: !!emailResult,
          clientEmail: emailResult?.clientEmail,
          emailError,
        },
      }
      if (onQuoteSaved) onQuoteSaved(log)
      if (emailResult) {
        alert(`Quote ${selected.quoteId} saved and emailed to ${emailResult.clientEmail} (${selected.premiumMonthly} ${selected.currency}/mo)`)
      } else {
        alert(`Quote ${selected.quoteId} saved, but the email could not be sent.\n\n${emailError || ''}\n\nCheck SMTP configuration.`)
      }
      onClose()
    } catch (err) {
      alert(err.message || 'Failed to save quote')
    } finally {
      setQuoteSaving(false)
    }
  }

  const handleClose = () => {
    setQuoteResults([])
    setSelectedQuote(null)
    setQuoteConfirm(null)
    setQuoteError(null)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="text-base font-semibold text-slate-900">Run Quote — {leadName}</h3>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors"
          >
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {quoteLoading && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <RefreshCw size={32} className="text-blue-600 animate-spin mb-4" />
              <p className="text-sm font-semibold text-slate-700">Fetching real quotes from PrimAI BAG API...</p>
              <p className="text-xs text-slate-400 mt-1">Querying Swiss health insurance carriers</p>
            </div>
          )}

          {quoteError && !quoteLoading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
              {quoteError}
            </div>
          )}

          {!quoteLoading && !quoteError && quoteResults.length === 0 && !quoteConfirm && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Calculator size={40} className="text-slate-300 mb-3" />
              <p className="text-sm font-semibold text-slate-700">Ready to fetch carrier quotes</p>
              <p className="text-xs text-slate-400 mt-1 mb-5 max-w-sm">
                We'll query the PrimAI BAG API (Swiss health insurance) based on this lead's age and location.
              </p>
              <button
                type="button"
                onClick={runQuoteSearch}
                className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <TrendingUp size={16} className="inline -mt-0.5 mr-1.5" />
                Fetch Quotes
              </button>
            </div>
          )}

          {!quoteLoading && quoteResults.length > 0 && !quoteConfirm && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                {quoteResults.length} real offers from PrimAI BAG API — best rate highlighted
              </p>
              {quoteResults.map((q) => (
                <div
                  key={q.internalId || q.quoteId}
                  className={`relative p-4 rounded-lg border-2 transition-all ${
                    selectedQuote?.internalId === q.internalId
                      ? 'border-blue-600 bg-blue-50'
                      : q.isBest
                        ? 'border-green-300 bg-green-50/50'
                        : 'border-slate-200 bg-white hover:border-blue-300'
                  }`}
                >
                  {q.isBest && (
                    <span className="absolute -top-2 right-3 bg-green-600 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                      Best Rate
                    </span>
                  )}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-bold text-slate-800">{q.carrier}</h4>
                        {q.model && (
                          <>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs text-slate-500 font-medium">{q.model}</span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {q.quoteId} • {q.coverage}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-800">{q.currency} {q.premium}<span className="text-xs font-normal text-slate-500">/mo</span></p>
                      <button
                        type="button"
                        onClick={() => handleSelectQuote(q)}
                        className={`mt-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                          selectedQuote?.internalId === q.internalId
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-900 text-white hover:bg-black'
                        }`}
                      >
                        {selectedQuote?.internalId === q.internalId ? 'Selected' : 'Select'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {quoteConfirm && (
            <div className="space-y-5">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">Confirm Quote</p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Review the details below. Saving will email the quote to the client.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quote ID</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{quoteConfirm.quoteId}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</p>
                  <p className="text-sm font-bold text-green-600 mt-0.5">Pending Send</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Carrier</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{quoteConfirm.quote.carrier}{quoteConfirm.quote.model ? ` (${quoteConfirm.quote.model})` : ''}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monthly Premium</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{quoteConfirm.quote.currency} {quoteConfirm.quote.premium}/mo</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Deductible</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">
                    {quoteConfirm.quote.currency} {Number(String(quoteConfirm.quote.coverage).match(/\d[\d,]*\d|\d/)?.[0]?.replace(/,/g, '') || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Model</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{quoteConfirm.quote.model || quoteConfirm.quote.term || '—'}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Send To Email</label>
                  <p className="text-[11px] text-slate-500 mb-1">Recipient: {quoteConfirm.leadName}</p>
                  <input
                    type="email"
                    value={quoteConfirm.leadEmail || ''}
                    onChange={(e) => setQuoteConfirm({ ...quoteConfirm, leadEmail: e.target.value })}
                    placeholder="client@example.com"
                    className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                  {!quoteConfirm.leadEmail && (
                    <p className="text-[11px] text-amber-600 mt-1">No email on file — please enter one to send the quote.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          {quoteConfirm ? (
            <>
              <button
                type="button"
                onClick={() => { setQuoteConfirm(null); setSelectedQuote(null) }}
                disabled={quoteSaving}
                className="px-5 py-2.5 text-slate-600 text-[13px] font-semibold rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmQuote}
                disabled={quoteSaving || !quoteConfirm?.leadEmail?.trim()}
                className="px-5 py-2.5 bg-green-600 text-white text-[13px] font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send size={14} />
                {quoteSaving ? 'Saving & Sending...' : 'Save & Send to Client'}
              </button>
            </>
          ) : quoteResults.length > 0 ? (
            <>
              <button
                type="button"
                onClick={() => { setQuoteResults([]); setSelectedQuote(null) }}
                className="px-5 py-2.5 text-slate-600 text-[13px] font-semibold rounded-lg hover:bg-slate-200 transition-colors"
              >
                Re-run Search
              </button>
              <button
                type="button"
                onClick={() => selectedQuote && handleSelectQuote(selectedQuote)}
                disabled={!selectedQuote}
                className="px-5 py-2.5 bg-blue-600 text-white text-[13px] font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
              >
                Continue with Selected
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 text-slate-600 text-[13px] font-semibold rounded-lg hover:bg-slate-200 transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
