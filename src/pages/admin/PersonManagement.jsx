import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getAllPersonsAsync } from "../../redux/personSlice.js";
import {
  Search,
  UserPlus,
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Users,
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

export default function PersonManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
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
  const initials = (name) =>
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
    const data = { page: currentPage, perPage: PAGE_SIZE };
    if (phaseFilter !== "All") data.phase = phaseFilter.toLowerCase();
    if (statusFilter !== "All") data.status = statusFilter.replace(/ /g, "_").toLowerCase();
    if (priorityFilter !== "All") data.leadPriority = priorityFilter.toLowerCase();
    if (searchTerm) data.search = searchTerm;

    await dispatch(getAllPersonsAsync(data));
  }, [currentPage, dispatch, phaseFilter, priorityFilter, searchTerm, statusFilter]);

  useEffect(() => {
    fetchPersons();
  }, [fetchPersons, refreshKey]);

  useEffect(() => {
    setCurrentPage(1);
  }, [phaseFilter, statusFilter, priorityFilter, searchTerm]);

  const personData = persons.map((p) => {
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
          .map((a) => initials(a.agentName || a.agentId))
          .join("/");
      })(),
      lastActivity: formatActivityDate(p.lastActivityDate),
    };
  });

  const filteredPersons = personData.filter((person) => {
    const matchesSearch =
      person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (person.personId && person.personId.toLowerCase().includes(searchTerm.toLowerCase())) ||
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

  return (
    <div>
      <section className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="relative w-full max-w-[300px]">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm transition-all"
            placeholder="Search by name, ID, email, phone..."
            type="text"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/persons/new")}
            className="px-5 py-2.5 bg-blue-600 text-white text-xs font-bold tracking-wider rounded-lg hover:bg-blue-700 shadow-md transition-all active:scale-95 flex items-center gap-2 uppercase"
          >
            <UserPlus size={16} />
            Add Person
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-500 transition-colors">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Total Persons
          </p>
          <h3 className="text-3xl font-bold text-blue-600">
            {totalPersons}
          </h3>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-500 transition-colors">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Leads
          </p>
          <h3 className="text-3xl font-bold text-blue-600">{leadCount}</h3>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-500 transition-colors">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Customers
          </p>
          <h3 className="text-3xl font-bold text-green-600">
            {customerCount}
          </h3>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-500 transition-colors">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Unassigned
          </p>
          <h3 className="text-3xl font-bold text-slate-800">
            {personData.filter((p) => p.agent === "Unassigned").length}
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
              <span className="ml-1.5 text-[10px] opacity-75">({tab.count})</span>
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
                  Assigned Agent(s)
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
                  <td colSpan="10" className="px-6 py-12 text-center text-sm text-slate-500">
                    Loading persons...
                  </td>
                </tr>
              ) : filteredPersons.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-6 py-12 text-center text-sm text-slate-500">
                    No persons found.
                  </td>
                </tr>
              ) : (
                filteredPersons.map((person) => (
                  <tr
                    key={person.id}
                    className="hover:bg-slate-50 transition-colors group cursor-pointer"
                    onClick={() => navigate(`/admin/persons/${person.id}`)}
                  >
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {person.personId}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold border border-blue-200">
                          {initials(person.name)}
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
                        {person.phase === "customer" ? "Customer" : "Lead"}
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
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 bg-slate-100 px-2 py-1 rounded-full w-fit">
                        <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-[8px] font-bold">
                          {person.agentInitials}
                        </div>
                        <span className="text-xs">{person.agent}</span>
                      </div>
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
            Showing {filteredPersons.length} of {loading ? "..." : totalPersons}{" "}
            persons
            {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                className="p-2 border border-slate-200 rounded hover:bg-slate-50 transition-colors disabled:opacity-50"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight size={18} className="text-slate-500" />
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
