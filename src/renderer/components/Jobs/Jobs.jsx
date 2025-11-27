// src/pages/Jobs.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  Download,
  MapPin,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Calendar,
  Package,
  Zap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

/* ---------------- safe number + format helpers (added) ---------------- */
const num = (v) => {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (v == null) return 0;
  const parsed = parseFloat(String(v).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};
const fmtKm = (v, d = 0) => `${num(v).toFixed(d)} km`;
const fmtPct = (v, d = 1) => `${num(v).toFixed(d)}%`;
const fmtMoney = (v) => `$${num(v).toLocaleString()}`;
const fmtDate = (v) => (v ? new Date(v).toLocaleDateString() : "");
/* --------------------------------------------------------------------- */

export default function Jobs() {
  const { isStaff } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalJobs, setTotalJobs] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    search: "",
    game: "",
    status: "",
    mod_source: "",
    flagged: "",
    date_from: "",
    date_to: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const jobsPerPage = 50;

  useEffect(() => {
    fetchJobs();
  }, [currentPage, filters]);

  const fetchJobs = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: currentPage,
        limit: jobsPerPage,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== "")
        ),
      });

      const endpoint = isStaff() ? "/jobs" : "/jobs/my-jobs";
      const response = await api.get(`${endpoint}?${params}`);

      setJobs(response.data.jobs || response.data);
      setTotalJobs(response.data.total || response.data.length);
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      game: "",
      status: "",
      mod_source: "",
      flagged: "",
      date_from: "",
      date_to: "",
    });
    setCurrentPage(1);
  };

  const exportToCSV = () => {
    const headers = [
      "Driver",
      "Job ID",
      "Game",
      "Status",
      "Cargo",
      "From",
      "To",
      "Distance (km)",
      "Race Miles (km)",
      "Race %",
      "Income",
      "Damage %",
      "Flagged",
      "Mod",
      "Started",
      "Completed",
    ];

    const rows = jobs.map((job) => [
      job.username || "Unknown",
      job.job_id,
      job.game,
      job.status,
      job.cargo_display || "Unknown",
      job.pickup_city_display || "Unknown",
      job.delivery_city_display || "Unknown",
      num(job.actual_distance) || num(job.planned_distance),
      num(job.race_miles),
      num(job.race_percentage),
      num(job.total_income),
      num(job.damage_percent),
      job.flagged ? "Yes" : "No",
      job.mod_source || "None",
      new Date(job.started_at).toLocaleString(),
      job.completed_at ? new Date(job.completed_at).toLocaleString() : "N/A",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jobs_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const getRaceMilesColor = (percentage) => {
    const p = num(percentage);
    if (p >= 25) return "text-red-400";
    if (p >= 10) return "text-orange-400";
    if (p > 0) return "text-yellow-400";
    return "text-green-400";
  };

  const getModBadge = (modSource) => {
    if (!modSource) return null;
    const colors = {
      promods: "bg-blue-900 text-blue-200",
      tmp: "bg-purple-900 text-purple-200",
      wot: "bg-yellow-900 text-yellow-200",
      rusmap: "bg-green-900 text-green-200",
    };
    return (
      <span
        className={`px-2 py-0.5 text-xs rounded ${
          colors[modSource.toLowerCase()] || "bg-gray-700 text-gray-300"
        }`}
      >
        {modSource}
      </span>
    );
  };

  const totalPages = Math.ceil(totalJobs / jobsPerPage);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            {isStaff() ? "Company Jobs" : "My Jobs"}
          </h1>
          <p className="text-gray-400 mt-1">
            {totalJobs.toLocaleString()} total jobs
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2 border border-gray-700"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-gray-800 rounded-lg p-6 border border-gray-700"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Driver, cargo, city..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Game */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Game</label>
              <select
                value={filters.game}
                onChange={(e) => handleFilterChange("game", e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value="">All Games</option>
                <option value="ETS2">Euro Truck Simulator 2</option>
                <option value="ATS">American Truck Simulator</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Mod Source */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Mods</label>
              <select
                value={filters.mod_source}
                onChange={(e) => handleFilterChange("mod_source", e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value="">All Mods</option>
                <option value="none">Vanilla Only</option>
                <option value="promods">ProMods</option>
                <option value="tmp">TruckersMP</option>
                <option value="wot">World of Trucks</option>
                <option value="rusmap">RusMap</option>
              </select>
            </div>

            {/* Flagged */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Flagged</label>
              <select
                value={filters.flagged}
                onChange={(e) => handleFilterChange("flagged", e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value="">All</option>
                <option value="true">Flagged Only</option>
                <option value="false">Not Flagged</option>
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">From Date</label>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => handleFilterChange("date_from", e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">To Date</label>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange("date_to", e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Jobs Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No jobs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900 border-b border-gray-700">
                <tr>
                  {isStaff() && (
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Driver
                    </th>
                  )}
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Game
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Cargo
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Route
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Distance
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Income
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-750">
                    {isStaff() && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-white font-medium">
                          {job.username || "Unknown"}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          job.status === "completed"
                            ? "bg-green-900 text-green-200"
                            : job.status === "active"
                            ? "bg-blue-900 text-blue-200"
                            : "bg-red-900 text-red-200"
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-300">{job.game}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-white">
                          {job.cargo_display || "Unknown"}
                        </span>
                        {job.is_quick_job && (
                          <Zap className="w-3 h-3 text-yellow-400" />
                        )}
                        {job.mod_source && getModBadge(job.mod_source)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-400">
                        <MapPin className="w-3 h-3" />
                        <span>
                          {job.pickup_city_display || "Unknown"} →{" "}
                          {job.delivery_city_display || "Unknown"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="text-white">
                          {/* prefer actual_distance; fallback to planned_distance; both safely formatted */}
                          {fmtKm(
                            num(job.actual_distance) || num(job.planned_distance),
                            0
                          )}
                        </div>
                        {num(job.race_miles) > 0 && (
                          <div
                            className={`text-xs ${getRaceMilesColor(
                              job.race_percentage
                            )}`}
                          >
                            ⚡ {fmtPct(job.race_percentage, 1)} racing
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-green-400 font-semibold">
                        {fmtMoney(job.total_income) || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs space-y-1">
                        {job.damage_percent != null && (
                          <div className="text-gray-400">
                            🔧 {fmtPct(job.damage_percent, 1)} damage
                          </div>
                        )}
                        {job.flagged && (
                          <div className="text-red-400 font-semibold">
                            🚨 Flagged
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {fmtDate(job.completed_at) || fmtDate(job.started_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Showing {(currentPage - 1) * jobsPerPage + 1} to{" "}
            {Math.min(currentPage * jobsPerPage, totalJobs)} of{" "}
            {totalJobs.toLocaleString()} jobs
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-white">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-700"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
