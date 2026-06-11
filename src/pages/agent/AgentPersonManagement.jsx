import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getMyPersonsAsync } from "../../redux/personSlice.js";
import { auth } from "../../utils/auth.js";
import AgentSidebar from "../../components/AgentSidebar.jsx";
import CommonHeader from "../../components/CommonHeader.jsx";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Users,
  RefreshCw,
} from "lucide-react";

const priorityStyles = {
  Hot: "bg-red-100 text-red-700 border-red-200",
  Warm: "bg-orange-100 text-orange-700 border-orange-200",
  Cold: "bg-blue-100 text-blue-700 border-blue-200",
};
const statusStyles = {
  New: "bg-gray-100 text-gray-700",
  Assigned: "bg-blue-50 text-blue-700",
  Contacted: "bg-amber-50 text-amber-700",
  FollowUp: "bg-purple-50 text-purple-700",
  InProgress: "bg-amber-50 text-amber-700",
  Converted: "bg-green-100 text-green-700",
  ClosedLost: "bg-red-50 text-red-700",
};
const phaseStyles = {
  lead: "bg-blue-100 text-blue-700 border-blue-200",
  customer: "bg-green-100 text-green-700 border-green-200",
};

const PAGE_SIZE = 10;

export default function AgentPersonManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const session = auth.get();
  const agentName = session?.name || "Agent";
  const initials = agentName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const {
    persons,
    getAllPersonsLoading,
    personsTotal,
  } = useSelector((state) => state.person);
  const totalPersons = personsTotal;
  const loading = getAllPersonsLoading;
  const [phaseFilter, setPhaseFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setRefreshKey((k) => k + 1);
  }, [location.key]);

  const toTitleCase = (s) =>
    s ? s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "";
  const formatInitials = (name) =>
    name
      ? name
          .split(" ")
          .map((n) => n[0])
          .join("")
      : "";
  const formatActivityDate = (d) => {
    if (!d) return "N/A";
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const fetchPersons = useCallback(async () => {
    const phase = phaseFilter !== "All" ? phaseFilter.toLowerCase() : undefined;
    await dispatch(getMyPersonsAsync(phase));
  }, [dispatch, phaseFilter]);

  useEffect(() => {
    fetchPersons();
  }, [fetchPersons, refreshKey]);

  useEffect(() => {
    setCurrentPage(1);
  }, [phaseFilter, statusFilter, priorityFilter, searchTerm]);

  const personData = (persons || []).map((p) => {
    const active = (p.assignments || []).filter((a) => a.isActive);
    return {
      id: p.id,
      personId: p.personId,
      name: `${p.firstName} ${p.lastName}`,
      phone: p.phone,
      email: p.email || "",
      phase: p.phase || "lead",
      status: p.status ? toTitleCase(p.status) : "New",
      statusStyle:
        statusStyles[p.status ? toTitleCase(p.status) : "New"] ||
        statusStyles.New,
      priority: p.leadPriority ? toTitleCase(p.leadPriority) : "Cold",
      priorityStyle:
        priorityStyles[
          p.leadPriority ? toTitleCase(p.leadPriority) : "Cold"
        ] || priorityStyles.Cold,
      agent: (() => {
        if (active.length === 0) return "Unassigned";
        return active.map((a) => a.agentName || a.agentId).join(" / ");
      })(),
      agentInitials: (() => {
        if (active.length === 0) return "--";
        return active
          .map((a) => formatInitials(a.agentName || a.agentId))
          .join("/");
      })(),
      lastActivity: formatActivityDate(p.lastActivityDate),
    };
  });

  const filteredPersons = personData.filter((person) => {
    const matchesSearch =
      person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (person.personId &&
        person.personId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      person.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.phone.includes(searchTerm);
    const matchesStatus =
      statusFilter === "All" || person.status === statusFilter;
    const matchesPriority =
      priorityFilter === "All" || person.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const clearFilters = () => {
    setPhaseFilter("All");
    setStatusFilter("All");
    setPriorityFilter("All");
    setSearchTerm("");
  };

  const totalPages = Math.max(1, Math.ceil(totalPersons / PAGE_SIZE));

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const totalCount = personData.length;
  const leadCount = personData.filter((p) => p.phase === "lead").length;
  const customerCount = personData.filter((p) => p.phase === "customer").length;

  const phaseTabs = [
    { key: "All", label: "All", count: totalCount },
    { key: "lead", label: "Leads", count: leadCount },
    { key: "customer", label: "Customers", count: customerCount },
  ];

  const paginatedPersons = filteredPersons.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <div className="min-h-screen bg-[#eef3f8] text-slate-950 max-w-[2200px] mx-auto">
      <div className="flex h-screen overflow-hidden">
        <AgentSidebar agentName={agentName} initials={initials} />
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <CommonHeader
            title="My Persons"
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search by name, ID, email, phone..."
          />

          <div className="flex-1 overflow-y-auto p-4 lg:p-5">
            <div className="space-y-6">
              <div>
                <div className="text-sm font-semibold text-slate-500">
                  Persons &gt; My Assigned Persons
                </div>
                <h1 className="mt-1 text-2xl font-bold tracking-tight">
                  My Persons Dashboard
                </h1>
                <p className="mt-0.5 text-sm text-slate-500">
                  Manage your assigned persons across all phases.
                </p>
              </div>

              <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-500 transition-colors">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Total Persons
                  </p>
                  <h3 className="text-3xl font-bold text-blue-600">
                    {loading ? "..." : totalCount}
                  </h3>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-500 transition-colors">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Leads
                  </p>
                  <h3 className="text-3xl font-bold text-blue-600">
                    {loading ? "..." : leadCount}
                  </h3>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-green-500 transition-colors">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Customers
                  </p>
                  <h3 className="text-3xl font-bold text-green-600">
                    {loading ? "..." : customerCount}
                  </h3>
                </div>
              </section>

              <section className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex flex-wrap items-center gap-4">
                <div className="flex bg-slate-100 rounded-lg p-1">
                  {phaseTabs.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setPhaseFilter(tab.key)}
                      className={`px-4 py-2 rounded-md text-xs font-bold tracking-wider transition-all ${
                        phaseFilter === tab.key
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {tab.label}
                      <span className="ml-1.5 text-[10px] opacity-75">
                        ({tab.count})
                      </span>
                    </button>
                  ))}
                </div>
                <div className="h-6 w-px bg-slate-200" />
                <div className="flex items-center gap-2">
                  <Filter size={18} className="text-slate-500" />
                  <span className="text-xs font-bold text-slate-700 tracking-wider">
                    Filters:
                  </span>
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-blue-500 min-w-[120px] outline-none"
                >
                  <option value="All">Status: All</option>
                  <option value="New">New</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Follow Up">Follow Up</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Converted">Converted</option>
                  <option value="Closed Lost">Closed Lost</option>
                </select>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-blue-500 min-w-[120px] outline-none"
                >
                  <option value="All">Priority: All</option>
                  <option value="Hot">Hot</option>
                  <option value="Warm">Warm</option>
                  <option value="Cold">Cold</option>
                </select>
                <button
                  onClick={clearFilters}
                  className="ml-auto text-blue-600 text-xs font-bold tracking-wider hover:underline uppercase"
                >
                  Clear All
                </button>
              </section>

              <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Person ID
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Phone
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Phase
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Priority
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Last Activity
                        </th>
                        <th className="px-6 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {loading ? (
                        <tr>
                          <td
                            colSpan="9"
                            className="px-6 py-12 text-center text-sm text-slate-500"
                          >
                            <RefreshCw
                              size={20}
                              className="animate-spin text-blue-600 mx-auto mb-2"
                            />
                            Loading persons...
                          </td>
                        </tr>
                      ) : paginatedPersons.length === 0 ? (
                        <tr>
                          <td
                            colSpan="9"
                            className="px-6 py-12 text-center text-sm text-slate-500"
                          >
                            No persons assigned to you.
                          </td>
                        </tr>
                      ) : (
                        paginatedPersons.map((person) => (
                          <tr
                            key={person.id}
                            className="hover:bg-slate-50 transition-colors group cursor-pointer"
                            onClick={() =>
                              navigate(`/agent/persons/${person.id}`)
                            }
                          >
                            <td className="px-6 py-4 text-sm text-slate-500">
                              {person.personId}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold border border-blue-200">
                                  {formatInitials(person.name)}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-slate-800">
                                    {person.name}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {person.phone}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">
                              {person.email || "-"}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">
                              {person.phone}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest border ${
                                  phaseStyles[person.phase] || phaseStyles.lead
                                }`}
                              >
                                {person.phase === "customer"
                                  ? "Customer"
                                  : "Lead"}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`${person.statusStyle} px-2.5 py-1 rounded-md text-xs font-medium`}
                              >
                                {person.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest border ${person.priorityStyle}`}
                              >
                                {person.priority}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-500">
                              {person.lastActivity}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button className="p-1 hover:bg-slate-100 rounded transition-colors opacity-0 group-hover:opacity-100">
                                <MoreVertical
                                  size={18}
                                  className="text-slate-400 group-hover:text-blue-600"
                                />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-white">
                  <p className="text-sm text-slate-500">
                    Showing {filteredPersons.length} of{" "}
                    {loading ? "..." : totalPersons} persons
                    {totalPages > 1 &&
                      ` (Page ${currentPage} of ${totalPages})`}
                  </p>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        className="p-2 border border-slate-200 rounded hover:bg-slate-50 transition-colors disabled:opacity-50"
                        disabled={currentPage === 1}
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                      >
                        <ChevronLeft size={18} className="text-slate-500" />
                      </button>
                      {getPageNumbers().map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 rounded text-xs font-bold ${
                            page === currentPage
                              ? "bg-blue-600 text-white"
                              : "hover:bg-slate-50 text-slate-600"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        className="p-2 border border-slate-200 rounded hover:bg-slate-50 transition-colors disabled:opacity-50"
                        disabled={currentPage === totalPages}
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                      >
                        <ChevronRight size={18} className="text-slate-500" />
                      </button>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
