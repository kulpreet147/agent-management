import { useState, useEffect } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Flame,
  Info,
  Brain,
  ClipboardList,
  Pencil,
  Settings,
  Globe,
  UserCheck,
  ExternalLink,
  Phone,
  Mail,
  MessageSquare,
  ClipboardCheck,
  FileText,
  Calculator,
  Star,
  TrendingUp,
  X,
  UserPlus,
  ChevronDown,
  History,
  Package,
  RefreshCw,
  CheckCircle,
  Calendar,
  Clock,
  Users,
  StickyNote,
  Shield,
} from 'lucide-react'
import { addFollowUp, reassignAgent, addNote, getLead, getFollowUps, getActivityLog, updateLeadStatus, listQuotes } from '../../utils/leads.js'
import { getAgents } from '../../utils/agents.js'
import { getPersonByPersonId, getQuotes, getOrCreatePersonByLeadId } from '../../utils/persons.js'
import QuoteModal from '../../components/QuoteModal.jsx'
import { notify } from '../../utils/notify.js'
import { confirmDialog } from '../../utils/confirmDialog.js'
import LeadFamilyTab from '../../components/tabs/LeadFamilyTab.jsx'
import LeadQuotesTab from '../../components/tabs/LeadQuotesTab.jsx'
import LeadNotesTab from '../../components/tabs/LeadNotesTab.jsx'

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

const formatDetails = (action, details) => {
  if (!details || typeof details !== 'object') return null
  const d = { ...details }
  switch (action) {
    case 'lead_created':
      return null
    case 'status_changed':
      if (d.fromStatus && d.toStatus) {
        return `Changed from "${d.fromStatus}" to "${d.toStatus}"`
      }
      return d.toStatus ? `Status changed to "${d.toStatus}"` : null
    case 'follow_up_added':
    case 'follow_up_created':
      return d.type ? `Follow-up type: ${d.type}` : null
    case 'follow_up_completed':
      return d.outcome ? `Outcome: ${d.outcome}` : null
    case 'follow_up_skipped':
      return d.reason ? `Reason: ${d.reason}` : null
    case 'note_added':
      return d.content ? `"${d.content}"` : null
    case 'lead_assigned':
      return d.agentName ? `Assigned to ${d.agentName}` : (d.agentId ? `Assigned to agent` : null)
    case 'agent_unassigned':
      return d.agentName ? `Unassigned ${d.agentName}` : null
    case 'lead_reassigned':
      return d.targetAgentName ? `Reassigned to ${d.targetAgentName}` : null
    case 'agent_reassigned':
      return d.reason ? `Reason: ${d.reason}` : null
    case 'lead_created_from_excel':
      return null
    case 'need_analysis_saved':
    case 'need_analysis_updated':
      if (d.summary) return d.summary
      if (d.fields && Array.isArray(d.fields)) {
        const sections = new Set()
        const sectionMap = {
          ownHouse: 'Assets', houseValue: 'Assets', mortgageRemaining: 'Assets', rrsp: 'Assets', tfsa: 'Assets',
          outstandingMortgage: 'Liabilities', lineOfCredit: 'Liabilities', creditCardDebt: 'Liabilities',
          annualIncomePrimary: 'Income', annualIncomeSpouse: 'Income', totalHouseholdIncome: 'Income',
          lifeInsurance: 'Insurance', criticalIllness: 'Insurance', disability: 'Insurance', groupInsurance: 'Insurance',
          spouseName: 'Family', spouseDOB: 'Family', children: 'Family',
          desiredCoverage: 'Coverage', budgetMonthly: 'Coverage', coverageNotes: 'Coverage',
        }
        d.fields.forEach((f) => { if (sectionMap[f]) sections.add(sectionMap[f]) })
        return `Updated ${d.fields.length} fields across ${sections.size} sections`
      }
      return 'Need analysis updated'
    case 'need_analysis_sent_to_client':
      return d.clientEmail ? `Sent to ${d.clientEmail}${d.delivered === false ? ' (delivery failed)' : ''}` : null
    case 'need_analysis_deleted':
      return null
    case 'quote_run':
      return d.carrierCount ? `Found ${d.carrierCount} quotes` : null
    case 'quote_selected':
      return d.carrier && d.premium ? `${d.carrier} at CHF ${d.premium}/mo` : null
    case 'quote_deleted':
      return null
    case 'quote_emailed_to_client':
      return d.clientEmail ? `Sent to ${d.clientEmail}${d.delivered === false ? ' (delivery failed)' : ''}` : null
    case 'converted':
      return null
    default: {
      const skip = ['fromStatus', 'toStatus', 'isNew', 'reportId', 'delivered', 'leadId', 'followUpId', 'agentId', 'targetAgentId', 'fromAgentId', 'agentName', 'targetAgentName', 'fromAgentName']
      const nonMeta = Object.fromEntries(Object.entries(d).filter(([k]) => !skip.includes(k)))
      if (Object.keys(nonMeta).length === 0) return null
      return Object.entries(nonMeta).map(([k, v]) => {
        if (v === null || v === undefined || v === false) return null
        const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())
        if (Array.isArray(v)) return `${label}: ${v.join(', ')}`
        if (typeof v === 'object') return `${label}: ${JSON.stringify(v)}`
        return `${label}: ${v}`
      }).filter(Boolean).join(' • ')
    }
  }
}

const actionLabels = {
  lead_created: 'Lead Created',
  lead_assigned: 'Lead Assigned',
  agent_unassigned: 'Agent Unassigned',
  lead_reassigned: 'Lead Reassigned',
  status_changed: 'Status Changed',
  follow_up_added: 'Follow-Up Scheduled',
  follow_up_created: 'Follow-Up Scheduled',
  follow_up_completed: 'Follow-Up Completed',
  follow_up_skipped: 'Follow-Up Skipped',
  note_added: 'Note Added',
  agent_reassigned: 'Agent Reassigned',
  lead_created_from_excel: 'Imported from Excel',
  need_analysis_saved: 'Need Analysis Updated',
  need_analysis_updated: 'Need Analysis Updated',
  need_analysis_sent_to_client: 'Need Analysis Sent',
  need_analysis_deleted: 'Need Analysis Deleted',
  quote_run: 'Quote Run',
  quote_selected: 'Quote Selected',
  quote_deleted: 'Quote Deleted',
  quote_emailed_to_client: 'Quote Sent to Client',
  converted: 'Lead Converted',
}

export default function LeadDetail() {
  const navigate = useNavigate()
  const location = useLocation()
  const { leadId } = useParams()
  const passedLead = location.state?.lead
  const [lead, setLead] = useState(passedLead || null)
  const [loading, setLoading] = useState(!leadId)
  const [apiLead, setApiLead] = useState(null)
  const [followUpsList, setFollowUpsList] = useState([])
  const [activityLog, setActivityLog] = useState([])
  const [leadStatus, setLeadStatus] = useState('new')
  const [personUuid, setPersonUuid] = useState(null)
  const [showQuoteModal, setShowQuoteModal] = useState(false)
  const [leadRefreshKey, setLeadRefreshKey] = useState(0)

  useEffect(() => {
    if (!leadId) {
      navigate('/admin/leads', { replace: true })
      return
    }
    setLoading(true)
    Promise.all([
      getLead(leadId).catch(() => null),
      getFollowUps(leadId).catch(() => []),
      getActivityLog(leadId).catch(() => ({ logs: [] })),
    ])
      .then(([apiData, followUps, activityData]) => {
        if (apiData) {
          setApiLead(apiData)
          setLead({
            id: apiData.id,
            leadId: apiData.leadId,
            uuid: apiData.id,
            name: `${apiData.firstName} ${apiData.lastName}`,
            phone: apiData.phone,
            email: apiData.email,
            dateOfBirth: apiData.dateOfBirth,
            maritalStatus: apiData.maritalStatus,
            residencyStatus: apiData.residencyStatus,
            occupation: apiData.occupation,
            employer: apiData.employer,
            address: apiData.address,
            productInterest: apiData.productInterest,
            leadSource: apiData.leadSource,
            status: apiData.status ? apiData.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'New',
            priority: apiData.leadPriority ? apiData.leadPriority.charAt(0).toUpperCase() + apiData.leadPriority.slice(1) : 'Cold',
            createdAt: apiData.createdAt,
            updatedAt: apiData.updatedAt,
            assignments: apiData.assignments,
          })
          setFollowUpsList(Array.isArray(followUps) ? followUps : [])
          setActivityLog(Array.isArray(activityData?.logs) ? activityData.logs : [])
          setLeadStatus(apiData.status || 'new')
          getOrCreatePersonByLeadId(apiData)
            .then((person) => setPersonUuid(person.id))
            .catch(() => setPersonUuid(null))
        }
      })
      .catch(() => navigate('/admin/leads', { replace: true }))
      .finally(() => setLoading(false))
  }, [leadId, navigate, leadRefreshKey])

  useEffect(() => {
    const handler = (e) => {
      const { leadId: updatedLeadId, leadUuid: updatedLeadUuid } = e.detail || {}
      if (!updatedLeadId || updatedLeadId === leadId || updatedLeadUuid === leadId) setLeadRefreshKey(k => k + 1)
    }
    window.addEventListener('lead:realtime-update', handler)
    return () => window.removeEventListener('lead:realtime-update', handler)
  }, [leadId])

  const [activeTab, setActiveTab] = useState(0)
  const [showReassign, setShowReassign] = useState(false)
  const [reassignState, setReassignState] = useState('idle')
  const [reassignForm, setReassignForm] = useState({ agentId: '', split: 100, reason: '' })
  const [showFollowUpModal, setShowFollowUpModal] = useState(false)
  const [followUpForm, setFollowUpForm] = useState({
    activityType: 'Call', date: '', time: '', outcomeGoal: '',
    reminder: '', notes: '', quickLogOutcome: '',
  })
  const [newFollowUps, setNewFollowUps] = useState([])
  const [agentsList, setAgentsList] = useState([])

  useEffect(() => {
    if (showReassign && agentsList.length === 0) {
      getAgents()
        .then((data) => {
          const list = Array.isArray(data) ? data : (data?.agents || [])
          const active = list.filter(a => a.status === 'active' && a.accountActivationStatus === 1)
          setAgentsList(active)
        })
        .catch(() => setAgentsList([]))
    }
  }, [showReassign])

  const handleQuoteSaved = (log) => {
    setActivityLog((prev) => [log, ...prev])
    setShowQuoteModal(false)
  }

  const handleMarkConverted = async () => {
    if (!lead) return
    if (lead.status?.toLowerCase?.() === 'converted') {
      notify.info('This lead is already converted.')
      return
    }
    const ok = await confirmDialog({
      title: 'Convert lead',
      message: `Mark "${lead.name}" as converted? This will create a new client profile from this lead's data.`,
      confirmText: 'Convert',
    })
    if (!ok) return
    try {
      let quotes = []
      // Try person_quotes first
      if (personUuid) {
        const personData = await getQuotes(personUuid)
        const personQuotes = Array.isArray(personData) ? personData : []
        if (personQuotes.length > 0) {
          quotes = personQuotes
        }
      }
      // Fallback to lead_quotes
      if (quotes.length === 0) {
        const leadData = await listQuotes(lead.id)
        const leadQuotes = Array.isArray(leadData?.quotes) ? leadData.quotes : Array.isArray(leadData) ? leadData : []
        quotes = leadQuotes
      }
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
        `Convert "${lead.name}" with this quote?\n\n` +
        `Carrier: ${selectedQuote.carrier || 'N/A'}\n` +
        `Product: ${selectedQuote.model || selectedQuote.product || 'N/A'}\n` +
        `Premium: ${selectedQuote.currency || 'CHF'} ${Number(selectedQuote.premiumMonthly || selectedQuote.premium || 0).toLocaleString()}/mo\n\n` +
        `This will create a new client profile and policy.`
      )
      if (!confirmed) return

      await updateLeadStatus(lead.id, 'converted', 'Marked as converted from Quick Actions')
      const updatedLead = await getLead(lead.id)
      setLead({
        ...updatedLead,
        name: `${updatedLead.firstName} ${updatedLead.lastName}`,
        status: updatedLead.status ? updatedLead.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'New',
        priority: updatedLead.leadPriority ? updatedLead.leadPriority.charAt(0).toUpperCase() + updatedLead.leadPriority.slice(1) : 'Cold',
      })
      setLeadStatus(updatedLead.status)
      const activity = await getActivityLog(lead.id).catch(() => ({ logs: [] }))
      setActivityLog(Array.isArray(activity?.logs) ? activity.logs : [])

      const goToList = await confirmDialog({
        title: 'Lead converted',
        message: `"${lead.name}" has been converted to a client successfully! Go to Client Management?`,
        confirmText: 'Go to Clients',
        cancelText: 'Stay here',
      })
      if (goToList) {
        navigate('/admin/clients')
      }
    } catch (err) {
      notify.error(err.message || 'Failed to mark as converted')
    }
  }

  const handleAddNoteAdmin = async () => {
    const content = await confirmDialog({ title: 'Add note', message: 'Add a note about this lead:', input: { placeholder: 'Type your note...' } })
    if (!content?.trim()) return
    try {
      const result = await addNote(lead.id, { content: content.trim() })
      if (result?.log) {
        setActivityLog((prev) => [result.log, ...prev])
      } else {
        setActivityLog((prev) => [
          {
            action: 'note_added',
            details: { content: content.trim() },
            performedAt: new Date().toISOString(),
          },
          ...prev,
        ])
      }
    } catch (err) {
      notify.error(err.message || 'Failed to add note')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw size={20} className="animate-spin text-blue-600 mr-2" />
        <p className="text-slate-500 text-sm">Loading lead details...</p>
      </div>
    )
  }

  if (!lead) {
    navigate('/admin/leads', { replace: true })
    return null
  }

  const tabs = [
    { label: 'Profile', icon: Info, to: null },
    { label: 'Family', icon: Users, to: null },
    { label: 'Quotes', icon: Calculator, to: null },
    { label: 'Need Analysis', icon: Brain, to: 'need-analysis' },
    { label: 'Follow-ups', icon: Calendar, to: null },
    { label: 'Activity Log', icon: ClipboardList, to: null },
    { label: 'Notes', icon: StickyNote, to: null },
  ]

  const formatActivityDate = (d) => {
    if (!d) return 'N/A'
    const date = new Date(d)
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    }
  }

  const realFollowUps = followUpsList.map((f) => {
    const dt = formatActivityDate(f.createdAt || f.scheduledAt)
    const scheduled = formatActivityDate(f.scheduledAt)
    return {
      date: dt.date,
      time: dt.time,
      scheduledDate: scheduled.date,
      scheduledTime: scheduled.time,
      action: f.type ? f.type.charAt(0).toUpperCase() + f.type.slice(1) : 'Task',
      actionIcon: f.type === 'call' ? Phone : f.type === 'email' ? Mail : f.type === 'meeting' ? Users : StickyNote,
      actionColor: 'text-blue-600',
      outcome: f.notes || f.status || 'Pending',
      outcomeStyle: f.status === 'completed' ? 'bg-green-100 text-green-800' : f.status === 'missed' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800',
      agent: f.agentName || 'Agent',
    }
  })

  const followups = [...newFollowUps.map((f) => ({
    date: f.date,
    time: f.time,
    action: f.activityType,
    actionIcon: f.activityType === 'Call' ? Phone : f.activityType === 'Email' ? Mail : f.activityType === 'Meeting' ? Users : StickyNote,
    actionColor: 'text-blue-600',
    outcome: f.outcomeGoal || 'Pending',
    outcomeStyle: f.outcomeGoal ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800',
    agent: 'Current User',
  })), ...realFollowUps]

  const priorityStyle =
    lead.priority === 'Hot' ? 'bg-red-100 text-red-700 border-red-200' :
      lead.priority === 'Warm' ? 'bg-orange-100 text-orange-700 border-orange-200' :
        'bg-blue-100 text-blue-700 border-blue-200'

  const getLeadUuid = () => lead?.uuid || leadId

  const handleAddFollowUp = async (e) => {
    e.preventDefault()
    const entry = {
      activityType: followUpForm.activityType,
      date: followUpForm.date || new Date().toISOString().split('T')[0],
      time: followUpForm.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      outcomeGoal: followUpForm.outcomeGoal,
      notes: followUpForm.notes,
      quickLogOutcome: followUpForm.quickLogOutcome,
    }
    setNewFollowUps((prev) => [entry, ...prev])

    const uuid = getLeadUuid()
    if (uuid) {
      try {
        const typeMap = { Call: 'call', Email: 'email', Meeting: 'meeting', Note: 'task' }
        const scheduledAt = followUpForm.date
          ? `${followUpForm.date}T${followUpForm.time || '12:00'}`
          : new Date().toISOString()
        await addFollowUp(uuid, {
          type: typeMap[followUpForm.activityType] || 'task',
          scheduledAt,
          notes: followUpForm.notes,
        })
        const updated = await getFollowUps(uuid).catch(() => [])
        setFollowUpsList(Array.isArray(updated) ? updated : [])
        setNewFollowUps([])
      } catch (err) {
        console.error('Failed to persist follow-up:', err)
        notify.error(err.message || 'Failed to save follow-up. Please try again.')
        setNewFollowUps((prev) => prev.slice(1))
      }
    }

    setShowFollowUpModal(false)
    setFollowUpForm({ activityType: 'Call', date: '', time: '', outcomeGoal: '', reminder: '', notes: '', quickLogOutcome: '' })
  }

  const handleConfirmReassign = async () => {
    setReassignState('processing')
    notify.info('Lead reassignment is under implementation and will be available soon.')
    setReassignState('idle')
    setShowReassign(false)
    setReassignForm({ agentId: '', split: 100, reason: '' })
    return
    try {
      const uuid = getLeadUuid()
      if (uuid && reassignForm.agentId) {
        const result = await reassignAgent(uuid, reassignForm.agentId, Number(reassignForm.split) || 100, reassignForm.reason)
        const refreshedLead = result || await getLead(uuid).catch(() => null)
        if (refreshedLead) {
          setApiLead(refreshedLead)
          setLead({
            id: refreshedLead.id,
            leadId: refreshedLead.leadId,
            uuid: refreshedLead.id,
            name: `${refreshedLead.firstName} ${refreshedLead.lastName}`,
            phone: refreshedLead.phone,
            email: refreshedLead.email,
            dateOfBirth: refreshedLead.dateOfBirth,
            maritalStatus: refreshedLead.maritalStatus,
            residencyStatus: refreshedLead.residencyStatus,
            occupation: refreshedLead.occupation,
            employer: refreshedLead.employer,
            address: refreshedLead.address,
            productInterest: refreshedLead.productInterest,
            leadSource: refreshedLead.leadSource,
            status: refreshedLead.status ? refreshedLead.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'New',
            priority: refreshedLead.leadPriority ? refreshedLead.leadPriority.charAt(0).toUpperCase() + refreshedLead.leadPriority.slice(1) : 'Cold',
            createdAt: refreshedLead.createdAt,
            updatedAt: refreshedLead.updatedAt,
            assignments: refreshedLead.assignments,
          })
        }
      }
      setReassignState('success')
      setTimeout(() => {
        setShowReassign(false)
        setReassignForm({ agentId: '', split: 100, reason: '' })
        setTimeout(() => setReassignState('idle'), 300)
      }, 800)
    } catch (err) {
      console.error('Reassign failed:', err)
      notify.error(err.message || 'Reassign failed')
      setReassignState('idle')
    }
  }

  return (
    <div className="space-y-6">
      {/* Back + title + badges + actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/admin/leads')}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-900">{lead.name}</h2>
            <span className="px-3 py-1 bg-amber-50 text-amber-700 text-[11px] font-bold rounded-full uppercase tracking-tight border border-amber-200">
              Status: {lead.status === 'In Progress' ? 'In Progress' : lead.status}
            </span>
            <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-tight flex items-center gap-1 border ${priorityStyle}`}>
              <Flame size={14} />
              {lead.priority}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowReassign(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-opacity"
          >
            Reassign
          </button>
        </div>
      </div>

      {/* Summary Bar */}
      <section className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <div className="grid grid-cols-5 gap-8">
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">Lead ID</p>
            <p className="text-base font-bold text-blue-600">{lead.leadId}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">Phone</p>
            <p className="text-base font-semibold text-slate-800">{lead.phone}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">Email</p>
            <p className="text-base font-semibold text-slate-800 break-all">{lead.email || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">Assigned Agents</p>
            <div className="flex items-center -space-x-2 mt-1">
              {(apiLead?.assignments || lead.assignments || []).filter(a => a.isActive).slice(0, 3).map((a, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-blue-500 flex items-center justify-center text-white text-[10px] font-bold">
                  {(a.agentId || a.agentName || 'A').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
              ))}
              {(!(apiLead?.assignments?.length) && !lead.assignments?.length) && (
                <span className="text-sm text-slate-500 font-medium">Unassigned</span>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">Created Date</p>
            <p className="text-base font-semibold text-slate-800">{lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : (apiLead?.createdAt ? new Date(apiLead.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A')}</p>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <nav className="flex border-b border-slate-200 gap-8 overflow-x-auto">
        {tabs.map((tab, i) => {
          const Icon = tab.icon
          const isActive = i === activeTab
          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => tab.to ? navigate(`/admin/leads/${lead.id}/${tab.to}`, { state: { lead } }) : setActiveTab(i)}
              className={`pb-4 px-1 flex items-center gap-2 whitespace-nowrap text-sm font-semibold transition-colors ${isActive ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-blue-600'
                }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          )
        })}
      </nav>

      {/* ==================== TAB: BASIC INFO (default) ==================== */}
      {activeTab === 0 && (
        <div>
          {/* Main Lead Info Grid */}
          <div className="grid grid-cols-12 gap-8">
            {/* Left: Customer Details */}
            <div className="col-span-12 lg:col-span-6 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h3 className="text-sm font-bold text-slate-800">Customer Details</h3>
              </div>
              <div className="p-6 grid grid-cols-2 gap-y-6 gap-x-8">
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1">Full Name</p>
                  <p className="text-sm text-slate-800">{lead.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1">Date of Birth</p>
                  <p className="text-sm text-slate-800">{apiLead?.dateOfBirth ? new Date(apiLead.dateOfBirth).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1">Marital Status</p>
                  <p className="text-sm text-slate-800">{apiLead?.maritalStatus || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1">Residency Status</p>
                  <p className="text-sm text-slate-800">{apiLead?.residencyStatus || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1">Residential Address</p>
                  <p className="text-sm text-slate-800">{apiLead?.address || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1">Occupation</p>
                  <p className="text-sm text-slate-800">{apiLead?.occupation || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1">Employer</p>
                  <p className="text-sm text-slate-800">{apiLead?.employer || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Right: Lead Meta Data */}
            <div className="col-span-12 lg:col-span-6 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-800">Lead Meta Data</h3>
                <Settings size={16} className="text-blue-600 cursor-pointer" />
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase mb-3">Interested Products</p>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const pi = apiLead?.productInterest || lead.productInterest
                      if (pi && typeof pi === 'object') {
                        const products = Object.entries(pi).filter(([, v]) => v).map(([k]) => k)
                        if (products.length === 0) {
                          return <span className="text-xs text-slate-500">No products selected</span>
                        }
                        return products.map((p, i) => (
                          <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-200">{p}</span>
                        ))
                      }
                      return <span className="text-xs text-slate-500">N/A</span>
                    })()}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase mb-1">Lead Source</p>
                    <div className="flex items-center gap-2">
                      <Globe size={18} className="text-orange-600" />
                      <p className="text-sm text-slate-800">{apiLead?.leadSource || lead.leadSource || 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase mb-1">Commission Split</p>
                    <p className="text-sm text-slate-800">
                      {(lead.assignments || apiLead?.assignments || []).filter(a => a.isActive).map(a => `${a.agentName || a.agentId} (${a.commissionShare}%)`).join(' / ') || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <UserCheck size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-500">Primary Handling Agent</p>
                      <p className="text-sm font-semibold text-slate-800">
                        {(lead.assignments || apiLead?.assignments || []).filter(a => a.isActive)[0]?.agentName || (lead.assignments || apiLead?.assignments || []).filter(a => a.isActive)[0]?.agentId || 'Unassigned'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom: Quick Actions + Lead Health */}
            <div className="col-span-12 space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-sm font-bold text-slate-800 mb-6">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setShowFollowUpModal(true)}
                    className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-blue-500 hover:text-blue-600 transition-all group"
                  >
                    <ClipboardCheck size={28} className="mb-2 text-slate-500 group-hover:text-blue-600 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold text-slate-600 group-hover:text-blue-600">Add Follow-Up</span>
                  </button>
                  <button
                    onClick={() => navigate(`/admin/leads/${leadId}/need-analysis`, { state: { lead } })}
                    className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-blue-500 hover:text-blue-600 transition-all group"
                  >
                    <FileText size={28} className="mb-2 text-slate-500 group-hover:text-blue-600 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold text-slate-600 group-hover:text-blue-600">Need Analysis</span>
                  </button>
                  <button
                    onClick={() => setShowQuoteModal(true)}
                    className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-blue-500 hover:text-blue-600 transition-all group"
                  >
                    <Calculator size={28} className="mb-2 text-slate-500 group-hover:text-blue-600 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold text-slate-600 group-hover:text-blue-600">Run Quote</span>
                  </button>
                  <button
                    onClick={handleAddNoteAdmin}
                    className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-blue-500 hover:text-blue-600 transition-all group"
                  >
                    <StickyNote size={28} className="mb-2 text-slate-500 group-hover:text-blue-600 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold text-slate-600 group-hover:text-blue-600">Add Note</span>
                  </button>
                  <button
                    onClick={handleMarkConverted}
                    disabled={lead?.status?.toLowerCase?.() === 'converted'}
                    className="flex flex-col items-center justify-center p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Star size={28} className="mb-2" />
                    <span className="text-xs font-semibold">
                      {lead?.status?.toLowerCase?.() === 'converted' ? 'Converted' : 'Mark Converted'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-700 to-blue-800 p-6 rounded-xl text-white relative overflow-hidden shadow-lg">
                <div className="relative z-10">
                  <h4 className="text-base font-bold mb-2">Lead Health: Excellent</h4>
                  <p className="text-sm text-white/80 mb-4">
                    The customer has engaged with 3 out of 4 communications and requested a term life quote.
                  </p>
                  <div className="w-full bg-white/20 h-2 rounded-full mb-2">
                    <div className="bg-white h-full rounded-full" style={{ width: '85%' }} />
                  </div>
                  <span className="text-xs font-bold">85% Conversion Probability</span>
                </div>
                <TrendingUp
                  size={120}
                  className="absolute -right-4 -bottom-4 text-white/10 rotate-12"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB: FAMILY ==================== */}
      {activeTab === 1 && <LeadFamilyTab personId={personUuid} lead={lead} />}

      {/* ==================== TAB: QUOTES ==================== */}
      {activeTab === 2 && <LeadQuotesTab personId={personUuid} lead={lead} />}

      {/* ==================== TAB: FOLLOW-UPS ==================== */}
      {activeTab === 4 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-blue-600" />
              <h3 className="text-sm font-bold text-slate-800">Follow-Up History</h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                  <th className="px-6 py-3">Recorded</th>
                  <th className="px-6 py-3">Action</th>
                  <th className="px-6 py-3">Outcome</th>
                  <th className="px-6 py-3">Agent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {followups.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-sm text-slate-500">No follow-ups recorded yet.</td>
                  </tr>
                ) : (
                  followups.map((f, i) => {
                    const ActionIcon = f.actionIcon
                    return (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-slate-800">{f.date}</p>
                          <p className="text-[11px] text-slate-500">{f.time}</p>
                          {f.scheduledDate && f.scheduledDate !== f.date && (
                            <p className="text-[10px] text-blue-500 mt-0.5">Scheduled: {f.scheduledDate}</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <ActionIcon size={16} className={f.actionColor} />
                            <span className="text-sm text-slate-700">{f.action}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${f.outcomeStyle}`}>
                            {f.outcome}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">{f.agent}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== TAB: ACTIVITY LOG ==================== */}
      {activeTab === 5 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-800">Activity Log</h3>
          </div>
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {activityLog.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-slate-500">No activity recorded yet.</p>
            ) : (
              activityLog.map((log, i) => {
                const detailText = formatDetails(log.action, log.details)
                return (
                  <div key={i} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-800">{actionLabels[log.action] || log.action.replace(/_/g, ' ')}</span>
                      <span className="text-[11px] text-slate-500">{formatTimeAgo(log.performedAt)}</span>
                    </div>
                    {detailText && (
                      <p className="text-xs text-slate-600 mt-1">{detailText}</p>
                    )}
                    {log.performedByName && (
                      <p className="text-[11px] text-slate-400 mt-1">by {log.performedByName}</p>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB: NOTES ==================== */}
      {activeTab === 6 && personUuid && <LeadNotesTab personId={personUuid} lead={lead} />}
      {activeTab === 6 && !personUuid && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <p className="text-sm text-amber-700 font-semibold">Person data not available. Please refresh the page.</p>
        </div>
      )}

      {/* ==================== FOLLOW-UP MODAL ==================== */}
      {showFollowUpModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(23, 28, 31, 0.6)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) { setShowFollowUpModal(false) } }}
        >
          <div className="relative bg-white w-full max-w-[560px] rounded-2xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="bg-white px-8 pt-8 pb-4 flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Schedule Follow-Up</h3>
                <div className="mt-2 inline-flex items-center gap-2 bg-blue-50 text-blue-800 px-3 py-1 rounded-full border border-blue-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider">For:</span>
                  <span className="text-[13px] font-semibold">{lead.name}</span>
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

            {/* Modal Content */}
            <form onSubmit={handleAddFollowUp} className="px-8 pb-8 space-y-6 max-h-[716px] overflow-y-auto">
              {/* Activity Type Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Activity Type</label>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { key: 'Call', icon: Phone },
                    { key: 'Email', icon: Mail },
                    { key: 'Meeting', icon: Users },
                    { key: 'Note', icon: StickyNote },
                  ].map(({ key, icon: Icon }) => {
                    const isActive = followUpForm.activityType === key
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFollowUpForm({ ...followUpForm, activityType: key })}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${isActive
                            ? 'border-blue-600 bg-blue-50 text-blue-600'
                            : 'border-slate-200 hover:border-blue-300 text-slate-500'
                          }`}
                      >
                        <Icon size={28} className="mb-1" />
                        <span className="text-[11px] font-bold">{key}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Date & Time Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Date</label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="date"
                      value={followUpForm.date}
                      onChange={(e) => setFollowUpForm({ ...followUpForm, date: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-[13px] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Time</label>
                  <div className="relative">
                    <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="time"
                      value={followUpForm.time}
                      onChange={(e) => setFollowUpForm({ ...followUpForm, time: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-[13px] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Outcome & Reminders */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Outcome Goal</label>
                  <select
                    value={followUpForm.outcomeGoal}
                    onChange={(e) => setFollowUpForm({ ...followUpForm, outcomeGoal: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-[13px] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white"
                  >
                    <option value="">Select outcome...</option>
                    <option>Schedule Demo</option>
                    <option>Finalize Pricing</option>
                    <option>Technical QA</option>
                    <option>Contract Signature</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Reminder</label>
                  <select
                    value={followUpForm.reminder}
                    onChange={(e) => setFollowUpForm({ ...followUpForm, reminder: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-[13px] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white"
                  >
                    <option value="">No reminder</option>
                    <option>15 mins before</option>
                    <option>1 hour before</option>
                    <option>1 day before</option>
                  </select>
                </div>
              </div>

              {/* Notes Textarea */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Follow-up Notes</label>
                <textarea
                  value={followUpForm.notes}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, notes: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-[13px] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
                  placeholder="What are the key points to cover?"
                  rows={4}
                />
              </div>

              {/* Quick Log Outcome Section */}
              <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle size={16} className="text-blue-600" />
                  <span className="text-[12px] font-bold text-slate-800">Quick Log Outcome</span>
                </div>
                <p className="text-[11px] text-slate-500 mb-3">
                  If this action was already performed, log the result here.
                </p>
                <select
                  value={followUpForm.quickLogOutcome}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, quickLogOutcome: e.target.value })}
                  className="w-full px-4 py-2 bg-white rounded-lg border border-slate-200 text-[13px] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                >
                  <option value="">Select previous result (Optional)</option>
                  <option>Successful Contact</option>
                  <option>Left Voicemail</option>
                  <option>No Answer</option>
                  <option>Wrong Number</option>
                </select>
              </div>
            </form>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-8 py-5 flex justify-end gap-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowFollowUpModal(false)}
                className="px-6 py-2.5 rounded-lg border border-slate-300 text-[12px] font-bold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleAddFollowUp}
                className="px-8 py-2.5 rounded-lg bg-blue-600 text-white text-[12px] font-bold shadow-lg shadow-blue-600/20 hover:opacity-90 active:scale-95 transition-all"
              >
                Save Follow-Up
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== REASSIGN MODAL ==================== */}
      {showReassign && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) { setShowReassign(false); setReassignState('idle') } }}
          onKeyDown={(e) => { if (e.key === 'Escape') { setShowReassign(false); setReassignState('idle') } }}
        >
          <div className="bg-white w-full max-w-[500px] rounded-xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-base font-semibold text-slate-900">Reassign Lead</h3>
              <button
                type="button"
                onClick={() => { setShowReassign(false); setReassignState('idle') }}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors"
              >
                <X size={18} className="text-slate-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[716px] overflow-y-auto">
              {/* Current Assignment */}
              <section>
                <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Current Assignment</h4>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-blue-200/50">
                      <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                        {((lead.assignments || apiLead?.assignments || []).find(a => a.isActive)?.agentId || 'A').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{(lead.assignments || apiLead?.assignments || []).find(a => a.isActive)?.agentName || (lead.assignments || apiLead?.assignments || []).find(a => a.isActive)?.agentId || 'Unassigned'}</p>
                      <p className="text-xs text-slate-500">Active Agent</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase">COMMISSION</p>
                    <p className="text-base font-bold text-blue-600">{(lead.assignments || apiLead?.assignments || []).find(a => a.isActive)?.commissionShare || 0}%</p>
                  </div>
                </div>
              </section>

              {/* New Assignment */}
              <section className="space-y-4">
                <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">New Assignment</h4>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-600">Select New Agent</label>
                  <div className="relative">
                    <UserPlus size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                      value={reassignForm.agentId}
                      onChange={(e) => setReassignForm({ ...reassignForm, agentId: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none"
                    >
                      <option value="" disabled>Choose an agent...</option>
                      {agentsList.map((agent) => (
                        <option key={agent.id} value={agent.agentId || agent.id}>
                          {agent.name || agent.firstName + ' ' + agent.lastName}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-600">Current Agent Split %</label>
                    <div className="relative">
                      <input className="w-full bg-white border border-slate-200 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" type="number" value={reassignForm.split} onChange={(e) => setReassignForm({ ...reassignForm, split: e.target.value })} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-600">New Agent Split %</label>
                    <div className="relative">
                      <input className="w-full bg-white border border-slate-200 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" type="number" defaultValue={100} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Reason & Notes */}
              <section className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-600">Reason for Reassignment</label>
                  <select
                    value={reassignForm.reason}
                    onChange={(e) => setReassignForm({ ...reassignForm, reason: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  >
                    <option value="">Select reason...</option>
                    <option value="Account Scaled to Enterprise">Account Scaled to Enterprise</option>
                    <option value="Agent Performance Review">Agent Performance Review</option>
                    <option value="Geographic Territory Shift">Geographic Territory Shift</option>
                    <option value="Agent Departure / Leave">Agent Departure / Leave</option>
                    <option value="Other">Other (Specify below)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-600">Internal Transfer Notes</label>
                  <textarea
                    value={reassignForm.reason}
                    onChange={(e) => setReassignForm({ ...reassignForm, reason: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    placeholder="Provide context for the new agent..."
                    rows={3}
                  />
                </div>
              </section>

              {/* Notifications */}
              <section className="space-y-3 py-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input type="checkbox" defaultChecked className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-slate-300 checked:bg-blue-600 checked:border-blue-600 transition-all" />
                    <CheckCircle size={12} className="absolute text-white opacity-0 peer-checked:opacity-100 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <span className="text-sm text-slate-700 group-hover:text-blue-600 transition-colors">Notify current agent</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input type="checkbox" defaultChecked className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-slate-300 checked:bg-blue-600 checked:border-blue-600 transition-all" />
                    <CheckCircle size={12} className="absolute text-white opacity-0 peer-checked:opacity-100 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <span className="text-sm text-slate-700 group-hover:text-blue-600 transition-colors">Notify new agent via Email &amp; Slack</span>
                </label>
              </section>

              {/* Assignment History Timeline */}
              <section className="pt-4 border-t border-slate-200">
                <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-4">Assignment History</h4>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <History size={14} className="text-slate-500" />
                    </div>
                    <div className="text-sm">
                      <p className="text-slate-800"><span className="font-semibold">{(lead.assignments || apiLead?.assignments || []).find(a => a.isActive)?.agentName || (lead.assignments || apiLead?.assignments || []).find(a => a.isActive)?.agentId || 'Agent'}</span> was assigned this lead</p>
                      <p className="text-slate-500 text-xs">{apiLead?.createdAt ? new Date(apiLead.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'} &bull; Manual Assignment</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <Package size={14} className="text-slate-500" />
                    </div>
                    <div className="text-sm">
                      <p className="text-slate-800">Lead created in <span className="font-semibold">System</span></p>
                      <p className="text-slate-500 text-xs">{apiLead?.createdAt ? new Date(apiLead.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'} &bull; {(apiLead?.leadSource || 'Web')}</p>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-5 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setShowReassign(false); setReassignState('idle') }}
                className="px-6 py-2.5 text-slate-600 text-sm font-semibold rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReassign}
                disabled={reassignState !== 'idle'}
                className={`px-6 py-2.5 text-white text-sm font-semibold rounded-lg shadow-sm transition-all active:scale-95 flex items-center gap-2 ${reassignState === 'success' ? 'bg-green-600' : 'bg-blue-600 hover:opacity-90'
                  }`}
              >
                {reassignState === 'processing' ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" /> Processing...
                  </>
                ) : reassignState === 'success' ? (
                  <>
                    <CheckCircle size={16} /> Success
                  </>
                ) : (
                  'Confirm Reassignment'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showQuoteModal && lead && (
        <QuoteModal
          lead={{ ...lead, id: lead.id || leadId }}
          personId={personUuid}
          onClose={() => setShowQuoteModal(false)}
          onQuoteSaved={handleQuoteSaved}
        />
      )}
    </div>
  )
}
