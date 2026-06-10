import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Users,
  Shield,
  Heart,
  TrendingUp,
  Plus,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  User,
  ChevronRight,
  ClipboardCheck,
  DollarSign,
} from 'lucide-react';
import { getPersonAsync } from '../../redux/personSlice';

const FamilyDashboard = () => {
  const { personId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { person, loading, error } = useSelector((state) => state.person);

  const [familyMembers, setFamilyMembers] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [needAnalyses, setNeedAnalyses] = useState([]);

  useEffect(() => {
    if (personId) {
      dispatch(getPersonAsync(personId));
    }
  }, [personId, dispatch]);

  useEffect(() => {
    if (person) {
      setFamilyMembers(person.familyMembers || []);
      setPolicies(person.policies || []);
      setQuotes(person.quotes || []);
      setOpportunities(person.opportunities || []);
      setNeedAnalyses(person.needAnalyses || []);
    }
  }, [person]);

  const getMemberPolicies = (memberId) =>
    policies.filter((p) => p.personId === memberId);

  const getMemberOpportunities = (memberId) =>
    opportunities.filter((o) => o.personId === memberId && o.status === 'open');

  const getMemberNeedAnalysis = (memberId) =>
    needAnalyses.find((na) => na.personId === memberId);

  const getMemberTotalCoverage = (memberId) => {
    const memberPolicies = getMemberPolicies(memberId);
    return memberPolicies.reduce((sum, p) => sum + (p.coverageAmount || 0), 0);
  };

  const getMemberTotalPremium = (memberId) => {
    const memberPolicies = getMemberPolicies(memberId);
    return memberPolicies.reduce((sum, p) => sum + (p.premium || 0), 0);
  };

  const hasProductType = (memberId, type) => {
    const memberPolicies = getMemberPolicies(memberId);
    return memberPolicies.some((p) => p.productType === type);
  };

  const totalFamilyPremium = familyMembers.reduce(
    (sum, m) => sum + getMemberTotalPremium(m.id),
    0
  );

  const allOpenOpportunities = familyMembers.flatMap((m) =>
    getMemberOpportunities(m.id).map((o) => ({ ...o, memberName: m.name }))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600">
        <AlertTriangle className="mx-auto mb-2" size={32} />
        <p>Error loading family data: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Family Tree Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center">
              <Users className="text-blue-600" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {person?.name || 'Family Dashboard'}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {person?.phase || 'Prospect'}
                </span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    person?.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {person?.status || 'Inactive'}
                </span>
                <span className="text-sm text-gray-500">
                  {familyMembers.length} family member{familyMembers.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/admin/family/${personId}/add-member`)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              <Plus size={16} />
              Add Member
            </button>
            <button
              onClick={() => navigate(`/admin/family/${personId}/quote`)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              <FileText size={16} />
              Run Quote
            </button>
            <button
              onClick={() => navigate(`/admin/family/${personId}/need-analysis`)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              <ClipboardCheck size={16} />
              Need Analysis
            </button>
          </div>
        </div>
      </div>

      {/* Family Tree Visual */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users size={20} />
          Family Members
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {familyMembers.map((member) => {
            const memberPolicies = getMemberPolicies(member.id);
            const memberOpps = getMemberOpportunities(member.id);
            const memberNA = getMemberNeedAnalysis(member.id);
            const totalCoverage = getMemberTotalCoverage(member.id);

            return (
              <div
                key={member.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                onClick={() => navigate(`/admin/person/${member.id}`)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <User size={18} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{member.name}</p>
                    <p className="text-xs text-gray-500">
                      {member.relationship} · {member.age ? `${member.age} yrs` : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-gray-600">
                      <Shield size={14} /> Policies
                    </span>
                    <span className="font-medium">
                      {memberPolicies.length}{' '}
                      <span className="text-gray-400 font-normal">
                        ({totalCoverage > 0 ? `$${(totalCoverage / 1000).toFixed(0)}k` : 'No coverage'})
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-gray-600">
                      <TrendingUp size={14} /> Open Opps
                    </span>
                    <span className="font-medium">{memberOpps.length}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-gray-600">
                      <ClipboardCheck size={14} /> Need Analysis
                    </span>
                    <span
                      className={`font-medium ${
                        memberNA?.status === 'completed' ? 'text-green-600' : 'text-gray-500'
                      }`}
                    >
                      {memberNA?.status === 'completed' ? 'Completed' : 'Not Started'}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Coverage Gaps</p>
                    <div className="flex gap-1">
                      {['Life', 'CI', 'Disability', 'Health'].map((type) => {
                        const hasType = hasProductType(
                          member.id,
                          type.toLowerCase().replace('ci', 'critical_illness')
                        );
                        return (
                          <span
                            key={type}
                            className={`text-xs px-1.5 py-0.5 rounded ${
                              hasType
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {type}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Family Coverage Summary Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield size={20} />
          Family Coverage Summary
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Member
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Life
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Critical Illness
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Disability
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Health
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Total Premium
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {familyMembers.map((member) => {
                const totalPremium = getMemberTotalPremium(member.id);
                return (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <User size={14} className="text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{member.name}</p>
                          <p className="text-xs text-gray-500">{member.relationship}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {hasProductType(member.id, 'life') ? (
                        <CheckCircle2 size={18} className="inline text-green-600" />
                      ) : (
                        <XCircle size={18} className="inline text-red-400" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {hasProductType(member.id, 'critical_illness') ? (
                        <CheckCircle2 size={18} className="inline text-green-600" />
                      ) : (
                        <XCircle size={18} className="inline text-red-400" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {hasProductType(member.id, 'disability') ? (
                        <CheckCircle2 size={18} className="inline text-green-600" />
                      ) : (
                        <XCircle size={18} className="inline text-red-400" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {hasProductType(member.id, 'health') ? (
                        <CheckCircle2 size={18} className="inline text-green-600" />
                      ) : (
                        <XCircle size={18} className="inline text-red-400" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-medium text-gray-900">
                        ${totalPremium.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-gray-50 font-semibold">
                <td className="px-4 py-3 text-sm text-gray-900">Total</td>
                <td className="px-4 py-3" />
                <td className="px-4 py-3" />
                <td className="px-4 py-3" />
                <td className="px-4 py-3" />
                <td className="px-4 py-3 text-right text-sm text-gray-900">
                  ${totalFamilyPremium.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Opportunities Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp size={20} />
            Open Opportunities ({allOpenOpportunities.length})
          </h2>
        </div>
        {allOpenOpportunities.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No open opportunities across family members.
          </p>
        ) : (
          <div className="space-y-2">
            {allOpenOpportunities.map((opp) => (
              <div
                key={opp.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate(`/admin/opportunity/${opp.id}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <TrendingUp size={14} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{opp.title || opp.type}</p>
                    <p className="text-xs text-gray-500">Member: {opp.memberName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    {opp.priority || 'Medium'}
                  </span>
                  <ChevronRight size={16} className="text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Heart size={20} />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate(`/admin/family/${personId}/add-member`)}
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
          >
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Plus size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Add Family Member</p>
              <p className="text-xs text-gray-500">Register a new family member</p>
            </div>
          </button>

          <button
            onClick={() => navigate(`/admin/family/${personId}/quote`)}
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
          >
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <FileText size={18} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Run Quote</p>
              <p className="text-xs text-gray-500">Generate insurance quotes</p>
            </div>
          </button>

          <button
            onClick={() => navigate(`/admin/family/${personId}/need-analysis`)}
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
          >
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
              <ClipboardCheck size={18} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Start Need Analysis</p>
              <p className="text-xs text-gray-500">Identify coverage gaps</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FamilyDashboard;
