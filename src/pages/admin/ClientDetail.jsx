import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  FileText,
  Clock,
  StickyNote,
  Users,
  Calendar,
  Phone,
  Mail,
  Download,
  Upload,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Shield,
  Home,
  UserCheck,
  Edit,
  Lightbulb,
  PenLine,
  ClipboardList,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Search,
  MoreVertical,
  RefreshCw,
  Bot,
  Cake,
  MapPin,
} from 'lucide-react'
import {
  getClient,
  updateClient,
  deleteClient,
  addPolicy,
  updatePolicy,
  removePolicy,
  getDocuments,
  uploadDocument,
  downloadDocument,
  addNote,
  getNotes,
  getActivityLog,
  addFollowUp,
  updateFollowUp,
  getFollowUps,
  addHouseholdMember,
  getHouseholdMembers,
  removeHouseholdMember,
} from '../../utils/clients.js'

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
  client_created: 'Client Created',
  client_updated: 'Client Updated',
  client_archived: 'Client Archived',
  policy_added: 'Policy Added',
  policy_updated: 'Policy Updated',
  policy_removed: 'Policy Removed',
  document_uploaded: 'Document Uploaded',
  note_added: 'Note Added',
  follow_up_created: 'Follow-Up Created',
  follow_up_completed: 'Follow-Up Completed',
  household_member_added: 'Household Member Added',
  household_member_removed: 'Household Member Removed',
}

const actionIcons = {
  client_created: CheckCircle,
  client_updated: Edit,
  client_archived: Trash2,
  policy_added: Shield,
  policy_updated: Shield,
  policy_removed: Trash2,
  document_uploaded: FileText,
  note_added: StickyNote,
  follow_up_created: Calendar,
  follow_up_completed: CheckCircle,
  household_member_added: Users,
  household_member_removed: Users,
}

const timelineEntryStyle = {
  client_created: { bg: 'bg-brand-600', text: 'text-white', gradient: true },
  note_added: { bg: 'bg-slate-100', text: 'text-slate-500' },
  policy_added: { bg: 'bg-brand-50', text: 'text-brand-600', leftBorder: true },
  policy_updated: { bg: 'bg-brand-50', text: 'text-brand-600', leftBorder: true },
  policy_removed: { bg: 'bg-red-50', text: 'text-red-500' },
  document_uploaded: { bg: 'bg-violet-50', text: 'text-violet-500' },
  follow_up_created: { bg: 'bg-amber-50', text: 'text-amber-500' },
  follow_up_completed: { bg: 'bg-emerald-50', text: 'text-emerald-500' },
  household_member_added: { bg: 'bg-blue-50', text: 'text-blue-500' },
  household_member_removed: { bg: 'bg-red-50', text: 'text-red-400' },
  client_updated: { bg: 'bg-slate-100', text: 'text-slate-500' },
  client_archived: { bg: 'bg-red-50', text: 'text-red-500' },
}

const docCategoryStyles = {
  Application: { badge: 'bg-blue-50 text-blue-600', iconBg: 'bg-blue-50', iconText: 'text-blue-600' },
  ID: { badge: 'bg-green-50 text-green-600', iconBg: 'bg-green-50', iconText: 'text-green-600' },
  'Policy Docs': { badge: 'bg-sky-50 text-sky-600', iconBg: 'bg-sky-50', iconText: 'text-sky-600' },
  'Signed Forms': { badge: 'bg-purple-50 text-purple-600', iconBg: 'bg-purple-50', iconText: 'text-purple-600' },
  Supporting: { badge: 'bg-amber-50 text-amber-600', iconBg: 'bg-amber-50', iconText: 'text-amber-600' },
}

const tabs = ['Overview', 'Policies', 'Timeline', 'Documents', 'Tasks', 'Compliance']

const tagColors = {
  VIP: 'bg-amber-100 text-amber-700 border-amber-200',
  'High Value': 'bg-purple-100 text-purple-700 border-purple-200',
  Family: 'bg-blue-50 text-blue-700 border-blue-200',
  Corporate: 'bg-slate-100 text-slate-700 border-slate-200',
  Prospect: 'bg-gray-100 text-gray-600 border-gray-200',
  'Renewal Due': 'bg-red-50 text-red-600 border-red-200',
}

export default function ClientDetail() {
  const navigate = useNavigate()
  const { clientId } = useParams()
  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(0)

  const [policiesList, setPoliciesList] = useState([])
  const [documentsList, setDocumentsList] = useState([])
  const [activityLog, setActivityLog] = useState([])
  const [notesList, setNotesList] = useState([])
  const [followUpsList, setFollowUpsList] = useState([])
  const [householdList, setHouseholdList] = useState([])

  const [showPolicyModal, setShowPolicyModal] = useState(false)
  const [showFollowUpModal, setShowFollowUpModal] = useState(false)
  const [showHouseholdModal, setShowHouseholdModal] = useState(false)
  const [newNote, setNewNote] = useState('')

  const [policyForm, setPolicyForm] = useState({
    policyNumber: '', policyType: '', carrier: '', product: '',
    effectiveDate: '', renewalDate: '', expiryDate: '', premium: '', status: 'active',
  })
  const [followUpForm, setFollowUpForm] = useState({
    type: 'call', scheduledAt: '', notes: '', assignedTo: '',
  })
  const [householdForm, setHouseholdForm] = useState({
    firstName: '', lastName: '', relationship: '', dateOfBirth: '', email: '', phone: '',
  })
  const [timelineFilter, setTimelineFilter] = useState('All')
  const [docSearch, setDocSearch] = useState('')
  const [docFilter, setDocFilter] = useState('All')
  const [taskFilter, setTaskFilter] = useState('All')
  const [taskView, setTaskView] = useState('mine')

  useEffect(() => {
    if (!clientId) {
      navigate('/admin/clients', { replace: true })
      return
    }
    setLoading(true)
    Promise.all([
      getClient(clientId).catch(() => null),
      getFollowUps(clientId).catch(() => []),
      getActivityLog(clientId).catch(() => ({ activities: [] })),
      getNotes(clientId).catch(() => []),
      getDocuments(clientId).catch(() => []),
      getHouseholdMembers(clientId).catch(() => []),
    ])
      .then(([clientData, followUps, activityData, notes, docs, household]) => {
        if (clientData) {
          setClient(clientData)
          setPoliciesList(clientData.policies || [])
        }
        setFollowUpsList(Array.isArray(followUps) ? followUps : [])
        setActivityLog(Array.isArray(activityData?.activities) ? activityData.activities : [])
        setNotesList(Array.isArray(notes) ? notes : [])
        setDocumentsList(Array.isArray(docs) ? docs : [])
        setHouseholdList(Array.isArray(household) ? household : [])
      })
      .catch(() => navigate('/admin/clients', { replace: true }))
      .finally(() => setLoading(false))
  }, [clientId, navigate])

  const refreshData = async () => {
    const [clientData, followUps, activityData, notes, docs, household] = await Promise.all([
      getClient(clientId).catch(() => null),
      getFollowUps(clientId).catch(() => []),
      getActivityLog(clientId).catch(() => ({ activities: [] })),
      getNotes(clientId).catch(() => []),
      getDocuments(clientId).catch(() => []),
      getHouseholdMembers(clientId).catch(() => []),
    ])
    if (clientData) {
      setClient(clientData)
      setPoliciesList(clientData.policies || [])
    }
    setFollowUpsList(Array.isArray(followUps) ? followUps : [])
    setActivityLog(Array.isArray(activityData?.activities) ? activityData.activities : [])
    setNotesList(Array.isArray(notes) ? notes : [])
    setDocumentsList(Array.isArray(docs) ? docs : [])
    setHouseholdList(Array.isArray(household) ? household : [])
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) return
    try {
      await addNote(clientId, newNote.trim())
      setNewNote('')
      await refreshData()
    } catch (err) {
      alert(err.message || 'Failed to add note')
    }
  }

  const handleAddPolicy = async () => {
    if (!policyForm.policyNumber || !policyForm.policyType) {
      alert('Policy number and type are required')
      return
    }
    try {
      await addPolicy(clientId, policyForm)
      setShowPolicyModal(false)
      setPolicyForm({ policyNumber: '', policyType: '', carrier: '', product: '', effectiveDate: '', renewalDate: '', expiryDate: '', premium: '', status: 'active' })
      await refreshData()
    } catch (err) {
      alert(err.message || 'Failed to add policy')
    }
  }

  const handleAddFollowUp = async () => {
    if (!followUpForm.scheduledAt) {
      alert('Scheduled date is required')
      return
    }
    try {
      await addFollowUp(clientId, followUpForm)
      setShowFollowUpModal(false)
      setFollowUpForm({ type: 'call', scheduledAt: '', notes: '', assignedTo: '' })
      await refreshData()
    } catch (err) {
      alert(err.message || 'Failed to add follow-up')
    }
  }

  const handleAddHousehold = async () => {
    if (!householdForm.firstName || !householdForm.lastName) {
      alert('First and last name are required')
      return
    }
    try {
      await addHouseholdMember(clientId, householdForm)
      setShowHouseholdModal(false)
      setHouseholdForm({ firstName: '', lastName: '', relationship: '', dateOfBirth: '', email: '', phone: '' })
      await refreshData()
    } catch (err) {
      alert(err.message || 'Failed to add household member')
    }
  }

  const handleRemoveHousehold = async (memberId) => {
    if (!window.confirm('Remove this household member?')) return
    try {
      await removeHouseholdMember(clientId, memberId)
      await refreshData()
    } catch (err) {
      alert(err.message || 'Failed to remove household member')
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      await uploadDocument(clientId, file)
      await refreshData()
    } catch (err) {
      alert(err.message || 'Failed to upload document')
    }
    e.target.value = ''
  }

  const initials = (first, last) =>
    `${(first || '')[0] || ''}${(last || '')[0] || ''}`.toUpperCase()

  const activePolicies = policiesList.filter((p) => p.status === 'active').length

  const nextRenewal = policiesList
    .filter((p) => p.renewalDate)
    .sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate))[0]

  const daysUntilRenewal = nextRenewal
    ? Math.max(0, Math.ceil((new Date(nextRenewal.renewalDate) - new Date()) / (1000 * 60 * 60 * 24)))
    : null

  const clientSince = client?.createdAt
    ? new Date(client.createdAt).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    : 'N/A'

  const lifetimeValue = policiesList.reduce((sum, p) => sum + (Number(p.premium) || 0), 0)

  const householdColors = ['bg-amber-100 text-amber-700', 'bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700', 'bg-purple-100 text-purple-700']

  const filteredDocuments = documentsList.filter((doc) => {
    const matchesSearch = !docSearch || doc.documentName?.toLowerCase().includes(docSearch.toLowerCase())
    const matchesFilter = docFilter === 'All' || doc.documentCategory === docFilter || doc.documentType === docFilter
    return matchesSearch && matchesFilter
  })

  const taskTypeIcons = {
    call: Phone,
    email: Mail,
    meeting: Users,
    task: ClipboardList,
    follow_up: Clock,
    beneficiary_change: StickyNote,
    address_update: MapPin,
    renewal: RefreshCw,
    birthday: Cake,
    automated: Bot,
  }

  const isOverdue = (fu) => fu.status !== 'completed' && fu.status !== 'cancelled' && new Date(fu.scheduledAt) < new Date()
  const isDueSoon = (fu) => {
    if (fu.status === 'completed' || fu.status === 'cancelled') return false
    const diff = new Date(fu.scheduledAt) - new Date()
    return diff > 0 && diff <= 7 * 24 * 60 * 60 * 1000
  }

  const overdueTasks = followUpsList.filter(isOverdue)
  const dueSoonTasks = followUpsList.filter(isDueSoon)
  const completedTasks = followUpsList.filter((fu) => fu.status === 'completed')
  const otherTasks = followUpsList.filter((fu) => !isOverdue(fu) && !isDueSoon(fu) && fu.status !== 'completed')

  const allGrouped = [...overdueTasks, ...dueSoonTasks, ...otherTasks, ...completedTasks]

  const filteredTasks = (taskFilter === 'All' ? allGrouped : allGrouped.filter((fu) => {
    if (taskFilter === 'Open') return fu.status === 'pending'
    if (taskFilter === 'In Progress') return fu.status === 'in_progress'
    if (taskFilter === 'Done') return fu.status === 'completed'
    if (taskFilter === 'Overdue') return isOverdue(fu)
    return true
  }))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-slate-500">Loading client details...</div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Client not found</p>
        <button onClick={() => navigate('/admin/clients')} className="mt-4 text-brand-600 font-semibold hover:underline">
          Back to clients
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-xs font-medium text-slate-400">
        <span className="cursor-pointer hover:text-slate-600" onClick={() => navigate('/admin/clients')}>
          Client Management
        </span>
        <ChevronRight size={14} />
        <span className="text-slate-700">{client.firstName} {client.lastName} Household</span>
      </nav>

      {/* Header Card */}
      <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-2xl shrink-0">
              {initials(client.firstName, client.lastName)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900">
                  {client.firstName} {client.lastName}
                </h1>
                {(client.tags || []).map((tag) => (
                  <span
                    key={tag}
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${tagColors[tag] || 'bg-slate-100 text-slate-600 border-slate-200'}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <p className="text-sm text-slate-500 mt-1">
                {client.phone} • {client.email || 'No email'} • {client.address || 'No address'}
              </p>
              {client.assignedAgentName && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="h-6 w-6 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-[10px] font-bold">
                    {(client.assignedAgentName || '').slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-sm text-slate-600">Assigned Agent: {client.assignedAgentName}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="bg-brand-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-brand-700 transition-all flex items-center gap-2">
              <PenLine size={16} />
              Log Activity
            </button>
            <button
              onClick={() => setShowPolicyModal(true)}
              className="border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium text-sm hover:bg-slate-50 transition-all flex items-center gap-2"
            >
              <Shield size={16} />
              Add Policy
            </button>
            <button
              onClick={() => setShowFollowUpModal(true)}
              className="border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium text-sm hover:bg-slate-50 transition-all flex items-center gap-2"
            >
              <ClipboardList size={16} />
              New Task
            </button>
            <label className="border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium text-sm hover:bg-slate-50 transition-all flex items-center gap-2 cursor-pointer">
              <Upload size={16} />
              Upload Doc
              <input type="file" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-6 border-b border-slate-200 overflow-x-auto">
          {tabs.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => setActiveTab(i)}
              className={`pb-3 font-medium text-sm whitespace-nowrap transition-colors ${
                i === activeTab
                  ? 'text-brand-600 border-b-2 border-brand-600'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* ==================== TAB: OVERVIEW ==================== */}
      {activeTab === 0 && (
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column */}
          <div className="col-span-12 lg:col-span-7 space-y-6">
            {/* Contact Information */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-slate-800">Contact Information</h2>
                <button
                  onClick={() => navigate(`/admin/clients/${clientId}/edit`)}
                  className="text-brand-600 font-medium text-sm flex items-center gap-1 hover:underline"
                >
                  <Edit size={14} />
                  Edit
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Phone</label>
                  <p className="text-sm font-medium text-slate-800">{client.phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email</label>
                  <p className="text-sm font-medium text-slate-800">{client.email || 'N/A'}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Address</label>
                  <p className="text-sm font-medium text-slate-800">{client.address || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Date of Birth</label>
                  <p className="text-sm font-medium text-slate-800">
                    {client.dateOfBirth ? formatFullDate(client.dateOfBirth) : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Preferred Comms</label>
                  <div className="flex gap-2">
                    <span className="bg-slate-100 px-2 py-1 rounded text-xs flex items-center gap-1">
                      <Mail size={12} /> {client.preferredCommunication || 'Email'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Household Members */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-slate-800">Household Members</h2>
                <button
                  onClick={() => setShowHouseholdModal(true)}
                  className="text-brand-600 font-medium text-sm flex items-center gap-1 hover:underline"
                >
                  <Plus size={14} />
                  Add Member
                </button>
              </div>
              <div className="space-y-3">
                {householdList.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">No household members added</p>
                ) : (
                  householdList.map((member, i) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold ${householdColors[i % householdColors.length]}`}>
                          {`${(member.firstName || '')[0] || ''}${(member.lastName || '')[0] || ''}`.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{member.firstName} {member.lastName}</p>
                          <p className="text-xs text-slate-400">
                            {member.relationship || 'N/A'}
                            {member.dateOfBirth ? ` • ${Math.floor((Date.now() - new Date(member.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} yrs` : ''}
                          </p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-slate-300 group-hover:text-brand-500 transition-colors" />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="col-span-12 lg:col-span-5 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Active Policies</span>
                <span className="text-3xl font-bold text-brand-600">{String(activePolicies).padStart(2, '0')}</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Next Renewal</span>
                <span className={`text-3xl font-bold ${daysUntilRenewal !== null && daysUntilRenewal <= 60 ? 'text-red-500' : 'text-slate-800'}`}>
                  {daysUntilRenewal !== null ? `${daysUntilRenewal}d` : 'N/A'}
                </span>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Client Since</span>
                <span className="text-3xl font-bold text-slate-800">{clientSince}</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Lifetime Value</span>
                <span className="text-3xl font-bold text-slate-800">
                  {lifetimeValue > 0 ? `$${(lifetimeValue / 1000).toFixed(1)}k` : '$0'}
                </span>
              </div>
            </div>

            {/* Opportunities */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                  <Lightbulb size={20} />
                </div>
                <h2 className="text-base font-bold text-slate-800">Opportunities</h2>
              </div>
              <div className="space-y-4">
                {activePolicies > 0 && !policiesList.some((p) => p.policyType?.toLowerCase().includes('critical')) && (
                  <div className="flex flex-col gap-3 p-4 bg-red-50/50 border border-red-100 rounded-lg">
                    <div>
                      <h3 className="text-sm font-medium text-slate-800">Missing Critical Illness Coverage</h3>
                      <p className="text-xs text-slate-500 mt-1">Has Active policies, but no Critical Illness protection detected in the household profile.</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-red-700 bg-red-100 px-2 py-0.5 rounded">High Probability</span>
                      <button className="bg-brand-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-brand-700 transition-all">Create Task</button>
                    </div>
                  </div>
                )}
                <div className="flex flex-col gap-3 p-4 bg-blue-50/50 border border-blue-100 rounded-lg">
                  <div>
                    <h3 className="text-sm font-medium text-slate-800">Portfolio Review</h3>
                    <p className="text-xs text-slate-500 mt-1">Review existing policies for coverage gaps and optimization opportunities.</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-blue-700 bg-blue-100 px-2 py-0.5 rounded">Contextual</span>
                    <button className="bg-brand-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-brand-700 transition-all">Create Task</button>
                  </div>
                </div>
                <div className="flex flex-col gap-3 p-4 border border-dashed border-slate-200 rounded-lg">
                  <div className="flex items-center justify-center py-2 text-slate-400">
                    <button className="text-brand-600 font-medium hover:underline text-sm flex items-center gap-1">
                      <Shield size={16} />
                      Run AI Portfolio Scan
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h2 className="text-base font-bold text-slate-800 mb-5">Recent Activity</h2>
              <div className="space-y-4 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
                {activityLog.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">No activity recorded</p>
                ) : (
                  activityLog.slice(0, 5).map((log) => {
                    const IconComp = actionIcons[log.action] || Clock
                    return (
                      <div key={log.id} className="flex gap-3 relative">
                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center z-10 border border-slate-200 shrink-0">
                          <IconComp size={16} className="text-slate-400" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-700">
                            <span className="font-bold">{actionLabels[log.action] || log.action}</span>
                          </p>
                          <p className="text-xs text-slate-400">{formatTimeAgo(log.performedAt)}</p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
              {activityLog.length > 0 && (
                <button
                  onClick={() => setActiveTab(2)}
                  className="w-full text-center text-brand-600 font-medium mt-4 text-sm hover:underline"
                >
                  View All History
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB: POLICIES ==================== */}
      {activeTab === 1 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800">Policies ({policiesList.length})</h3>
            <button
              onClick={() => setShowPolicyModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white text-xs font-semibold rounded-lg hover:bg-brand-700 transition-colors"
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
              {policiesList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-sm text-slate-500">
                    No policies linked yet
                  </td>
                </tr>
              ) : (
                policiesList.map((policy) => (
                  <tr key={policy.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-semibold text-brand-600">{policy.policyNumber}</td>
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
                        onClick={async () => {
                          if (!window.confirm('Remove this policy?')) return
                          await removePolicy(clientId, policy.id)
                          await refreshData()
                        }}
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

      {/* ==================== TAB: TIMELINE ==================== */}
      {activeTab === 2 && (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Filters & CTA Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {['All', 'Calls', 'Emails', 'Notes', 'Documents', 'Policy Events', 'Service Requests'].map((chip) => (
                <button
                  key={chip}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    timelineFilter === chip
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  onClick={() => setTimelineFilter(chip)}
                >
                  {chip}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg font-semibold text-sm hover:bg-brand-700 transition-all">
              <Plus size={16} />
              Log Activity
            </button>
          </div>

          {/* Activity Feed - combined from activity log and follow-ups */}
          {(() => {
            const combinedTimeline = [
              ...activityLog,
              ...followUpsList
                .filter(fu => fu.scheduledAt)
                .flatMap(fu => {
                  const entries = [{
                    id: `task-${fu.id}`,
                    action: 'follow_up_created',
                    performedAt: fu.scheduledAt,
                    performedByName: fu.assignedTo || 'System',
                    details: { Type: fu.type, Notes: fu.notes }
                  }]
                  if (fu.status === 'completed' && fu.completedAt) {
                    entries.push({
                      id: `task-completed-${fu.id}`,
                      action: 'follow_up_completed',
                      performedAt: fu.completedAt,
                      performedByName: fu.assignedTo || 'System',
                      details: { Type: fu.type, Notes: fu.notes }
                    })
                  }
                  return entries
                })
            ].sort((a, b) => new Date(b.performedAt) - new Date(a.performedAt))

            return combinedTimeline.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No activity recorded yet</p>
            ) : (
              <>
                <div className="relative pl-[20px] before:absolute before:left-[19px] before:top-0 before:bottom-0 before:w-0.5 before:bg-slate-200 space-y-6">
                  {combinedTimeline.map((log) => {
                    const IconComp = actionIcons[log.action] || Clock
                    const style = timelineEntryStyle[log.action] || { bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200' }
                    const detail = log.details && typeof log.details === 'object' ? log.details : null
                    const description = detail
                      ? Object.entries(detail)
                          .filter(([, v]) => v != null)
                          .map(([k, v]) => {
                            const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())
                            return `${label}: ${String(v)}`
                          })
                          .join(' • ')
                      : null
                    const authorName = log.performedByName || 'System'
                    const authorInitials = authorName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

                    return (
                      <div key={log.id} className="relative flex gap-5">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full ${style.bg} flex items-center justify-center ${style.text} z-10 border-4 border-slate-50`}>
                          <IconComp size={20} />
                        </div>
                        <div className={`flex-1 bg-white rounded-xl border border-slate-200 p-5 shadow-sm ${style.leftBorder ? 'border-l-4 border-l-brand-600' : ''} ${style.gradient ? 'bg-gradient-to-br from-brand-50/50 to-transparent' : ''} hover:shadow-md transition-shadow`}>
                          <div className="flex justify-between items-start mb-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-800">{actionLabels[log.action] || log.action}</h4>
                              {log.action === 'follow_up_completed' && (
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded uppercase">Outcome: Completed</span>
                              )}
                            </div>
                            <span className="text-xs text-slate-400 whitespace-nowrap">{formatTimeAgo(log.performedAt)}</span>
                          </div>
                          {description && (
                            <p className="text-sm text-slate-600 mt-1">{description}</p>
                          )}
                          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-[10px] flex items-center justify-center font-bold">
                              {authorInitials}
                            </div>
                            <span className="text-xs text-slate-500">{authorName}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {activityLog.length > 0 && (
                  <div className="flex justify-center pb-4">
                    <button className="px-6 py-2 rounded-lg border border-slate-200 text-slate-500 font-semibold text-sm hover:bg-slate-50 transition-colors">
                      Load Historical Data
                    </button>
                  </div>
                )}
              </>
            )
          })()}
        </div>
      )}

      {/* ==================== TAB: DOCUMENTS ==================== */}
      {activeTab === 3 && (
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={docSearch}
                onChange={(e) => setDocSearch(e.target.value)}
                placeholder="Filter documents..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-400"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {['All', 'Application', 'ID', 'Policy Docs', 'Signed Forms', 'Supporting'].map((chip) => (
                <button
                  key={chip}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    docFilter === chip
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  onClick={() => setDocFilter(chip)}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Drag & Drop Upload Zone */}
          <label
            className="w-full border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center bg-white cursor-pointer hover:bg-brand-50/30 hover:border-brand-400 transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3 group-hover:bg-brand-100 group-hover:text-brand-600 transition-colors">
              <Upload size={28} className="text-slate-400 group-hover:text-brand-600" />
            </div>
            <p className="text-sm font-semibold text-slate-700">Drag files here or click to upload</p>
            <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG up to 25MB per file</p>
            <input type="file" className="hidden" onChange={handleFileUpload} multiple accept=".pdf,.jpg,.jpeg,.png" />
          </label>

          {/* Documents Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-slate-50">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Document Vault</h3>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock size={12} />
                Download History
              </span>
            </div>

            {documentsList.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-12">No documents uploaded yet</p>
            ) : (
              <>
                <table className="w-full text-left border-collapse">
                  <thead className="bg-white border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Document</th>
                      <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Uploaded By</th>
                      <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Version</th>
                      <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Expiry</th>
                      <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDocuments.map((doc) => {
                      const catStyle = docCategoryStyles[doc.documentCategory] || docCategoryStyles['Supporting']
                      const isExpired = doc.expiryDate && new Date(doc.expiryDate) < new Date()
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
                              {doc.documentCategory || doc.documentType || 'Other'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-500">
                                {(doc.uploadedByName || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                              </div>
                              <span className="text-xs text-slate-600">{doc.uploadedByName || 'Unknown'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500">{formatDate(doc.uploadedAt)}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-600">
                              v{doc.version || 1}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {doc.expiryDate ? (
                              <span className={`text-xs font-semibold flex items-center gap-1 ${isExpired ? 'text-red-500' : 'text-slate-500'}`}>
                                {isExpired && <AlertTriangle size={12} />}
                                {formatDate(doc.expiryDate)}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-300">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <a
                                href={`/api/clients/${clientId}/documents/${doc.id}/download`}
                                className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors"
                                title="Download"
                              >
                                <Download size={16} />
                              </a>
                              <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors" title="More">
                                <MoreVertical size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between">
                  <p className="text-xs text-slate-400 font-medium">Showing {filteredDocuments.length} of {documentsList.length} documents</p>
                  <div className="flex gap-1">
                    <button className="p-1.5 rounded bg-slate-100 text-slate-400 disabled:opacity-50" disabled>
                      <ChevronLeft size={16} />
                    </button>
                    <button className="p-1.5 rounded bg-brand-600 text-white">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB: TASKS (Follow-ups) ==================== */}
      {activeTab === 4 && (
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Task Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {['All', 'Open', 'In Progress', 'Done', 'Overdue'].map((chip) => (
                <button
                  key={chip}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${
                    taskFilter === chip
                      ? 'bg-brand-100 text-brand-700'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-brand-300'
                  }`}
                  onClick={() => setTaskFilter(chip)}
                >
                  {chip}
                </button>
              ))}
            </div>
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
              <button
                className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${
                  taskView === 'mine' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
                }`}
                onClick={() => setTaskView('mine')}
              >
                My Tasks
              </button>
              <button
                className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${
                  taskView === 'all' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
                }`}
                onClick={() => setTaskView('all')}
              >
                All Agent Tasks
              </button>
            </div>
          </div>

          {filteredTasks.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-12">No tasks found</p>
          ) : (
            <div className="space-y-8">
              {/* Overdue Section */}
              {overdueTasks.length > 0 && (taskFilter === 'All' || taskFilter === 'Overdue') && (
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-6 bg-red-500 rounded-full" />
                    <h3 className="text-[11px] font-bold text-red-500 uppercase tracking-widest">Overdue ({overdueTasks.length})</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {overdueTasks.map((fu) => {
                      const TypeIcon = taskTypeIcons[fu.type] || ClipboardList
                      return (
                        <div key={fu.id} className="task-card bg-white p-5 border border-slate-200 rounded-xl flex items-center gap-5 transition-all hover:shadow-md">
                          <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                            <TypeIcon size={22} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h4 className="text-sm font-bold text-slate-800 capitalize">{fu.type?.replace(/_/g, ' ') || 'Task'}</h4>
                              <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                            </div>
                            <p className="text-sm text-slate-500 truncate">{fu.notes || 'No description'}</p>
                          </div>
                          <div className="flex items-center gap-5 shrink-0">
                            <div className="flex flex-col items-end">
                              <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-[10px] font-bold">
                                DUE {new Date(fu.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}
                              </span>
                              <span className="text-[10px] text-slate-400 mt-1 uppercase font-bold">
                                {fu.assignedTo || 'Unassigned'}
                              </span>
                            </div>
                            <input
                              type="checkbox"
                              className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                              onChange={async () => {
                                await updateFollowUp(fu.id, { status: 'completed', completedAt: new Date().toISOString() })
                                await refreshData()
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* Due Soon Section */}
              {dueSoonTasks.length > 0 && (taskFilter === 'All' || taskFilter === 'Open' || taskFilter === 'In Progress') && (
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-6 bg-blue-500 rounded-full" />
                    <h3 className="text-[11px] font-bold text-blue-600 uppercase tracking-widest">Due Soon ({dueSoonTasks.length})</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {dueSoonTasks.map((fu) => {
                      const TypeIcon = taskTypeIcons[fu.type] || ClipboardList
                      const daysUntil = Math.ceil((new Date(fu.scheduledAt) - new Date()) / (1000 * 60 * 60 * 24))
                      return (
                        <div key={fu.id} className="task-card bg-white p-5 border border-slate-200 rounded-xl flex items-center gap-5 transition-all hover:shadow-md">
                          <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                            <TypeIcon size={22} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h4 className="text-sm font-bold text-slate-800 capitalize">{fu.type?.replace(/_/g, ' ') || 'Task'}</h4>
                              <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                            </div>
                            <p className="text-sm text-slate-500 truncate">{fu.notes || 'No description'}</p>
                          </div>
                          <div className="flex items-center gap-5 shrink-0">
                            <div className="flex flex-col items-end">
                              <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-bold">
                                IN {daysUntil} DAY{daysUntil !== 1 ? 'S' : ''}
                              </span>
                            </div>
                            <input
                              type="checkbox"
                              className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                              onChange={async () => {
                                await updateFollowUp(fu.id, { status: 'completed', completedAt: new Date().toISOString() })
                                await refreshData()
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* Other/Open Tasks */}
              {otherTasks.length > 0 && (taskFilter === 'All' || taskFilter === 'Open' || taskFilter === 'In Progress') && (
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-6 bg-slate-300 rounded-full" />
                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Upcoming ({otherTasks.length})</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {otherTasks.map((fu) => {
                      const TypeIcon = taskTypeIcons[fu.type] || ClipboardList
                      return (
                        <div key={fu.id} className="task-card bg-white p-5 border border-slate-200 rounded-xl flex items-center gap-5 transition-all hover:shadow-md">
                          <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                            <TypeIcon size={22} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h4 className="text-sm font-bold text-slate-800 capitalize">{fu.type?.replace(/_/g, ' ') || 'Task'}</h4>
                            </div>
                            <p className="text-sm text-slate-500 truncate">{fu.notes || 'No description'}</p>
                          </div>
                          <div className="flex items-center gap-5 shrink-0">
                            <div className="flex flex-col items-end">
                              <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-bold">
                                DUE {new Date(fu.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}
                              </span>
                            </div>
                            <input
                              type="checkbox"
                              className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                              onChange={async () => {
                                await updateFollowUp(fu.id, { status: 'completed', completedAt: new Date().toISOString() })
                                await refreshData()
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* Completed Section */}
              {completedTasks.length > 0 && (taskFilter === 'All' || taskFilter === 'Done') && (
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-6 bg-slate-300 rounded-full" />
                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Completed ({completedTasks.length})</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-3 opacity-60">
                    {completedTasks.map((fu) => {
                      const TypeIcon = taskTypeIcons[fu.type] || ClipboardList
                      return (
                        <div key={fu.id} className="task-card bg-slate-50 p-5 border border-slate-200 rounded-xl flex items-center gap-5">
                          <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center text-green-600 shrink-0">
                            <CheckCircle size={22} />
                          </div>
                          <div className="flex-1 min-w-0 line-through">
                            <h4 className="text-sm font-bold text-slate-600 capitalize">{fu.type?.replace(/_/g, ' ') || 'Task'}</h4>
                            <p className="text-sm text-slate-400 truncate">{fu.notes || 'No description'}</p>
                          </div>
                          <div className="flex items-center gap-5 shrink-0">
                            <span className="text-[10px] text-slate-400 uppercase font-bold">
                              Done {fu.completedAt ? formatTimeAgo(fu.completedAt) : ''}
                            </span>
                            <input
                              type="checkbox"
                              checked
                              disabled
                              className="w-5 h-5 rounded border-slate-300 text-green-600 focus:ring-green-500"
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB: COMPLIANCE (Notes) ==================== */}
      {activeTab === 5 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h3 className="text-sm font-bold text-slate-800">Compliance Notes</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex gap-3">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a compliance note..."
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 resize-none"
                rows={3}
              />
              <button
                onClick={handleAddNote}
                disabled={!newNote.trim()}
                className="px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 self-end"
              >
                Add
              </button>
            </div>
            {notesList.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No compliance notes yet</p>
            ) : (
              <div className="space-y-3">
                {notesList.map((note) => (
                  <div key={note.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-800">{note.content}</p>
                    <p className="text-xs text-slate-500 mt-2">
                      {note.createdByName || 'User'} · {formatTimeAgo(note.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== MODALS ==================== */}

      {/* Policy Modal */}
      {showPolicyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Add Policy</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Policy Number *</label>
                <input value={policyForm.policyNumber} onChange={(e) => setPolicyForm({ ...policyForm, policyNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Policy Type *</label>
                <input value={policyForm.policyType} onChange={(e) => setPolicyForm({ ...policyForm, policyType: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Carrier</label>
                <input value={policyForm.carrier} onChange={(e) => setPolicyForm({ ...policyForm, carrier: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Product</label>
                <input value={policyForm.product} onChange={(e) => setPolicyForm({ ...policyForm, product: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Effective Date</label>
                <input type="date" value={policyForm.effectiveDate} onChange={(e) => setPolicyForm({ ...policyForm, effectiveDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Renewal Date</label>
                <input type="date" value={policyForm.renewalDate} onChange={(e) => setPolicyForm({ ...policyForm, renewalDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Expiry Date</label>
                <input type="date" value={policyForm.expiryDate} onChange={(e) => setPolicyForm({ ...policyForm, expiryDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Premium</label>
                <input type="number" value={policyForm.premium} onChange={(e) => setPolicyForm({ ...policyForm, premium: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowPolicyModal(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={handleAddPolicy} className="px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-700 transition-colors">
                Add Policy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Follow-up Modal */}
      {showFollowUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Add Task</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Type</label>
                <select value={followUpForm.type} onChange={(e) => setFollowUpForm({ ...followUpForm, type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-400">
                  <option value="call">Call</option>
                  <option value="email">Email</option>
                  <option value="meeting">Meeting</option>
                  <option value="task">Task</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Scheduled At *</label>
                <input type="datetime-local" value={followUpForm.scheduledAt}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, scheduledAt: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Notes</label>
                <textarea value={followUpForm.notes} onChange={(e) => setFollowUpForm({ ...followUpForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-400 resize-none" rows={3} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowFollowUpModal(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={handleAddFollowUp} className="px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-700 transition-colors">
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Household Modal */}
      {showHouseholdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Add Household Member</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">First Name *</label>
                  <input value={householdForm.firstName} onChange={(e) => setHouseholdForm({ ...householdForm, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Last Name *</label>
                  <input value={householdForm.lastName} onChange={(e) => setHouseholdForm({ ...householdForm, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Relationship</label>
                <input value={householdForm.relationship} onChange={(e) => setHouseholdForm({ ...householdForm, relationship: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-400"
                  placeholder="e.g. Spouse, Child, Parent" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Date of Birth</label>
                <input type="date" value={householdForm.dateOfBirth} onChange={(e) => setHouseholdForm({ ...householdForm, dateOfBirth: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Email</label>
                <input type="email" value={householdForm.email} onChange={(e) => setHouseholdForm({ ...householdForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Phone</label>
                <input value={householdForm.phone} onChange={(e) => setHouseholdForm({ ...householdForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowHouseholdModal(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={handleAddHousehold} className="px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-700 transition-colors">
                Add Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
