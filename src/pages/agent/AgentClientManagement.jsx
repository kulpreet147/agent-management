import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getMyClients, getClientStats } from "../../utils/clients.js";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Users,
  RefreshCw,
  Clock,
  Home,
} from "lucide-react";

const statusStyles = {
  active: "bg-emerald-50 text-emerald-700",
  inactive: "bg-gray-100 text-gray-600",
  pending: "bg-amber-50 text-amber-600",
};

const tagStyles = {
  VIP: "bg-amber-100 text-amber-700",
  Family: "bg-brand-50 text-brand-700",
  Corporate: "bg-brand-50 text-brand-700",
  "Renewal Due": "bg-red-50 text-red-600",
  Prospect: "bg-gray-100 text-gray-600",
};

const PAGE_SIZE = 10;

export default function AgentClientManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [segmentFilter, setSegmentFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalClients, setTotalClients] = useState(0);
  const [stats, setStats] = useState({ totalActive: 0, upcomingRenewals: 0, pendingFollowUps: 0 });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setRefreshKey((k) => k + 1);
  }, [location.key]);

  const initials = (first, last) =>
    `${(first || "")[0] || ""}${(last || "")[0] || ""}`.toUpperCase();

  const formatHousehold = (client) => {
    if (client.householdMembers && client.householdMembers.length > 0) {
      return `${client.firstName} Family · ${client.householdMembers.length + 1} members`;
    }
    return "Individual";
  };

  const getActivePoliciesCount = (policies) => {
    if (!policies) return 0;
    return policies.filter((p) => p.status === "active").length;
  };

  const getNextRenewal = (policies) => {
    if (!policies || policies.length === 0) return null;
    const now = new Date();
    const upcoming = policies
      .filter((p) => p.status === "active" && p.renewalDate && new Date(p.renewalDate) >= now)
      .sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate));
    return upcoming.length > 0 ? upcoming[0].renewalDate : null;
  };

  const isRenewalOverdue = (date) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  const formatDate = (d) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: currentPage, limit: PAGE_SIZE };
      if (statusFilter !== "All") params.status = statusFilter.toLowerCase();
      if (segmentFilter !== "All") params.tags = segmentFilter;
      if (searchTerm) params.search = searchTerm;

      const [clientsData, statsData] = await Promise.all([
        getMyClients(params).catch(() => ({ clients: [], total: 0 })),
        getClientStats().catch(() => ({ totalActive: 0, upcomingRenewals: 0, pendingFollowUps: 0 })),
      ]);

      setClients(clientsData.clients || []);
      setTotalClients(clientsData.total || 0);
      setStats(statsData);
    } catch {
      setClients([]);
      setTotalClients(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, segmentFilter, searchTerm, refreshKey]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const totalPages = Math.ceil(totalClients / PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-slate-900 mb-1">Client Management</h2>
        <p className="text-sm text-slate-500">Your assigned clients</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          icon={<Users size={20} />}
          iconBg="bg-brand-50 text-brand-600"
          label="Active Clients"
          value={stats.totalActive}
        />
        <StatCard
          icon={<RefreshCw size={20} />}
          iconBg="bg-slate-100 text-slate-500"
          label="Upcoming Renewals"
          value={stats.upcomingRenewals}
          sub="Next 90 days"
        />
        <StatCard
          icon={<Clock size={20} />}
          iconBg="bg-amber-50 text-amber-500"
          label="Pending Tasks"
          value={stats.pendingFollowUps}
          valueColor="text-amber-600"
        />
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Search clients..."
              className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-400 w-64"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="text-sm text-slate-600 bg-transparent border-none focus:ring-0 cursor-pointer hover:text-brand-600"
          >
            <option value="All">Status: All</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
          <select
            value={segmentFilter}
            onChange={(e) => { setSegmentFilter(e.target.value); setCurrentPage(1); }}
            className="text-sm text-slate-600 bg-transparent border-none focus:ring-0 cursor-pointer hover:text-brand-600"
          >
            <option value="All">Segment: All</option>
            <option>VIP</option>
            <option>Family</option>
            <option>Corporate</option>
            <option>Prospect</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Client</th>
              <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Household</th>
              <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Policies</th>
              <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Next Renewal</th>
              <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tags</th>
              <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
              <th className="px-5 py-3 w-12" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-500">
                  Loading clients...
                </td>
              </tr>
            ) : clients.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-500">
                  No clients found
                </td>
              </tr>
            ) : (
              clients.map((client) => {
                const activeCount = getActivePoliciesCount(client.policies);
                const renewal = getNextRenewal(client.policies);
                const overdue = isRenewalOverdue(renewal);
                return (
                  <tr
                    key={client.id}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/agent/clients/${client.id}`)}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-xs font-bold">
                          {initials(client.firstName, client.lastName)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {client.firstName} {client.lastName}
                          </p>
                          <p className="text-xs text-slate-500">{client.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-slate-600">{formatHousehold(client)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2 py-1 bg-brand-50 text-brand-700 rounded-md text-[11px] font-bold">
                        {activeCount} ACTIVE
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {renewal ? (
                        <p className={`text-sm font-semibold ${overdue ? "text-red-600" : "text-slate-700"}`}>
                          {formatDate(renewal)}
                        </p>
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(client.tags || []).slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${tagStyles[tag] || "bg-slate-100 text-slate-600"}`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${statusStyles[client.status] || "bg-gray-100 text-gray-600"}`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button onClick={(e) => e.stopPropagation()} className="p-1 hover:bg-slate-100 rounded transition-colors text-slate-400">
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="px-5 py-4 flex justify-between items-center bg-slate-50 border-t border-slate-200">
          <p className="text-sm text-slate-500">
            Showing <span className="font-bold text-slate-900">{clients.length}</span> of{" "}
            <span className="font-bold text-slate-900">{totalClients}</span> clients
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                      currentPage === page
                        ? "bg-brand-600 text-white"
                        : "hover:bg-slate-100 text-slate-600"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, iconBg, label, value, sub, valueColor }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm group hover:border-brand-300 transition-all">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
        <div className={`p-2 rounded-lg ${iconBg}`}>{icon}</div>
      </div>
      <div className="flex items-end gap-2">
        <h3 className={`text-3xl font-bold leading-none ${valueColor || "text-slate-900"}`}>{value}</h3>
        {sub && <span className="text-xs text-slate-500 pb-0.5">{sub}</span>}
      </div>
    </div>
  );
}
