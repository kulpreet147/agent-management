import { useState, useEffect } from 'react'
import { Users, Shield, Heart, TrendingUp, ChevronRight, User, DollarSign, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { getFamilyMembers, getPolicies, getQuotes } from '../../utils/persons.js'

export default function LeadFamilyDashboardTab({ personId, lead }) {
  const [familyMembers, setFamilyMembers] = useState([])
  const [policies, setPolicies] = useState([])
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedMember, setExpandedMember] = useState(null)

  useEffect(() => {
    if (!personId) return
    setLoading(true)
    Promise.all([
      getFamilyMembers(personId).catch(() => []),
      getPolicies(personId).catch(() => []),
      getQuotes(personId).catch(() => []),
    ]).then(([members, pols, qts]) => {
      setFamilyMembers(Array.isArray(members) ? members : [])
      setPolicies(Array.isArray(pols) ? pols : [])
      setQuotes(Array.isArray(qts) ? qts : [])
    }).finally(() => setLoading(false))
  }, [personId])

  const getMemberPolicies = (memberId) =>
    policies.filter((p) => p.familyMemberId === memberId || p.personId === memberId)

  const getMemberTotalCoverage = (memberId) => {
    const memberPolicies = getMemberPolicies(memberId)
    return memberPolicies.reduce((sum, p) => sum + (Number(p.coverageAmount) || 0), 0)
  }

  const getMemberTotalPremium = (memberId) => {
    const memberPolicies = getMemberPolicies(memberId)
    return memberPolicies.reduce((sum, p) => sum + (Number(p.premium) || 0), 0)
  }

  const hasProductType = (memberId, type) =>
    getMemberPolicies(memberId).some((p) => (p.productType || p.policyType) === type)

  const totalFamilyPremium = familyMembers.reduce((sum, m) => sum + getMemberTotalPremium(m.id || m.familyMemberId), 0)
  const totalFamilyCoverage = familyMembers.reduce((sum, m) => sum + getMemberTotalCoverage(m.id || m.familyMemberId), 0)

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3" />
        <span className="text-sm text-slate-500">Loading family dashboard...</span>
      </div>
    )
  }

  if (familyMembers.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
        <Users size={48} className="mx-auto text-slate-300 mb-3" />
        <h3 className="text-base font-bold text-slate-800 mb-2">Family Dashboard</h3>
        <p className="text-sm text-slate-500 mb-4">Add family members first to see the family coverage dashboard.</p>
        <p className="text-xs text-slate-400">Go to the Family tab to add members.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase">Family Members</p>
              <p className="text-2xl font-bold text-slate-900">{familyMembers.length}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {familyMembers.map((m) => (
              <span key={m.id} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded-full">
                {m.firstName}
              </span>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Shield size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase">Total Coverage</p>
              <p className="text-2xl font-bold text-slate-900">CHF {totalFamilyCoverage.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">{policies.length} active polic{policies.length === 1 ? 'y' : 'ies'}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <DollarSign size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase">Total Premium</p>
              <p className="text-2xl font-bold text-slate-900">CHF {totalFamilyPremium.toLocaleString()}/mo</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">Per month across all members</p>
        </div>
      </div>

      {/* Family Tree */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-800">Family Coverage Overview</h3>
        </div>
        <div className="divide-y divide-slate-200">
          {/* Primary (Lead) */}
          <div className="px-6 py-4 bg-blue-50/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                  <User size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{lead?.name || 'Primary'}</p>
                  <p className="text-[11px] text-slate-500">Primary Applicant</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400" />
            </div>
          </div>

          {/* Family Members */}
          {familyMembers.map((member) => {
            const isExpanded = expandedMember === member.id
            const memberPolicies = getMemberPolicies(member.id || member.familyMemberId)
            const coverage = getMemberTotalCoverage(member.id || member.familyMemberId)
            const premium = getMemberTotalPremium(member.id || member.familyMemberId)
            const hasLife = hasProductType(member.id || member.familyMemberId, 'Term Life') || hasProductType(member.id || member.familyMemberId, 'Life')
            const hasCI = hasProductType(member.id || member.familyMemberId, 'Critical Illness')
            const hasHealth = hasProductType(member.id || member.familyMemberId, 'Health')

            return (
              <div key={member.id}>
                <div
                  className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => setExpandedMember(isExpanded ? null : member.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                      <User size={18} className="text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{member.firstName} {member.lastName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-slate-500">{member.relationship}</span>
                        <span className="text-[11px] text-slate-400">|</span>
                        <div className="flex items-center gap-1.5">
                          {hasLife && <Heart size={12} className="text-red-400" title="Life Insurance" />}
                          {hasCI && <AlertTriangle size={12} className="text-amber-400" title="Critical Illness" />}
                          {hasHealth && <Shield size={12} className="text-green-400" title="Health" />}
                          {!hasLife && !hasCI && !hasHealth && (
                            <span className="text-[10px] text-slate-400 italic">No coverage</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">CHF {coverage.toLocaleString()}</p>
                    <p className="text-[11px] text-slate-500">{memberPolicies.length} polic{memberPolicies.length === 1 ? 'y' : 'ies'}</p>
                  </div>
                </div>
                {isExpanded && memberPolicies.length > 0 && (
                  <div className="px-16 py-3 bg-slate-50 border-t border-slate-200 space-y-2">
                    {memberPolicies.map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <Shield size={12} className="text-blue-500" />
                          <span className="text-slate-700 font-medium">{p.policyType || p.productType}</span>
                          {p.carrier && <span className="text-slate-500">({p.carrier})</span>}
                        </span>
                        <span className="font-semibold text-slate-800">CHF {Number(p.premium || 0).toLocaleString()}/mo</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Coverage Gaps Alert */}
      {familyMembers.some((m) => {
        const mPolicies = getMemberPolicies(m.id || m.familyMemberId)
        return mPolicies.length === 0
      }) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800">Coverage Gaps Detected</p>
            <p className="text-xs text-amber-700 mt-1">
              {familyMembers.filter((m) => getMemberPolicies(m.id || m.familyMemberId).length === 0).map((m) => m.firstName).join(', ')} {familyMembers.filter((m) => getMemberPolicies(m.id || m.familyMemberId).length === 0).length === 1 ? 'has' : 'have'} no active policies. Consider reviewing their insurance needs.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
