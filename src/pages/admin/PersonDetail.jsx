import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Heart,
  Shield,
  ChevronDown,
  ChevronRight,
  Edit,
  Plus,
  Trash2,
  RefreshCw,
  Clock,
  StickyNote,
  FileText,
  Calculator,
  TrendingUp,
  Users,
  CheckCircle,
  X,
  Download,
  Upload,
  Search,
  AlertTriangle,
  ClipboardCheck,
  ExternalLink,
  Star,
  Activity,
  Hash,
  AlertCircle,
  MoreVertical,
  ArrowRight,
} from 'lucide-react'
import {
  getPersonAsync,
  getFollowUpsAsync,
  getActivityLogsAsync,
  getStatusHistoryAsync,
  updatePersonStatusAsync,
  getNeedAnalysisAsync,
  getQuotesAsync,
  getOpportunitiesAsync,
  getFamilyMembersAsync,
  getPoliciesAsync,
  clearSelectedPerson,
} from '../../redux/personSlice.js'
import {
  createFollowUp,
  addNote,
  getNotes,
  getDocuments,
  addFamilyMember,
  updateFamilyMember,
  removeFamilyMember,
  addPolicy,
  removePolicy,
  assignAgents,
  getQuotes,
} from '../../utils/persons.js'

const formatTimeAgo = (dateString) => {
  if (!dateString) return 'Unknown'
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now - date) / 1000)
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const formatFullDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

const actionLabels = {
  person_created: 'Person Created',
  status_changed: 'Status Changed',
  follow_up_added: 'Follow-Up Scheduled',
  follow_up_completed: 'Follow-Up Completed',
  follow_up_skipped: 'Follow-Up Skipped',
  note_added: 'Note Added',
  policy_added: 'Policy Added',
  policy_updated: 'Policy Updated',
  policy_removed: 'Policy Removed',
  family_member_added: 'Family Member Added',
  family_member_updated: 'Family Member Updated',
  family_member_removed: 'Family Member Removed',
  quote_run: 'Quote Run',
  quote_selected: 'Quote Selected',
  quote_emailed: 'Quote Sent',
  need_analysis_saved: 'Need Analysis Updated',
  need_analysis_sent: 'Need Analysis Sent',
  document_uploaded: 'Document Uploaded',
  agent_assigned: 'Agent Assigned',
  agent_reassigned: 'Agent Reassigned',
  opportunity_created: 'Opportunity Created',
  opportunity_updated: 'Opportunity Updated',
  opportunity_won: 'Opportunity Won',
  opportunity_lost: 'Opportunity Lost',
}

const actionIcons = {
  person_created: CheckCircle,
  status_changed: Activity,
  follow_up_added: Calendar,
  follow_up_completed: CheckCircle,
  follow_up_skipped: X,
  note_added: StickyNote,
  policy_added: Shield,
  policy_updated: Shield,
  policy_removed: Trash2,
  family_member_added: Users,
  family_member_updated: Users,
  family_member_removed: Users,
  quote_run: Calculator,
  quote_selected: Star,
  quote_emailed: Mail,
  need_analysis_saved: FileText,
  need_analysis_sent: Mail,
  document_uploaded: FileText,
  agent_assigned: User,
  agent_reassigned: Users,
  opportunity_created: TrendingUp,
  opportunity_updated: TrendingUp,
  opportunity_won: CheckCircle,
  opportunity_lost: X,
}

const formatDetails = (action, details) => {
  if (!details || typeof details !== 'object') return null
  const d = { ...details }
  switch (action) {
    case 'status_changed':
      return d.fromStatus && d.toStatus
        ? `Changed from "${d.fromStatus}" to "${d.toStatus}"`
        : d.toStatus
          ? `Status changed to "${d.toStatus}"`
          : null
    case 'follow_up_added':
    case 'follow_up_created':
      return d.type ? `Type: ${d.type}` : null
    case 'follow_up_completed':
      return d.outcome ? `Outcome: ${d.outcome}` : null
    case 'note_added':
      return d.content ? `"${d.content}"` : null
    case 'policy_added':
      return d.policyNumber ? `Policy ${d.policyNumber} (${d.policyType || 'Unknown type'})` : null
    case 'policy_removed':
      return d.policyNumber ? `Removed policy ${d.policyNumber}` : null
    case 'family_member_added':
    case 'family_member_updated':
      return d.name ? d.name : null
    case 'quote_run':
      return d.carrierCount ? `Found ${d.carrierCount} quotes` : null
    case 'quote_selected':
      return d.carrier && d.premium ? `${d.carrier} at CHF ${d.premium}/mo` : null
    case 'need_analysis_saved':
      if (d.fields && Array.isArray(d.fields)) {
        return `Updated ${d.fields.length} fields`
      }
      return 'Need analysis updated'
    case 'agent_reassigned':
      return d.targetAgentName ? `Reassigned to ${d.targetAgentName}` : null
    default: {
      const skip = [
        'fromStatus', 'toStatus', 'isNew', 'delivered', 'personId',
        'followUpId', 'agentId', 'targetAgentId', 'fromAgentId',
        'agentName', 'targetAgentName', 'fromAgentName',
      ]
      const nonMeta = Object.fromEntries(Object.entries(d).filter(([k]) => !skip.includes(k)))
      if (Object.keys(nonMeta).length === 0) return null
      return Object.entries(nonMeta)
        .map(([k, v]) => {
          if (v === null || v === undefined || v === false) return null
          const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())
          if (Array.isArray(v)) return `${label}: ${v.join(', ')}`
          if (typeof v === 'object') return `${label}: ${JSON.stringify(v)}`
          return `${label}: ${v}`
        })
        .filter(Boolean)
        .join(' • ')
    }
  }
}

const docCategoryStyles = {
  Application: { badge: 'bg-blue-50 text-blue-600', iconBg: 'bg-blue-50', iconText: 'text-blue-600' },
  ID: { badge: 'bg-green-50 text-green-600', iconBg: 'bg-green-50', iconText: 'text-green-600' },
  'Policy Docs': { badge: 'bg-sky-50 text-sky-600', iconBg: 'bg-sky-50', iconText: 'text-sky-600' },
  'Signed Forms': { badge: 'bg-purple-50 text-purple-600', iconBg: 'bg-purple-50', iconText: 'text-purple-600' },
  Supporting: { badge: 'bg-amber-50 text-amber-600', iconBg: 'bg-amber-50', iconText: 'text-amber-600' },
}

const statusColors = {
  new: 'bg-blue-100 text-blue-700 border-blue-200',
  contacted: 'bg-sky-100 text-sky-700 border-sky-200',
  qualified: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  proposal: 'bg-violet-100 text-violet-700 border-violet-200',
  negotiation: 'bg-purple-100 text-purple-700 border-purple-200',
  closed_won: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  closed_lost: 'bg-red-100 text-red-600 border-red-200',
  converted: 'bg-green-100 text-green-700 border-green-200',
  inactive: 'bg-gray-100 text-gray-600 border-gray-200',
}

const leadStatuses = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'converted', 'inactive']
const customerStatuses = ['active', 'inactive', 'churned']

export default function PersonDetail() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { personId } = useParams()

  const person = useSelector((s) => s.person.selectedPerson)
  const loading = useSelector((s) => s.person.getPersonLoading)
  const error = useSelector((s) => s.person.getPersonError)

  const familyMembers = useSelector((s) => s.person.familyMembers)
  const policies = useSelector((s) => s.person.policies)
  const quotes = useSelector((s) => s.person.quotes)
  const opportunities = useSelector((s) => s.person.opportunities)
  const followUps = useSelector((s) => s.person.followUps)
  const activityLogs = useSelector((s) => s.person.activityLogs)
  const statusHistory = useSelector((s) => s.person.statusHistory)
  const needAnalysis = useSelector((s) => s.person.needAnalysis)

  const [activeTab, setActiveTab] = useState(0)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showFollowUpModal, setShowFollowUpModal] = useState(false)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [showFamilyModal, setShowFamilyModal] = useState(false)
  const [showPolicyModal, setShowPolicyModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [documentsList, setDocumentsList] = useState([])
  const [notesList, setNotesList] = useState([])
  const [timelineFilter, setTimelineFilter] = useState('All')
  const [docSearch, setDocSearch] = useState('')

  const [followUpForm, setFollowUpForm] = useState({
    type: 'call',
    scheduledAt: '',
    notes: '',
  })
  const [noteContent, setNoteContent] = useState('')
  const [familyForm, setFamilyForm] = useState({
    firstName: '',
    lastName: '',
    relationship: '',
    dateOfBirth: '',
    email: '',
    phone: '',
  })
  const [policyForm, setPolicyForm] = useState({
    policyNumber: '',
    policyType: '',
    carrier: '',
    product: '',
    effectiveDate: '',
    renewalDate: '',
    expiryDate: '',
    premium: '',
    status: 'active',
  })

  useEffect(() => {
    if (!personId) {
      navigate('/admin/persons', { replace: true })
      return
    }
    dispatch(getPersonAsync(personId))
    dispatch(getFollowUpsAsync(personId))
    dispatch(getActivityLogsAsync(personId))
    dispatch(getStatusHistoryAsync(personId))
    dispatch(getNeedAnalysisAsync(personId))
    dispatch(getQuotesAsync(personId))
    dispatch(getOpportunitiesAsync(personId))
    dispatch(getFamilyMembersAsync(personId))
    dispatch(getPoliciesAsync(personId))

    getNotes(personId)
      .then((data) => setNotesList(Array.isArray(data) ? data : []))
      .catch(() => setNotesList([]))
    getDocuments(personId)
      .then((data) => setDocumentsList(Array.isArray(data) ? data : []))
      .catch(() => setDocumentsList([]))

    return () => dispatch(clearSelectedPerson())
  }, [personId, dispatch])

  const isLead = person?.phase === 'lead'
  const isCustomer = person?.phase === 'customer'

  const handleStatusChange = async (newStatus) => {
    try {
      await dispatch(updatePersonStatusAsync({ id: personId, status: newStatus, notes: '' })).unwrap()
      setShowStatusDropdown(false)
    } catch (err) {
      alert(err.message || 'Failed to update status')
    }
  }

  const handleAddFollowUp = async (e) => {
    e.preventDefault()
    try {
      await createFollowUp(personId, followUpForm)
      dispatch(getFollowUpsAsync(personId))
      setShowFollowUpModal(false)
      setFollowUpForm({ type: 'call', scheduledAt: '', notes: '' })
    } catch (err) {
      alert(err.message || 'Failed to add follow-up')
    }
  }

  const handleAddNote = async () => {
    if (!noteContent.trim()) return
    try {
      await addNote(personId, noteContent.trim())
      const updated = await getNotes(personId).catch(() => [])
      setNotesList(Array.isArray(updated) ? updated : [])
      setNoteContent('')
      setShowNoteModal(false)
    } catch (err) {
      alert(err.message || 'Failed to add note')
    }
  }

  const handleAddFamilyMember = async (e) => {
    e.preventDefault()
    try {
      await addFamilyMember(personId, familyForm)
      dispatch(getFamilyMembersAsync(personId))
      setShowFamilyModal(false)
      setFamilyForm({ firstName: '', lastName: '', relationship: '', dateOfBirth: '', email: '', phone: '' })
    } catch (err) {
      alert(err.message || 'Failed to add family member')
    }
  }

  const handleRemoveFamilyMember = async (memberId) => {
    if (!window.confirm('Remove this family member?')) return
    try {
      await removeFamilyMember(personId, memberId)
      dispatch(getFamilyMembersAsync(personId))
    } catch (err) {
      alert(err.message || 'Failed to remove family member')
    }
  }

  const handleAddPolicy = async (e) => {
    e.preventDefault()
    if (!policyForm.policyNumber || !policyForm.policyType) {
      alert('Policy number and type are required')
      return
    }
    try {
      await addPolicy(personId, policyForm)
      dispatch(getPoliciesAsync(personId))
      setShowPolicyModal(false)
      setPolicyForm({
        policyNumber: '', policyType: '', carrier: '', product: '',
        effectiveDate: '', renewalDate: '', expiryDate: '', premium: '', status: 'active',
      })
    } catch (err) {
      alert(err.message || 'Failed to add policy')
    }
  }

  const handleRemovePolicy = async (policyId) => {
    if (!window.confirm('Remove this policy?')) return
    try {
      await removePolicy(personId, policyId)
      dispatch(getPoliciesAsync(personId))
    } catch (err) {
      alert(err.message || 'Failed to remove policy')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw size={20} className="animate-spin text-blue-600 mr-2" />
        <p className="text-slate-500 text-sm">Loading person details...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <AlertCircle size={40} className="mx-auto text-red-400 mb-4" />
        <p className="text-slate-700 font-semibold mb-2">Failed to load person</p>
        <p className="text-slate-500 text-sm mb-4">{error}</p>
        <button
          onClick={() => navigate('/admin/persons')}
          className="text-blue-600 font-semibold text-sm hover:underline"
        >
          Back to persons
        </button>
      </div>
    )
  }

  if (!person) {
    return (
      <div className="text-center py-20">
        <User size={40} className="mx-auto text-slate-300 mb-4" />
        <p className="text-slate-500 mb-4">Person not found</p>
        <button
          onClick={() => navigate('/admin/persons')}
          className="text-blue-600 font-semibold text-sm hover:underline"
        >
          Back to persons
        </button>
      </div>
    )
  }

  const fullName = `${person.firstName || ''} ${person.lastName || ''}`.trim() || 'Unknown'

  const tabs = [
    { label: 'Overview', icon: Activity },
    { label: 'Family', icon: Users },
    { label: 'Policies', icon: Shield },
    { label: 'Quotes', icon: Calculator },
    { label: 'Need Analysis', icon: FileText },
    { label: 'Opportunities', icon: TrendingUp },
    { label: 'Follow-ups', icon: Calendar },
    { label: 'Activity', icon: ClipboardCheck },
    { label: 'Notes', icon: StickyNote },
    { label: 'Documents', icon: FileText },
  ]

  const availableStatuses = isLead ? leadStatuses : isCustomer ? customerStatuses : leadStatuses

  const initials = `${(person.firstName || '')[0] || ''}${(person.lastName || '')[0] || ''}`.toUpperCase()

  const activePolicies = policies.filter((p) => p.status === 'active').length
  const activeOpportunities = opportunities.filter((o) => o.status !== 'won' && o.status !== 'lost').length
  const totalQuotes = quotes.length

  return (
    <div className="flex gap-6 min-h-[calc(100vh-120px)]">
      {/* ==================== LEFT SIDEBAR ==================== */}
      <div className="w-80 shrink-0 space-y-4">
        {/* Back + Avatar + Name */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors mb-3 inline-flex"
            >
              <ArrowLeft size={16} className="text-slate-500" />
            </button>

            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-xl shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <h1 className="text-base font-bold text-slate-900 truncate">{fullName}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full border ${
                    isLead
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {person.phase || 'lead'}
                  </span>
                  <span className="text-xs text-slate-400">
                    #{person.personId || person.id || personId}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Status Dropdown */}
          <div className="px-5 pb-4">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-blue-300 transition-colors"
              >
                <span className={`px-2 py-0.5 text-[11px] font-bold uppercase rounded ${
                  statusColors[person.status] || 'bg-slate-100 text-slate-600'
                }`}>
                  {(person.status || 'new').replace(/_/g, ' ')}
                </span>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showStatusDropdown && (
                <div className="absolute z-20 top-full mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg py-1">
                  {availableStatuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => handleStatusChange(status)}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors ${
                        person.status === status ? 'font-bold bg-blue-50 text-blue-700' : 'text-slate-700'
                      }`}
                    >
                      {status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Status History */}
          {statusHistory.length > 0 && (
            <div className="px-5 pb-4 border-t border-slate-100 pt-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Recent Changes</p>
              <div className="space-y-2">
                {statusHistory.slice(0, 3).map((sh, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                    <span>
                      {(sh.fromStatus || 'new').replace(/_/g, ' ')} → {(sh.toStatus || sh.status || '').replace(/_/g, ' ')}
                    </span>
                    <span className="text-slate-400 ml-auto whitespace-nowrap">{formatTimeAgo(sh.changedAt || sh.createdAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">Contact Information</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Phone size={15} className="text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Phone</p>
                <p className="text-sm font-medium text-slate-800">{person.phone || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail size={15} className="text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Email</p>
                <p className="text-sm font-medium text-slate-800 break-all">{person.email || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar size={15} className="text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Date of Birth</p>
                <p className="text-sm font-medium text-slate-800">{person.dateOfBirth ? formatFullDate(person.dateOfBirth) : 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin size={15} className="text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Address</p>
                <p className="text-sm font-medium text-slate-800">{person.address || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Personal Details */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">Personal Details</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Marital Status</span>
              <span className="text-sm font-medium text-slate-800">{person.maritalStatus || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Residency</span>
              <span className="text-sm font-medium text-slate-800">{person.residencyStatus || 'N/A'}</span>
            </div>
            {person.smoking !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Smoking</span>
                <span className="text-sm font-medium text-slate-800">{person.smoking ? 'Yes' : 'No'}</span>
              </div>
            )}
            {person.alcohol !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Alcohol</span>
                <span className="text-sm font-medium text-slate-800">{person.alcohol ? 'Yes' : 'No'}</span>
              </div>
            )}
            {person.healthIssues && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Health Issues</span>
                <span className="text-sm font-medium text-slate-800">{person.healthIssues}</span>
              </div>
            )}
          </div>
        </div>

        {/* Occupation/Employer */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">Occupation</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Briefcase size={15} className="text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Occupation</p>
                <p className="text-sm font-medium text-slate-800">{person.occupation || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Briefcase size={15} className="text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Employer</p>
                <p className="text-sm font-medium text-slate-800">{person.employer || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Agents */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Assigned Agents</h3>
            <button
              type="button"
              onClick={() => setShowAssignModal(true)}
              className="text-blue-600 text-xs font-bold hover:underline flex items-center gap-1"
            >
              <Plus size={12} /> Edit
            </button>
          </div>
          <div className="space-y-3">
            {(person.assignments || []).filter((a) => a.isActive).length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-2">Unassigned</p>
            ) : (
              (person.assignments || []).filter((a) => a.isActive).map((a, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-[10px] font-bold">
                      {(a.agentName || a.agentId || 'A').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{a.agentName || a.agentId}</p>
                      {a.agentRole && <p className="text-[10px] text-slate-400">{a.agentRole}</p>}
                    </div>
                  </div>
                  <span className="text-xs font-bold text-blue-600">{a.commissionShare || 0}%</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ==================== MAIN CONTENT ==================== */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Header Bar */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Hash size={16} className="text-slate-400" />
              <span className="text-sm font-medium text-slate-500">{person.personId || person.id}</span>
              <span className="text-slate-300">|</span>
              <span className="text-sm font-semibold text-slate-800">{fullName}</span>
              <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full border ${
                isLead
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {person.phase || 'lead'}
              </span>
              <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded ${
                statusColors[person.status] || 'bg-slate-100 text-slate-600'
              }`}>
                {(person.status || 'new').replace(/_/g, ' ')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isLead && person.status !== 'converted' && (
                <button
                  onClick={async () => {
                    // Check for accepted quotes before conversion
                    try {
                      const quotesData = await getQuotes(personId)
                      const quotes = Array.isArray(quotesData) ? quotesData : []
                      const acceptedQuotes = quotes.filter(q => q.status === 'accepted')

                      if (acceptedQuotes.length === 0) {
                        alert('No accepted quote found. Please accept a quote before converting this lead.')
                        return
                      }

                      if (acceptedQuotes.length > 1) {
                        alert('Multiple quotes are accepted. Please reject the ones you don\'t want before converting.')
                        return
                      }

                      const selectedQuote = acceptedQuotes[0]
                      const confirmed = window.confirm(
                        `Convert "${fullName}" with this quote?\n\n` +
                        `Carrier: ${selectedQuote.carrier || 'N/A'}\n` +
                        `Product: ${selectedQuote.model || selectedQuote.product || 'N/A'}\n` +
                        `Premium: ${selectedQuote.currency || 'CAD'} ${Number(selectedQuote.premiumMonthly || selectedQuote.premium || 0).toLocaleString()}/mo\n\n` +
                        `This will create a policy from this quote.`
                      )
                      if (!confirmed) return

                      await dispatch(updatePersonStatusAsync({ id: personId, status: 'converted', notes: 'Converted from lead' })).unwrap()
                      navigate('/admin/persons')
                    } catch (err) {
                      alert(err.message || 'Failed to convert')
                    }
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg flex items-center gap-2 hover:bg-emerald-700 transition-colors"
                >
                  <ArrowRight size={14} />
                  Convert to Customer
                </button>
              )}
              <button
                onClick={() => setShowFollowUpModal(true)}
                className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
              >
                <Plus size={14} />
                Add Follow-up
              </button>
              <button
                onClick={() => setShowNoteModal(true)}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-2 hover:bg-slate-50 transition-colors"
              >
                <StickyNote size={14} />
                Add Note
              </button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-6 mt-5 pt-4 border-t border-slate-100">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Active Policies</p>
              <p className="text-2xl font-bold text-blue-600 mt-0.5">{activePolicies}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Quotes</p>
              <p className="text-2xl font-bold text-violet-600 mt-0.5">{totalQuotes}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Opportunities</p>
              <p className="text-2xl font-bold text-amber-600 mt-0.5">{activeOpportunities}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Follow-ups</p>
              <p className="text-2xl font-bold text-emerald-600 mt-0.5">{followUps.length}</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex border-b border-slate-200 gap-1 overflow-x-auto">
          {tabs.map((tab, i) => {
            const Icon = tab.icon
            const isActive = i === activeTab
            return (
              <button
                key={tab.label}
                type="button"
                onClick={() => setActiveTab(i)}
                className={`pb-3 px-4 flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold transition-colors ${
                  isActive
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-500 hover:text-blue-600'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            )
          })}
        </nav>

        {/* ==================== TAB: OVERVIEW ==================== */}
        {activeTab === 0 && (
          <div className="grid grid-cols-12 gap-4">
            {/* Financial Summary */}
            <div className="col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Financial Summary</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-[10px] font-bold text-blue-500 uppercase">Annual Income</p>
                  <p className="text-xl font-bold text-blue-700 mt-1">
                    {person.annualIncome ? `$${Number(person.annualIncome).toLocaleString()}` : 'N/A'}
                  </p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                  <p className="text-[10px] font-bold text-emerald-500 uppercase">Total Policies</p>
                  <p className="text-xl font-bold text-emerald-700 mt-1">
                    {policies.length > 0 ? `${policies.length} (${activePolicies} active)` : 'None'}
                  </p>
                </div>
                <div className="p-4 bg-violet-50 rounded-lg border border-violet-100">
                  <p className="text-[10px] font-bold text-violet-500 uppercase">Family Members</p>
                  <p className="text-xl font-bold text-violet-700 mt-1">
                    {familyMembers.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Need Analysis Status */}
            <div className="col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Need Analysis</h3>
              {needAnalysis.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                    <CheckCircle size={20} className="text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-800">Completed</p>
                      <p className="text-xs text-emerald-600">{needAnalysis.length} analysis(es) saved</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab(4)}
                    className="w-full text-center text-blue-600 text-xs font-semibold hover:underline"
                  >
                    View Details →
                  </button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <FileText size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-xs text-slate-500 mb-2">No need analysis yet</p>
                  <button
                    onClick={() => navigate(`/admin/persons/${personId}/need-analysis`)}
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    Start Analysis →
                  </button>
                </div>
              )}
            </div>

            {/* Recent Opportunities */}
            <div className="col-span-6 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-800">Recent Opportunities</h3>
                <button
                  onClick={() => setActiveTab(5)}
                  className="text-blue-600 text-xs font-bold hover:underline"
                >
                  View All
                </button>
              </div>
              {opportunities.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No opportunities</p>
              ) : (
                <div className="space-y-2">
                  {opportunities.slice(0, 3).map((opp) => (
                    <div key={opp.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{opp.title || opp.name || 'Untitled'}</p>
                        <p className="text-xs text-slate-400">{opp.type || 'Insurance'}</p>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                        opp.status === 'won' ? 'bg-emerald-100 text-emerald-700' :
                        opp.status === 'lost' ? 'bg-red-100 text-red-600' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {opp.status || 'open'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Follow-ups */}
            <div className="col-span-6 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-800">Recent Follow-ups</h3>
                <button
                  onClick={() => setActiveTab(6)}
                  className="text-blue-600 text-xs font-bold hover:underline"
                >
                  View All
                </button>
              </div>
              {followUps.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No follow-ups</p>
              ) : (
                <div className="space-y-2">
                  {followUps.slice(0, 3).map((fu) => (
                    <div key={fu.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          fu.type === 'call' ? 'bg-blue-100 text-blue-600' :
                          fu.type === 'email' ? 'bg-violet-100 text-violet-600' :
                          fu.type === 'meeting' ? 'bg-amber-100 text-amber-600' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          <Calendar size={14} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800 capitalize">{fu.type?.replace(/_/g, ' ') || 'Task'}</p>
                          <p className="text-xs text-slate-400">{formatTimeAgo(fu.scheduledAt)}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                        fu.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        fu.status === 'missed' ? 'bg-red-100 text-red-600' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {fu.status || 'pending'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== TAB: FAMILY ==================== */}
        {activeTab === 1 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800">Family Members ({familyMembers.length})</h3>
              <button
                onClick={() => setShowFamilyModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={14} />
                Add Member
              </button>
            </div>
            {familyMembers.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Users size={40} className="mx-auto text-slate-300 mb-3" />
                <p className="text-sm text-slate-500">No family members added yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {familyMembers.map((member) => (
                  <div key={member.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">
                        {`${(member.firstName || '')[0] || ''}${(member.lastName || '')[0] || ''}`.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{member.firstName} {member.lastName}</p>
                        <p className="text-xs text-slate-400">
                          {member.relationship || 'N/A'}
                          {member.dateOfBirth ? ` • ${Math.floor((Date.now() - new Date(member.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} yrs` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {member.email && <span className="text-xs text-slate-400">{member.email}</span>}
                      <button
                        onClick={() => handleRemoveFamilyMember(member.id)}
                        className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB: POLICIES ==================== */}
        {activeTab === 2 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Policies ({policies.length})</h3>
              <button
                onClick={() => setShowPolicyModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={14} />
                Add Policy
              </button>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Policy #</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Carrier</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Effective</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Renewal</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Premium</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                  <th className="px-6 py-3 w-12" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {policies.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <Shield size={40} className="mx-auto text-slate-300 mb-3" />
                      <p className="text-sm text-slate-500">No policies linked yet</p>
                    </td>
                  </tr>
                ) : (
                  policies.map((policy) => (
                    <tr key={policy.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm font-semibold text-blue-600">{policy.policyNumber}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{policy.policyType}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{policy.carrier || '—'}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{formatDate(policy.effectiveDate)}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{formatDate(policy.renewalDate)}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {policy.premium ? `$${Number(policy.premium).toLocaleString()}` : '—'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          policy.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                          policy.status === 'expired' ? 'bg-red-50 text-red-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {policy.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleRemovePolicy(policy.id)}
                          className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ==================== TAB: QUOTES ==================== */}
        {activeTab === 3 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800">Quote History ({quotes.length})</h3>
            </div>
            {quotes.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Calculator size={40} className="mx-auto text-slate-300 mb-3" />
                <p className="text-sm text-slate-500">No quotes run yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {quotes.map((quote) => (
                  <div key={quote.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          quote.source === 'primai' ? 'bg-violet-100 text-violet-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          <Calculator size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{quote.carrier || quote.carrierName || 'Unknown Carrier'}</p>
                          <p className="text-xs text-slate-400">
                            {quote.product || quote.planType || 'Insurance'} • {quote.source === 'primai' ? 'PrimAI' : 'WinQuote'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-800">
                          {quote.premium ? `CHF ${Number(quote.premium).toLocaleString()}/mo` : 'N/A'}
                        </p>
                        <p className="text-xs text-slate-400">{formatDate(quote.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB: NEED ANALYSIS ==================== */}
        {activeTab === 4 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-slate-800">Need Analysis</h3>
              <button
                onClick={() => navigate(`/admin/persons/${personId}/need-analysis`)}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FileText size={14} />
                {needAnalysis.length > 0 ? 'Edit Analysis' : 'Start Analysis'}
              </button>
            </div>
            {needAnalysis.length === 0 ? (
              <div className="text-center py-12">
                <Brain size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-sm text-slate-500 mb-2">No need analysis completed yet</p>
                <p className="text-xs text-slate-400">Complete a need analysis to understand the person's insurance needs</p>
              </div>
            ) : (
              <div className="space-y-4">
                {needAnalysis.map((analysis, i) => (
                  <div key={analysis.id || i} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          Analysis {i + 1}
                          {analysis.familyMemberName && ` — ${analysis.familyMemberName}`}
                        </p>
                        <p className="text-xs text-slate-400">{formatDate(analysis.updatedAt || analysis.createdAt)}</p>
                      </div>
                      <CheckCircle size={20} className="text-emerald-500" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB: OPPORTUNITIES ==================== */}
        {activeTab === 5 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800">Opportunities ({opportunities.length})</h3>
            </div>
            {opportunities.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <TrendingUp size={40} className="mx-auto text-slate-300 mb-3" />
                <p className="text-sm text-slate-500">No opportunities in pipeline</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {opportunities.map((opp) => (
                  <div key={opp.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          opp.status === 'won' ? 'bg-emerald-100 text-emerald-600' :
                          opp.status === 'lost' ? 'bg-red-100 text-red-500' :
                          'bg-amber-100 text-amber-600'
                        }`}>
                          <TrendingUp size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{opp.title || opp.name || 'Untitled Opportunity'}</p>
                          <p className="text-xs text-slate-400">{opp.type || 'Insurance'} • {opp.carrier || 'Any carrier'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {opp.premium && (
                          <span className="text-sm font-bold text-slate-800">CHF {Number(opp.premium).toLocaleString()}/mo</span>
                        )}
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          opp.status === 'won' ? 'bg-emerald-100 text-emerald-700' :
                          opp.status === 'lost' ? 'bg-red-100 text-red-600' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {opp.status || 'open'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB: FOLLOW-UPS ==================== */}
        {activeTab === 6 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Follow-ups ({followUps.length})</h3>
              <button
                onClick={() => setShowFollowUpModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={14} />
                Add Follow-up
              </button>
            </div>
            {followUps.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Calendar size={40} className="mx-auto text-slate-300 mb-3" />
                <p className="text-sm text-slate-500">No follow-ups scheduled</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {followUps.map((fu) => (
                  <div key={fu.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          fu.type === 'call' ? 'bg-blue-100 text-blue-600' :
                          fu.type === 'email' ? 'bg-violet-100 text-violet-600' :
                          fu.type === 'meeting' ? 'bg-amber-100 text-amber-600' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {fu.type === 'call' ? <Phone size={18} /> :
                           fu.type === 'email' ? <Mail size={18} /> :
                           fu.type === 'meeting' ? <Users size={18} /> :
                           <StickyNote size={18} />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800 capitalize">{fu.type?.replace(/_/g, ' ') || 'Task'}</p>
                          <p className="text-xs text-slate-400">{formatDate(fu.scheduledAt)}</p>
                          {fu.notes && <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{fu.notes}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {fu.assignedToName && (
                          <span className="text-xs text-slate-400">{fu.assignedToName}</span>
                        )}
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          fu.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                          fu.status === 'missed' ? 'bg-red-100 text-red-600' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {fu.status || 'pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB: ACTIVITY ==================== */}
        {activeTab === 7 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800">Activity Log</h3>
            </div>
            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {activityLogs.length === 0 ? (
                <p className="px-6 py-12 text-center text-sm text-slate-500">No activity recorded yet.</p>
              ) : (
                activityLogs.map((log, i) => {
                  const IconComp = actionIcons[log.action] || Clock
                  const detailText = formatDetails(log.action, log.details)
                  return (
                    <div key={log.id || i} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                          <IconComp size={16} className="text-slate-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-800">
                              {actionLabels[log.action] || log.action.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[11px] text-slate-400 whitespace-nowrap">{formatTimeAgo(log.performedAt)}</span>
                          </div>
                          {detailText && (
                            <p className="text-xs text-slate-600 mt-1">{detailText}</p>
                          )}
                          {log.performedByName && (
                            <p className="text-[11px] text-slate-400 mt-1">by {log.performedByName}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* ==================== TAB: NOTES ==================== */}
        {activeTab === 8 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Notes ({notesList.length})</h3>
              <button
                onClick={() => setShowNoteModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={14} />
                Add Note
              </button>
            </div>
            {notesList.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <StickyNote size={40} className="mx-auto text-slate-300 mb-3" />
                <p className="text-sm text-slate-500">No notes added yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notesList.map((note) => (
                  <div key={note.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                        <StickyNote size={16} className="text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700">{note.content || note.text}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          {note.createdByName && (
                            <span className="text-[11px] text-slate-400">by {note.createdByName}</span>
                          )}
                          <span className="text-[11px] text-slate-400">{formatTimeAgo(note.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB: DOCUMENTS ==================== */}
        {activeTab === 9 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Documents ({documentsList.length})</h3>
              <label className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                <Upload size={14} />
                Upload
                <input type="file" className="hidden" />
              </label>
            </div>
            {documentsList.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <FileText size={40} className="mx-auto text-slate-300 mb-3" />
                <p className="text-sm text-slate-500">No documents uploaded yet</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Document</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Uploaded By</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 w-12" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {documentsList.map((doc) => {
                    const catStyle = docCategoryStyles[doc.documentType] || docCategoryStyles['Supporting']
                    return (
                      <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded ${catStyle.iconBg}`}>
                              <FileText size={18} className={catStyle.iconText} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{doc.documentName}</p>
                              <p className="text-xs text-slate-400">{doc.fileSize || '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${catStyle.badge}`}>
                            {doc.documentType || 'Other'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-600">{doc.uploadedByName || 'Unknown'}</td>
                        <td className="px-6 py-4 text-xs text-slate-500">{formatDate(doc.uploadedAt)}</td>
                        <td className="px-6 py-4 text-right">
                          <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Download">
                            <Download size={16} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* ==================== FOLLOW-UP MODAL ==================== */}
      {showFollowUpModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(23, 28, 31, 0.6)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowFollowUpModal(false) }}
        >
          <div className="relative bg-white w-full max-w-[500px] rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-white px-8 pt-8 pb-4 flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Schedule Follow-Up</h3>
                <div className="mt-2 inline-flex items-center gap-2 bg-blue-50 text-blue-800 px-3 py-1 rounded-full border border-blue-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider">For:</span>
                  <span className="text-[13px] font-semibold">{fullName}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFollowUpModal(false)}
                className="text-slate-400 hover:bg-slate-100 rounded-full p-2 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddFollowUp} className="px-8 pb-8 space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { key: 'call', icon: Phone, label: 'Call' },
                    { key: 'email', icon: Mail, label: 'Email' },
                    { key: 'meeting', icon: Users, label: 'Meeting' },
                    { key: 'task', icon: StickyNote, label: 'Task' },
                  ].map(({ key, icon: Icon, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFollowUpForm({ ...followUpForm, type: key })}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                        followUpForm.type === key
                          ? 'border-blue-600 bg-blue-50 text-blue-600'
                          : 'border-slate-200 hover:border-blue-300 text-slate-500'
                      }`}
                    >
                      <Icon size={20} />
                      <span className="text-[10px] font-bold">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Scheduled Date & Time</label>
                <input
                  type="datetime-local"
                  value={followUpForm.scheduledAt}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, scheduledAt: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Notes</label>
                <textarea
                  value={followUpForm.notes}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, notes: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
                  placeholder="Follow-up notes..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFollowUpModal(false)}
                  className="px-6 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  Save Follow-up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== NOTE MODAL ==================== */}
      {showNoteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(23, 28, 31, 0.6)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowNoteModal(false) }}
        >
          <div className="relative bg-white w-full max-w-[480px] rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-8 pt-8 pb-4 flex justify-between items-start">
              <h3 className="text-xl font-bold text-slate-900">Add Note</h3>
              <button
                type="button"
                onClick={() => setShowNoteModal(false)}
                className="text-slate-400 hover:bg-slate-100 rounded-full p-2 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="px-8 pb-8 space-y-4">
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
                placeholder="Write a note..."
                rows={5}
                autoFocus
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNoteModal(false)}
                  className="px-6 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddNote}
                  className="px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                >
                  Save Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== FAMILY MODAL ==================== */}
      {showFamilyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(23, 28, 31, 0.6)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowFamilyModal(false) }}
        >
          <div className="relative bg-white w-full max-w-[520px] rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-8 pt-8 pb-4 flex justify-between items-start">
              <h3 className="text-xl font-bold text-slate-900">Add Family Member</h3>
              <button
                type="button"
                onClick={() => setShowFamilyModal(false)}
                className="text-slate-400 hover:bg-slate-100 rounded-full p-2 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddFamilyMember} className="px-8 pb-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">First Name</label>
                  <input
                    type="text"
                    value={familyForm.firstName}
                    onChange={(e) => setFamilyForm({ ...familyForm, firstName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Last Name</label>
                  <input
                    type="text"
                    value={familyForm.lastName}
                    onChange={(e) => setFamilyForm({ ...familyForm, lastName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Relationship</label>
                <select
                  value={familyForm.relationship}
                  onChange={(e) => setFamilyForm({ ...familyForm, relationship: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                >
                  <option value="">Select...</option>
                  <option>Spouse</option>
                  <option>Child</option>
                  <option>Parent</option>
                  <option>Sibling</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Date of Birth</label>
                <input
                  type="date"
                  value={familyForm.dateOfBirth}
                  onChange={(e) => setFamilyForm({ ...familyForm, dateOfBirth: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Email</label>
                  <input
                    type="email"
                    value={familyForm.email}
                    onChange={(e) => setFamilyForm({ ...familyForm, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Phone</label>
                  <input
                    type="tel"
                    value={familyForm.phone}
                    onChange={(e) => setFamilyForm({ ...familyForm, phone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFamilyModal(false)}
                  className="px-6 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== POLICY MODAL ==================== */}
      {showPolicyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(23, 28, 31, 0.6)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowPolicyModal(false) }}
        >
          <div className="relative bg-white w-full max-w-[560px] rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-8 pt-8 pb-4 flex justify-between items-start">
              <h3 className="text-xl font-bold text-slate-900">Add Policy</h3>
              <button
                type="button"
                onClick={() => setShowPolicyModal(false)}
                className="text-slate-400 hover:bg-slate-100 rounded-full p-2 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddPolicy} className="px-8 pb-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Policy Number *</label>
                  <input
                    type="text"
                    value={policyForm.policyNumber}
                    onChange={(e) => setPolicyForm({ ...policyForm, policyNumber: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Policy Type *</label>
                  <select
                    value={policyForm.policyType}
                    onChange={(e) => setPolicyForm({ ...policyForm, policyType: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                    required
                  >
                    <option value="">Select...</option>
                    <option>Term Life</option>
                    <option>Whole Life</option>
                    <option>Universal Life</option>
                    <option>Critical Illness</option>
                    <option>Disability</option>
                    <option>Health</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Carrier</label>
                  <input
                    type="text"
                    value={policyForm.carrier}
                    onChange={(e) => setPolicyForm({ ...policyForm, carrier: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Premium</label>
                  <input
                    type="number"
                    value={policyForm.premium}
                    onChange={(e) => setPolicyForm({ ...policyForm, premium: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    placeholder="Monthly premium"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Effective Date</label>
                  <input
                    type="date"
                    value={policyForm.effectiveDate}
                    onChange={(e) => setPolicyForm({ ...policyForm, effectiveDate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Renewal Date</label>
                  <input
                    type="date"
                    value={policyForm.renewalDate}
                    onChange={(e) => setPolicyForm({ ...policyForm, renewalDate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Expiry Date</label>
                  <input
                    type="date"
                    value={policyForm.expiryDate}
                    onChange={(e) => setPolicyForm({ ...policyForm, expiryDate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPolicyModal(false)}
                  className="px-6 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                >
                  Add Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== ASSIGN MODAL ==================== */}
      {showAssignModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(23, 28, 31, 0.6)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAssignModal(false) }}
        >
          <div className="relative bg-white w-full max-w-[480px] rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-8 pt-8 pb-4 flex justify-between items-start">
              <h3 className="text-xl font-bold text-slate-900">Edit Agent Assignments</h3>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="text-slate-400 hover:bg-slate-100 rounded-full p-2 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="px-8 pb-8 space-y-4">
              {(person.assignments || []).filter((a) => a.isActive).length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No active assignments</p>
              ) : (
                (person.assignments || []).filter((a) => a.isActive).map((a, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-[10px] font-bold">
                        {(a.agentName || a.agentId || 'A').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-slate-800">{a.agentName || a.agentId}</span>
                    </div>
                    <span className="text-sm font-bold text-blue-600">{a.commissionShare || 0}%</span>
                  </div>
                ))
              )}
              <p className="text-xs text-slate-400 text-center">
                Agent assignment management coming soon.
              </p>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-6 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
