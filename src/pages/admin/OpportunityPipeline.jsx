import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  TrendingUp,
  Plus,
  ChevronRight,
  ChevronLeft,
  DollarSign,
  CheckCircle,
  XCircle,
  Target,
  Clock,
  User,
  Tag,
  X,
} from "lucide-react";
import {
  getPersons,
  getOpportunities,
  createOpportunity,
  updateOpportunity,
} from "../../utils/persons.js";

const PIPELINE_STAGES = [
  { key: "identified", label: "Identified", color: "slate", icon: Target },
  { key: "offered", label: "Offered", color: "blue", icon: Tag },
  { key: "interested", label: "Interested", color: "yellow", icon: Clock },
  { key: "follow_up", label: "Follow-Up", color: "purple", icon: ChevronRight },
  { key: "won", label: "Won", color: "emerald", icon: CheckCircle },
  { key: "lost", label: "Lost", color: "red", icon: XCircle },
];

const stageColorMap = {
  identified: {
    bg: "bg-slate-100",
    border: "border-slate-300",
    header: "bg-slate-50",
    badge: "bg-slate-200 text-slate-700",
    dot: "bg-slate-400",
    cardBorder: "border-slate-200 hover:border-slate-400",
  },
  offered: {
    bg: "bg-blue-50",
    border: "border-blue-300",
    header: "bg-blue-50",
    badge: "bg-blue-100 text-blue-700",
    dot: "bg-blue-400",
    cardBorder: "border-blue-200 hover:border-blue-400",
  },
  interested: {
    bg: "bg-amber-50",
    border: "border-amber-300",
    header: "bg-amber-50",
    badge: "bg-amber-100 text-amber-700",
    dot: "bg-amber-400",
    cardBorder: "border-amber-200 hover:border-amber-400",
  },
  follow_up: {
    bg: "bg-purple-50",
    border: "border-purple-300",
    header: "bg-purple-50",
    badge: "bg-purple-100 text-purple-700",
    dot: "bg-purple-400",
    cardBorder: "border-purple-200 hover:border-purple-400",
  },
  won: {
    bg: "bg-emerald-50",
    border: "border-emerald-300",
    header: "bg-emerald-50",
    badge: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-400",
    cardBorder: "border-emerald-200 hover:border-emerald-400",
  },
  lost: {
    bg: "bg-red-50",
    border: "border-red-300",
    header: "bg-red-50",
    badge: "bg-red-100 text-red-600",
    dot: "bg-red-400",
    cardBorder: "border-red-200 hover:border-red-400",
  },
};

const productTypes = [
  "Life Insurance",
  "Health Insurance",
  "Pension",
  "Investment",
  "Annuity",
  "Disability Insurance",
  "Long-term Care",
];

const INITIAL_FORM = {
  personId: "",
  familyMemberId: "",
  type: "",
  title: "",
  premium: "",
  carrier: "",
  notes: "",
};

export default function OpportunityPipeline() {
  const [allOpportunities, setAllOpportunities] = useState([]);
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productFilter, setProductFilter] = useState("All");
  const [agentFilter, setAgentFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [movingId, setMovingId] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const personsRes = await getPersons({ phase: "customer", limit: 500 });
      const personsList = personsRes.data || personsRes.persons || personsRes || [];
      setPersons(Array.isArray(personsList) ? personsList : []);

      const opps = [];
      for (const person of personsList) {
        try {
          const oppRes = await getOpportunities(person.id);
          const personOpps = (oppRes.data || oppRes.opportunities || oppRes || []).map(
            (o) => ({
              ...o,
              personId: person.id,
              personName: `${person.firstName || ""} ${person.lastName || ""}`.trim(),
              familyMemberName: o.familyMemberId
                ? (person.familyMembers || []).find((f) => f.id === o.familyMemberId)?.name || ""
                : "",
              agentName:
                (person.assignments || []).find((a) => a.isActive)?.agentName || "",
              agentId:
                (person.assignments || []).find((a) => a.isActive)?.agentId || "",
            })
          );
          opps.push(...personOpps);
        } catch {
          // skip person if opps fetch fails
        }
      }
      setAllOpportunities(opps);
    } catch (err) {
      console.error("Failed to fetch pipeline data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredOpps = allOpportunities.filter((opp) => {
    if (productFilter !== "All" && opp.type !== productFilter) return false;
    if (agentFilter !== "All" && opp.agentName !== agentFilter) return false;
    if (dateFrom) {
      const created = opp.createdAt ? new Date(opp.createdAt) : null;
      if (!created || created < new Date(dateFrom)) return false;
    }
    if (dateTo) {
      const created = opp.createdAt ? new Date(opp.createdAt) : null;
      if (!created || created > new Date(dateTo + "T23:59:59")) return false;
    }
    return true;
  });

  const stageOpps = (stageKey) =>
    filteredOpps.filter((o) => (o.status || "identified") === stageKey);

  const stats = {
    total: filteredOpps.length,
    won: filteredOpps.filter((o) => o.status === "won").length,
    lost: filteredOpps.filter((o) => o.status === "lost").length,
    active: filteredOpps.filter(
      (o) => o.status !== "won" && o.status !== "lost"
    ).length,
  };
  const conversionRate =
    stats.total > 0
      ? ((stats.won / (stats.won + stats.lost || 1)) * 100).toFixed(1)
      : "0.0";

  const uniqueAgents = [
    ...new Set(allOpportunities.map((o) => o.agentName).filter(Boolean)),
  ];

  const clearFilters = () => {
    setProductFilter("All");
    setAgentFilter("All");
    setDateFrom("");
    setDateTo("");
  };

  const moveToStage = async (opp, newStage) => {
    setMovingId(opp.id);
    try {
      await updateOpportunity(opp.personId, opp.id, { status: newStage });
      setAllOpportunities((prev) =>
        prev.map((o) =>
          o.id === opp.id ? { ...o, status: newStage } : o
        )
      );
    } catch (err) {
      console.error("Failed to update opportunity:", err);
    } finally {
      setMovingId(null);
    }
  };

  const getNextStage = (current) => {
    const order = ["identified", "offered", "interested", "follow_up", "won", "lost"];
    const idx = order.indexOf(current);
    return idx >= 0 && idx < order.length - 2 ? order[idx + 1] : null;
  };

  const getPrevStage = (current) => {
    const order = ["identified", "offered", "interested", "follow_up", "won", "lost"];
    const idx = order.indexOf(current);
    return idx > 0 && idx < order.length - 1 ? order[idx - 1] : null;
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.personId || !formData.type) return;
    setSubmitting(true);
    try {
      const payload = {
        type: formData.type,
        title: formData.title || formData.type,
        premium: formData.premium ? Number(formData.premium) : undefined,
        carrier: formData.carrier || undefined,
        notes: formData.notes || undefined,
        familyMemberId: formData.familyMemberId || undefined,
        status: "identified",
      };
      await createOpportunity(formData.personId, payload);
      setShowAddModal(false);
      setFormData(INITIAL_FORM);
      fetchData();
    } catch (err) {
      console.error("Failed to create opportunity:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPerson = persons.find((p) => p.id === formData.personId);

  const formatDate = (d) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Opportunity Pipeline
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Track and manage upsell opportunities across all customers
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 bg-blue-600 text-white text-xs font-bold tracking-wider rounded-lg hover:bg-blue-700 shadow-md transition-all active:scale-95 flex items-center gap-2 uppercase"
          >
            <Plus size={16} />
            Add Opportunity
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Total Opportunities
            </p>
            <h3 className="text-3xl font-bold text-blue-600">{stats.total}</h3>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Won
            </p>
            <h3 className="text-3xl font-bold text-emerald-600">{stats.won}</h3>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Lost
            </p>
            <h3 className="text-3xl font-bold text-red-500">{stats.lost}</h3>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Conversion Rate
            </p>
            <div className="flex items-end gap-2">
              <h3 className="text-3xl font-bold text-purple-600">
                {conversionRate}%
              </h3>
              <span className="text-xs text-slate-400 mb-1">
                {stats.won}/{stats.won + stats.lost || 0}
              </span>
            </div>
          </div>
        </div>

        <section className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-500" />
            <span className="text-xs font-bold text-slate-700 tracking-wider">
              Filters:
            </span>
          </div>
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-blue-500 min-w-[140px] outline-none"
          >
            <option value="All">Product: All</option>
            {productTypes.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-blue-500 min-w-[140px] outline-none"
          >
            <option value="All">Agent: All</option>
            {uniqueAgents.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">From:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">To:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          <button
            onClick={clearFilters}
            className="ml-auto text-blue-600 text-xs font-bold tracking-wider hover:underline uppercase"
          >
            Clear All
          </button>
        </section>

        {loading ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500 mt-3">Loading pipeline...</p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {PIPELINE_STAGES.map((stage) => {
              const stageItems = stageOpps(stage.key);
              const colors = stageColorMap[stage.key];
              const Icon = stage.icon;
              return (
                <div
                  key={stage.key}
                  className={`flex-shrink-0 w-[300px] flex flex-col rounded-xl border ${colors.border} ${colors.bg} overflow-hidden`}
                >
                  <div
                    className={`${colors.header} px-4 py-3 flex items-center justify-between border-b ${colors.border}`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={16} className={`${colors.dot} text-slate-600`} />
                      <span className="text-sm font-bold text-slate-700">
                        {stage.label}
                      </span>
                    </div>
                    <span
                      className={`${colors.badge} px-2 py-0.5 rounded-full text-[11px] font-bold`}
                    >
                      {stageItems.length}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-[calc(100vh-380px)]">
                    {stageItems.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-xs text-slate-400">
                          No opportunities
                        </p>
                      </div>
                    ) : (
                      stageItems.map((opp) => (
                        <div
                          key={opp.id}
                          className={`bg-white rounded-lg border ${colors.cardBorder} p-3 transition-all shadow-sm`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[9px] font-bold flex-shrink-0">
                                {opp.personName
                                  ? opp.personName
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .slice(0, 2)
                                  : "?"}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-800 truncate">
                                  {opp.personName || "Unknown"}
                                </p>
                                {opp.familyMemberName && (
                                  <p className="text-[11px] text-slate-400 truncate">
                                    {opp.familyMemberName}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="space-y-1.5 mb-3">
                            <div className="flex items-center gap-1.5">
                              <Tag size={12} className="text-slate-400 flex-shrink-0" />
                              <span className="text-xs text-slate-600 truncate">
                                {opp.type || "General"}
                              </span>
                            </div>
                            {opp.premium != null && (
                              <div className="flex items-center gap-1.5">
                                <DollarSign
                                  size={12}
                                  className="text-slate-400 flex-shrink-0"
                                />
                                <span className="text-xs font-semibold text-slate-700">
                                  CHF {Number(opp.premium).toLocaleString()}/mo
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5">
                              <User size={12} className="text-slate-400 flex-shrink-0" />
                              <span className="text-xs text-slate-400 truncate">
                                {opp.agentName || "Unassigned"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock size={12} className="text-slate-400 flex-shrink-0" />
                              <span className="text-xs text-slate-400">
                                {formatDate(opp.createdAt)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
                            {getPrevStage(opp.status || "identified") && (
                              <button
                                disabled={movingId === opp.id}
                                onClick={() =>
                                  moveToStage(
                                    opp,
                                    getPrevStage(opp.status || "identified")
                                  )
                                }
                                className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-slate-500 bg-slate-100 rounded hover:bg-slate-200 transition-colors disabled:opacity-50 uppercase tracking-wide"
                              >
                                <ChevronLeft size={12} />
                                Prev
                              </button>
                            )}
                            {getNextStage(opp.status || "identified") && (
                              <button
                                disabled={movingId === opp.id}
                                onClick={() =>
                                  moveToStage(
                                    opp,
                                    getNextStage(opp.status || "identified")
                                  )
                                }
                                className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors disabled:opacity-50 uppercase tracking-wide ml-auto"
                              >
                                Next
                                <ChevronRight size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800">
                  Add Opportunity
                </h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData(INITIAL_FORM);
                  }}
                  className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Customer *
                  </label>
                  <select
                    required
                    value={formData.personId}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, personId: e.target.value }))
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select a customer...</option>
                    {persons.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.firstName} {p.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedPerson &&
                  (selectedPerson.familyMembers || []).length > 0 && (
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                        Family Member (Optional)
                      </label>
                      <select
                        value={formData.familyMemberId}
                        onChange={(e) =>
                          setFormData((f) => ({
                            ...f,
                            familyMemberId: e.target.value,
                          }))
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                      >
                        <option value="">Primary policyholder</option>
                        {selectedPerson.familyMembers.map((fm) => (
                          <option key={fm.id} value={fm.id}>
                            {fm.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Product Type *
                  </label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, type: e.target.value }))
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select product type...</option>
                    {productTypes.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, title: e.target.value }))
                    }
                    placeholder="e.g. Additional life cover"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none placeholder:text-slate-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                      Expected Premium (CHF/mo)
                    </label>
                    <input
                      type="number"
                      value={formData.premium}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, premium: e.target.value }))
                      }
                      placeholder="0"
                      min="0"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                      Carrier
                    </label>
                    <input
                      type="text"
                      value={formData.carrier}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, carrier: e.target.value }))
                      }
                      placeholder="e.g. Swiss Life"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, notes: e.target.value }))
                    }
                    rows={3}
                    placeholder="Additional notes..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none resize-none placeholder:text-slate-400"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setFormData(INITIAL_FORM);
                    }}
                    className="px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !formData.personId || !formData.type}
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Creating..." : "Create Opportunity"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
