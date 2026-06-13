import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ChevronRight,
  ArrowLeft,
  Wallet,
  CreditCard,
  DollarSign,
  RefreshCw,
  BarChart3,
  FileText,
  Mail,
  Phone,
  Calendar,
  Clock,
  Plus,
  X,
  ClipboardCheck,
  ClipboardList,
  Calculator,
  Star,
  Users,
  Info,
  Brain,
  StickyNote,
} from "lucide-react";
import { auth } from "../../utils/auth.js";
import { notify } from "../../utils/notify.js";
import { confirmDialog } from "../../utils/confirmDialog.js";
import AgentSidebar from "../../components/AgentSidebar.jsx";
import CommonHeader from "../../components/CommonHeader.jsx";
import QuoteModal from "../../components/QuoteModal.jsx";
import LeadFamilyTab from "../../components/tabs/LeadFamilyTab.jsx";
import LeadQuotesTab from "../../components/tabs/LeadQuotesTab.jsx";
import LeadNotesTab from "../../components/tabs/LeadNotesTab.jsx";
import {
  getLead,
  addFollowUp,
  updateLeadStatus,
  getFollowUps,
  getActivityLog,
} from "../../utils/leads.js";
import { getNeedAnalysis, saveNeedAnalysis } from "../../utils/leads.js";
import { getPersonByPersonId, getOrCreatePersonByLeadId, addNote as addPersonNote, getActivityLogs as getPersonActivityLogs } from "../../utils/persons.js";

const actionTypes = [
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Meeting" },
  { value: "task", label: "Task" },
  { value: "other", label: "Other" },
];

const statusOptions = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "follow_up", label: "Follow Up" },
  { value: "in_progress", label: "In Progress" },
  { value: "converted", label: "Converted" },
  { value: "closed_lost", label: "Closed/Lost" },
];

export default function AgentLeadDetail() {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const session = auth.get();
  const agentName = session?.name || "Agent";
  const initials = agentName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [leadStatus, setLeadStatus] = useState("new");
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpForm, setFollowUpForm] = useState({
    type: "call",
    date: "",
    time: "",
    note: "",
  });
  const [followUpSubmitting, setFollowUpSubmitting] = useState(false);
  const [followUps, setFollowUps] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [personUuid, setPersonUuid] = useState(null);
  const [leadRefreshKey, setLeadRefreshKey] = useState(0);
  const [notesRefreshKey, setNotesRefreshKey] = useState(0);
  const [activityRefreshKey, setActivityRefreshKey] = useState(0);

  useEffect(() => {
    if (!leadId) {
      navigate("/agent/leads", { replace: true });
      return;
    }
    setLoading(true);
    Promise.all([
      getLead(leadId),
      getFollowUps(leadId).catch(() => []),
      getActivityLog(leadId).catch(() => ({ logs: [] })),
    ])
      .then(([leadData, followUpData, activityData]) => {
        setLead(leadData);
        setLeadStatus(leadData.status || "new");
        setFollowUps(Array.isArray(followUpData) ? followUpData : []);
        const leadLogs = activityData?.logs || [];
        getOrCreatePersonByLeadId(leadData)
          .then((person) => {
            setPersonUuid(person.id);
            return getPersonActivityLogs(person.id).catch(() => []);
          })
          .then((personLogs) => {
            const merged = [...leadLogs, ...(Array.isArray(personLogs) ? personLogs : [])].sort(
              (a, b) => new Date(b.performedAt || b.createdAt) - new Date(a.performedAt || a.createdAt)
            );
            setActivityLog(merged);
          })
          .catch(() => setActivityLog(leadLogs));
      })
      .catch(() => navigate("/agent/leads", { replace: true }))
      .finally(() => setLoading(false));
  }, [leadId, navigate, leadRefreshKey, activityRefreshKey]);

  useEffect(() => {
    const handler = (e) => {
      const { leadId: updatedLeadId, leadUuid: updatedLeadUuid } = e.detail || {}
      if (!updatedLeadId || updatedLeadId === leadId || updatedLeadUuid === leadId) setLeadRefreshKey(k => k + 1)
    }
    window.addEventListener('lead:realtime-update', handler)
    return () => window.removeEventListener('lead:realtime-update', handler)
  }, [leadId])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#eef3f8]">
        <div className="text-center">
          <RefreshCw
            size={24}
            className="animate-spin text-blue-600 mx-auto mb-2"
          />
          <p className="text-sm text-slate-500">Loading lead details...</p>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#eef3f8]">
        <div className="text-center">
          <p className="text-lg font-bold text-slate-700">Lead not found</p>
          <button
            onClick={() => navigate("/agent/leads")}
            className="mt-4 text-blue-700 underline text-sm"
          >
            Back to Leads
          </button>
        </div>
      </div>
    );
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
    need_analysis_sent: 'Need Analysis Sent',
    need_analysis_sent_to_client: 'Need Analysis Sent',
    need_analysis_deleted: 'Need Analysis Deleted',
    quote_run: 'Quote Run',
    quote_selected: 'Quote Selected',
    quote_emailed: 'Quote Sent',
    quote_status_changed: 'Quote Status Changed',
    quote_deleted: 'Quote Deleted',
    quote_emailed_to_client: 'Quote Sent to Client',
    quote_saved: 'Quote Saved',
    winquote_saved: 'WinQuote Saved',
    agents_assigned: 'Agent Assigned',
    converted: 'Lead Converted',
  };

  const tabs = [
    { key: "overview", label: "Overview", icon: Info },
    { key: "family", label: "Family", icon: Users },
    { key: "quotes", label: "Quotes", icon: Calculator },
    { key: "need-analysis", label: "Need Analysis", icon: Brain },
    { key: "follow-ups", label: "Follow-ups", icon: Calendar },
    { key: "activity-log", label: "Activity Log", icon: ClipboardList },
    { key: "notes", label: "Notes", icon: StickyNote },
  ];

  const toTitleCase = (s) =>
    s ? s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "";

  const formatDetails = (action, details) => {
    if (!details) return null;
    if (typeof details === "string") return details;

    switch (action) {
      case "need_analysis_updated":
      case "need_analysis_saved":
        if (details.summary) return details.summary;
        if (details.fields) {
          const sections = new Set();
          const sectionMap = {
            ownHouse: "Assets", houseValue: "Assets", mortgageRemaining: "Assets", rrsp: "Assets", tfsa: "Assets",
            outstandingMortgage: "Liabilities", lineOfCredit: "Liabilities", creditCardDebt: "Liabilities",
            annualIncomePrimary: "Income", annualIncomeSpouse: "Income", totalHouseholdIncome: "Income",
            lifeInsurance: "Insurance", criticalIllness: "Insurance", disability: "Insurance", groupInsurance: "Insurance",
            spouseName: "Family", spouseDOB: "Family", children: "Family",
            desiredCoverage: "Coverage", budgetMonthly: "Coverage", coverageNotes: "Coverage",
          };
          details.fields.forEach((f) => { if (sectionMap[f]) sections.add(sectionMap[f]); });
          return `Updated ${details.fields.length} fields across ${sections.size} sections`;
        }
        return "Need analysis updated";

      case "need_analysis_sent":
      case "need_analysis_sent_to_client":
        if (details.summary) return details.summary;
        if (details.clientEmail) {
          return `Need analysis report sent to ${details.clientEmail}${details.delivered === false ? ' (delivery failed)' : ''}`;
        }
        return "Need analysis report sent to client";

      case "need_analysis_deleted":
        return "Need analysis deleted";

      case "follow_up_created":
      case "follow_up_added":
        return `Scheduled ${details.type || "follow-up"} for ${details.scheduledAt ? new Date(details.scheduledAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "unknown date"}`;

      case "follow_up_completed":
        return `Follow-up completed${details.outcome ? ` — ${details.outcome}` : ""}`;

      case "lead_created":
        return null;

      case "lead_assigned":
        return details.agentName ? `Assigned to ${details.agentName}` : (details.agentId ? `Assigned to agent` : null);

      case "agent_unassigned":
        return details.agentName ? `Unassigned ${details.agentName}` : null;

      case "lead_reassigned":
        return details.targetAgentName ? `Reassigned to ${details.targetAgentName}` : null;

      case "status_changed":
        return `Status changed from ${details.fromStatus || details.from || "unknown"} to ${details.toStatus || details.to || "unknown"}`;

      case "note_added":
        return details.contentPreview ? `"${details.contentPreview}"` : details.content || "Note added";

      case "family_member_added":
        return `Added ${details.memberName || "family member"}${details.relationship ? ` (${details.relationship})` : ""}`;

      case "family_member_updated":
        return `Updated ${details.memberName || "family member"}${details.relationship ? ` (${details.relationship})` : ""}`;

      case "family_member_removed":
        return `Removed ${details.memberName || "family member"}${details.relationship ? ` (${details.relationship})` : ""}`;

      case "quote_run":
        if (details.summary) return details.summary;
        return `Quote search — ${details.count || details.carrierCount || 0} offers from PrimAI`;

      case "quote_selected":
        if (details.summary) return details.summary;
        return details.carrier ? `${details.carrier}${details.premium ? ` at ${details.currency || 'CHF'} ${details.premium}/mo` : ''}${details.familyMemberName ? ` for ${details.familyMemberName}` : ' for Self'}` : "Quote selected";

      case "quote_emailed":
      case "quote_emailed_to_client":
        if (details.summary) return details.summary;
        return details.carrier ? `Sent ${details.carrier} quote${details.familyMemberName ? ` to ${details.familyMemberName}` : ''}` : (details.clientEmail ? `Quote emailed to ${details.clientEmail}` : "Quote emailed to client");

      case "quote_status_changed":
        if (details.summary) return details.summary;
        return details.carrier ? `${details.carrier}: ${details.fromStatus || 'draft'} → ${details.toStatus}${details.familyMemberName ? ` for ${details.familyMemberName}` : ''}` : null;

      case "quote_deleted":
        if (details.summary) return details.summary;
        return details.carrier ? `Deleted ${details.carrier} quote${details.familyMemberName ? ` for ${details.familyMemberName}` : ''}` : "Quote deleted";

      case "agents_assigned":
        if (details.assignments && Array.isArray(details.assignments)) {
          return details.assignments.map(a => a.agentName || a.agentId).join(', ');
        }
        return null;

      default: {
        const skip = ['isNew', 'reportId', 'delivered', 'leadId', 'followUpId', 'agentId', 'targetAgentId', 'fromAgentId', 'agentName', 'targetAgentName', 'fromAgentName']
        const nonMeta = Object.fromEntries(Object.entries(details).filter(([k]) => !skip.includes(k)))
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
  };

  const leadName =
    `${lead.firstName || ""} ${lead.lastName || ""}`.trim() || "Unknown Lead";
  const leadInitials = leadName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const products = lead.productInterest
    ? Object.entries(lead.productInterest)
        .filter(([, v]) => v)
        .map(([k]) => k)
        .join(", ")
    : "-";

  const handleUpdateStatus = async () => {
    if (leadStatus === lead.status) {
      notify.info("Status is already set to this value.");
      return;
    }
    setStatusUpdating(true);
    try {
      await updateLeadStatus(leadId, leadStatus, "Updated by agent");
      const updatedLead = await getLead(leadId);
      setLead(updatedLead);
      setLeadStatus(updatedLead.status);
      setActivityRefreshKey((k) => k + 1);
    } catch (err) {
      notify.error(err.message || "Failed to update status");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleAddFollowUp = async (e) => {
    e.preventDefault();
    if (!followUpForm.date) {
      notify.warning("Please select a date");
      return;
    }
    setFollowUpSubmitting(true);
    try {
      const scheduledAt =
        followUpForm.date && followUpForm.time
          ? `${followUpForm.date}T${followUpForm.time}`
          : followUpForm.date;

      await addFollowUp(leadId, {
        type: followUpForm.type,
        scheduledAt,
        notes: followUpForm.note,
      });
      const updatedFollowUps = await getFollowUps(leadId).catch(() => []);
      setFollowUps(Array.isArray(updatedFollowUps) ? updatedFollowUps : []);
      setShowFollowUpModal(false);
      setFollowUpForm({ type: "call", date: "", time: "", note: "" });
    } catch (err) {
      notify.error(err.message || "Failed to add follow-up");
    } finally {
      setFollowUpSubmitting(false);
    }
  };

  const handleAddNote = async () => {
    const note = await confirmDialog({ title: "Add Note", message: "Enter a note:", input: { placeholder: "Type your note..." } });
    if (!note?.trim()) return;
    try {
      if (personUuid) {
        await addPersonNote(personUuid, note.trim());
      } else {
        notify.warning("Save the lead first to enable notes.");
        return;
      }
      setNotesRefreshKey((k) => k + 1);
      setActivityRefreshKey((k) => k + 1);
    } catch (err) {
      notify.error(err.message || "Failed to add note");
    }
  };

  const handleMarkConverted = async () => {
    if (lead.status === "converted") {
      notify.info("This lead is already marked as converted.");
      return;
    }
    const ok = await confirmDialog({ title: "Mark Converted", message: "Mark this lead as converted? This will create a new client profile.", confirmText: "Convert" });
    if (!ok) return;
    try {
      await updateLeadStatus(leadId, "converted", "Marked converted by agent");
      const updatedLead = await getLead(leadId);
      setLead(updatedLead);
      setLeadStatus(updatedLead.status);
      setActivityRefreshKey((k) => k + 1);

      const goToList = await confirmDialog({
        title: "Lead Converted",
        message: "Lead has been converted to a client successfully! Go to Client Management?",
        confirmText: "Go to Clients",
        cancelText: "Stay Here",
      });
      if (goToList) {
        navigate("/agent/clients");
      }
    } catch (err) {
      notify.error(err.message || "Failed to mark as converted");
    }
  };

  const handleRunQuote = () => {
    setShowQuoteModal(true);
  };

  const handleQuoteSaved = (log) => {
    setActivityLog((prev) => [log, ...prev]);
    setShowQuoteModal(false);
    setActivityRefreshKey((k) => k + 1);
  };

  const handleOpenNeedAnalysis = async () => {
    try {
      const analysis = await getNeedAnalysis(leadId).catch(() => null);
      if (analysis && analysis.id) {
        navigate(`/agent/leads/${leadId}/need-analysis`, { state: { lead } });
      } else {
        const ok = await confirmDialog({ title: "Need Analysis", message: "No Need Analysis found. Create one now?", confirmText: "Create" });
        if (ok) {
          await saveNeedAnalysis(leadId, {});
          navigate(`/agent/leads/${leadId}/need-analysis`, { state: { lead } });
        }
      }
    } catch (err) {
      notify.error(err.message || "Failed to open Need Analysis");
    }
  };

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "N/A";
  const formatDateTime = (d) => {
    if (!d) return "N/A";
    const date = new Date(d);
    return `${date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} ${date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
  };

  const getStatusStyle = (s) => {
    const map = {
      new: "bg-slate-100 text-slate-700 border-slate-200",
      assigned: "bg-blue-100 text-blue-700 border-blue-200",
      contacted: "bg-amber-100 text-amber-700 border-amber-200",
      follow_up: "bg-purple-100 text-purple-700 border-purple-200",
      in_progress: "bg-indigo-100 text-indigo-700 border-indigo-200",
      converted: "bg-green-100 text-green-700 border-green-200",
      closed_lost: "bg-red-100 text-red-700 border-red-200",
    };
    return map[s] || "bg-slate-100 text-slate-700 border-slate-200";
  };

  return (
    <div className="min-h-screen bg-[#f6fafe] text-slate-950">
      <div className="flex h-screen overflow-hidden">
        <AgentSidebar agentName={agentName} initials={initials} />

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <CommonHeader
            title="Lead Detail"
            leading={
              <button
                onClick={() => navigate("/agent/leads")}
                className="p-1 rounded hover:bg-slate-100 transition-colors"
                type="button"
              >
                <ArrowLeft size={18} className="text-slate-500" />
              </button>
            }
          />

          <div className="flex-1 overflow-y-auto p-6">
            <div className="mx-auto max-w-7xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <nav className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                    <button
                      onClick={() => navigate("/agent/leads")}
                      className="hover:text-blue-700"
                    >
                      My Leads
                    </button>
                    <ChevronRight size={12} />
                    <span className="text-slate-700 font-semibold">
                      {leadName}
                    </span>
                  </nav>
                  <h2 className="text-xl font-bold flex items-center gap-3">
                    {leadName}
                    <span
                      className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase border ${getStatusStyle(leadStatus)}`}
                    >
                      {toTitleCase(leadStatus)}
                    </span>
                  </h2>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 uppercase font-bold">
                    Lead ID
                  </p>
                  <p className="text-sm font-bold text-blue-700">
                    {lead.leadId || lead.id?.slice(0, 8)}
                  </p>
                </div>
              </div>

              <nav className="flex border-b border-slate-200 gap-8 overflow-x-auto">
                {tabs.map((tab, i) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                      className={`pb-4 px-1 flex items-center gap-2 whitespace-nowrap text-sm font-semibold transition-colors ${
                        isActive ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-blue-600'
                      }`}
                    >
                      <Icon size={18} />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>

              <div className="grid grid-cols-12 gap-6 items-start">
                <div className="col-span-12 lg:col-span-8 space-y-6">
                  {activeTab === "overview" && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                      <h3 className="text-sm font-bold text-slate-800">
                        Customer Information
                      </h3>
                      <div className="grid grid-cols-2 gap-6">
                        <Field label="Phone" value={lead.phone} />
                        <Field label="Email" value={lead.email} />
                        <Field
                          label="Date of Birth"
                          value={
                            lead.dateOfBirth
                              ? formatDate(lead.dateOfBirth)
                              : null
                          }
                        />
                        <Field
                          label="Marital Status"
                          value={lead.maritalStatus}
                        />
                        <Field
                          label="Residency Status"
                          value={lead.residencyStatus}
                        />
                        <Field label="Occupation" value={lead.occupation} />
                        <Field label="Employer" value={lead.employer} />
                        <Field label="Lead Source" value={lead.leadSource} />
                        <Field
                          label="Lead Priority"
                          value={toTitleCase(lead.leadPriority)}
                        />
                        <Field label="Products" value={products} />
                        <div className="col-span-2">
                          <Field label="Address" value={lead.address} />
                        </div>
                        {lead.healthIssues && (
                          <div className="col-span-2">
                            <Field
                              label="Health Issues"
                              value={lead.healthIssues}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                   {activeTab === "family" && (
                     <LeadFamilyTab personId={personUuid} lead={lead} onActivityChange={() => setActivityRefreshKey((k) => k + 1)} />
                   )}

                  {activeTab === "need-analysis" && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
                      <FileText
                        size={32}
                        className="text-blue-400 mx-auto mb-3"
                      />
                      <p className="text-slate-700 text-sm font-semibold mb-1">
                        Need Analysis
                      </p>
                      <p className="text-slate-400 text-[12px] mb-4">
                        Fill in the client's financial profile, assets,
                        liabilities, insurance needs, and family details.
                      </p>
                      <button
                        onClick={() =>
                          navigate(`/agent/leads/${leadId}/need-analysis`, {
                            state: { lead },
                          })
                        }
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Open Need Analysis
                      </button>
                    </div>
                  )}

                  {activeTab === "quotes" && (
                    <LeadQuotesTab personId={personUuid} lead={lead} />
                  )}

                  {activeTab === "activity-log" && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                      <h3 className="text-sm font-bold text-slate-800 mb-4">
                        Activity Log
                      </h3>
                      {activityLog.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-4">
                          No activity recorded yet.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {activityLog.map((log) => (
                            <div
                              key={log.id}
                              className="flex gap-3 p-3 bg-slate-50 rounded-lg"
                            >
                              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-slate-800">
                                  {actionLabels[log.action] || log.action.replace(/_/g, " ")}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {formatDateTime(log.performedAt)}
                                </p>
                                {log.details && formatDetails(log.action, log.details) && (
                                  <p className="text-xs text-slate-600 mt-1">
                                    {formatDetails(log.action, log.details)}
                                  </p>
                                )}
                                {log.performedByName && (
                                  <p className="text-[11px] text-slate-400 mt-1">by {log.performedByName}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "follow-ups" && (
                    <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-800">
                          Follow-Up History
                        </h3>
                        <span className="text-xs text-slate-400">
                          {followUps.length} entries
                        </span>
                      </div>
                      {followUps.length === 0 ? (
                        <div className="p-6 text-center">
                          <p className="text-sm text-slate-400">
                            No follow-ups recorded yet.
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm">
                            <thead>
                              <tr className="bg-slate-50 text-xs font-bold uppercase text-slate-400 tracking-wider">
                                <th className="px-6 py-3">Type</th>
                                <th className="px-6 py-3">Recorded</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Note</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {followUps.map((f) => (
                                <tr
                                  key={f.id}
                                  className="hover:bg-slate-50 transition-colors"
                                >
                                  <td className="px-6 py-4">
                                    <span className="px-2 py-0.5 text-xs font-bold rounded uppercase bg-blue-50 text-blue-700 capitalize">
                                      {f.type}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-sm">
                                      <Calendar
                                        size={14}
                                        className="text-slate-400"
                                      />
                                      {formatDateTime(
                                        f.createdAt || f.scheduledAt,
                                      )}
                                    </div>
                                    {f.scheduledAt &&
                                      formatDateTime(
                                        f.createdAt || f.scheduledAt,
                                      ) !== formatDateTime(f.scheduledAt) && (
                                        <p className="text-xs text-blue-500 mt-0.5">
                                          Scheduled:{" "}
                                          {formatDateTime(f.scheduledAt)}
                                        </p>
                                      )}
                                  </td>
                                  <td className="px-6 py-4">
                                    <span
                                      className={`px-2 py-0.5 text-xs font-bold rounded uppercase ${
                                        f.status === "completed"
                                          ? "bg-green-100 text-green-700"
                                          : f.status === "missed"
                                          ? "bg-red-100 text-red-700"
                                          : "bg-amber-100 text-amber-700"
                                      }`}
                                    >
                                      {f.status}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-sm text-slate-600 max-w-[200px] truncate">
                                    {f.notes || "—"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </section>
                  )}

                  {activeTab === "notes" && personUuid && (
                    <LeadNotesTab personId={personUuid} lead={lead} refreshKey={notesRefreshKey} />
                  )}

                  {activeTab === "notes" && !personUuid && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
                      <FileText
                        size={32}
                        className="text-blue-400 mx-auto mb-3"
                      />
                      <p className="text-slate-700 text-sm font-semibold mb-1">
                        Notes
                      </p>
                      <p className="text-slate-400 text-[12px] mb-4">
                        Person record not found. Save the lead first to enable notes.
                      </p>
                    </div>
                  )}
                </div>

                <aside className="col-span-12 lg:col-span-4 space-y-6 lg:sticky lg:top-6">
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h3 className="text-sm font-bold text-slate-800 mb-6">
                      Quick Actions
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setShowFollowUpModal(true)}
                        className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-blue-500 hover:text-blue-600 transition-all group"
                      >
                        <ClipboardCheck
                          size={28}
                          className="mb-2 text-slate-500 group-hover:text-blue-600 group-hover:scale-110 transition-transform"
                        />
                        <span className="text-xs font-semibold text-slate-600 group-hover:text-blue-600">
                          Add Follow-Up
                        </span>
                      </button>
                      <button
                        onClick={handleOpenNeedAnalysis}
                        className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-blue-500 hover:text-blue-600 transition-all group"
                      >
                        <FileText
                          size={28}
                          className="mb-2 text-slate-500 group-hover:text-blue-600 group-hover:scale-110 transition-transform"
                        />
                        <span className="text-xs font-semibold text-slate-600 group-hover:text-blue-600">
                          Need Analysis
                        </span>
                      </button>
                      <button
                        onClick={handleAddNote}
                        className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-blue-500 hover:text-blue-600 transition-all group"
                      >
                        <Plus
                          size={28}
                          className="mb-2 text-slate-500 group-hover:text-blue-600 group-hover:scale-110 transition-transform"
                        />
                        <span className="text-xs font-semibold text-slate-600 group-hover:text-blue-600">
                          Add Note
                        </span>
                      </button>
                      <button
                        onClick={handleRunQuote}
                        className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-blue-500 hover:text-blue-600 transition-all group"
                      >
                        <Calculator
                          size={28}
                          className="mb-2 text-slate-500 group-hover:text-blue-600 group-hover:scale-110 transition-transform"
                        />
                        <span className="text-xs font-semibold text-slate-600 group-hover:text-blue-600">
                          Run Quote
                        </span>
                      </button>
                      <button
                        onClick={handleMarkConverted}
                        disabled={lead?.status === "converted"}
                        className="col-span-2 flex flex-col items-center justify-center p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed group"
                      >
                        <Star
                          size={28}
                          className="mb-2 group-hover:scale-110 transition-transform"
                        />
                        <span className="text-xs font-semibold">
                          {lead?.status === "converted"
                            ? "Already Converted"
                            : "Mark Converted"}
                        </span>
                      </button>
                    </div>

                    <div className="mt-5 pt-5 border-t border-slate-200 space-y-3">
                      <p className="text-xs text-slate-400 uppercase font-bold">
                        Update Status
                      </p>
                      <select
                        value={leadStatus}
                        onChange={(e) => setLeadStatus(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 py-2.5 px-3 outline-none"
                      >
                        {statusOptions.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleUpdateStatus}
                        disabled={statusUpdating || leadStatus === lead?.status}
                        className="w-full py-2.5 bg-slate-900 text-white rounded-lg font-bold text-sm hover:bg-black transition-colors disabled:opacity-50"
                      >
                        {statusUpdating ? "Updating..." : "Update Status"}
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-400 to-blue-700 flex items-center justify-center text-white text-lg font-bold">
                        {leadInitials}
                      </div>
                      <div>
                        <h5 className="text-base font-bold">{leadName}</h5>
                        <p className="text-xs text-slate-400">
                          Lead ID: {lead.leadId}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {lead.email && (
                        <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50">
                          <Mail size={15} className="text-blue-700" />
                          <span className="text-sm truncate">{lead.email}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50">
                        <Phone size={15} className="text-blue-700" />
                        <span className="text-sm">{lead.phone}</span>
                      </div>
                    </div>
                  </div>

                </aside>
              </div>
            </div>
          </div>
        </main>
      </div>

      {showFollowUpModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: "rgba(15, 23, 42, 0.4)",
            backdropFilter: "blur(4px)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowFollowUpModal(false);
            }
          }}
        >
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-base font-semibold text-slate-900">
                Add Follow-Up
              </h3>
              <button
                type="button"
                onClick={() => setShowFollowUpModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors"
              >
                <X size={18} className="text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleAddFollowUp} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                  Activity Type
                </label>
                <select
                  value={followUpForm.type}
                  onChange={(e) =>
                    setFollowUpForm({ ...followUpForm, type: e.target.value })
                  }
                  className="w-full bg-white border border-slate-200 rounded-lg py-2.5 px-3 text-[13px] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  required
                >
                  {actionTypes.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                    Date
                  </label>
                  <input
                    type="date"
                    value={followUpForm.date}
                    onChange={(e) =>
                      setFollowUpForm({ ...followUpForm, date: e.target.value })
                    }
                    className="w-full bg-white border border-slate-200 rounded-lg py-2.5 px-3 text-[13px] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                    Time
                  </label>
                  <input
                    type="time"
                    value={followUpForm.time}
                    onChange={(e) =>
                      setFollowUpForm({ ...followUpForm, time: e.target.value })
                    }
                    className="w-full bg-white border border-slate-200 rounded-lg py-2.5 px-3 text-[13px] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                  Note
                </label>
                <textarea
                  value={followUpForm.note}
                  onChange={(e) =>
                    setFollowUpForm({ ...followUpForm, note: e.target.value })
                  }
                  className="w-full bg-white border border-slate-200 rounded-lg py-2.5 px-3 text-[13px] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  rows={3}
                  placeholder="Add a note about this follow-up..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFollowUpModal(false)}
                  className="px-5 py-2.5 text-slate-600 text-[13px] font-semibold rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={followUpSubmitting}
                  className="px-5 py-2.5 bg-blue-700 text-white text-[13px] font-semibold rounded-lg hover:bg-blue-800 transition-colors shadow-sm disabled:opacity-50"
                >
                  {followUpSubmitting ? "Adding..." : "Add Follow-Up"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showQuoteModal && (
        <QuoteModal
          lead={{ ...lead, id: leadId, name: leadName, email: lead?.email }}
          personId={personUuid}
          onClose={() => setShowQuoteModal(false)}
          onQuoteSaved={handleQuoteSaved}
        />
      )}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-500 font-bold uppercase mb-1">{label}</p>
      <p className="text-sm text-slate-800">{value || "N/A"}</p>
    </div>
  );
}
