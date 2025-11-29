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

/* ---------------- safe number + format helpers ---------------- */
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
/* ---------------------------------------------------------------- */

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          colors[modSource.toLowerCase()] || "bg-slate-800 text-slate-200"
        }`}
      >
        {modSource}
      </span>
    );
  };

  const totalPages = Math.ceil(totalJobs / jobsPerPage);

  return (
    <div className="p-6 space-y-6 bg-gradient-to-b from-[#12051a] via-[#1b1024] to-[#12051a] min-h-full">
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-1">
            {isStaff() ? "Company Jobs" : "My Jobs"}
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-50 tracking-tight">
            Job Browser
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {totalJobs.toLocaleString()} total jobs • page {currentPage} of{" "}
            {Math.max(totalPages, 1)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-slate-100 text-sm transition-colors shadow-sm"
            style={{
              backgroundColor: "#1b1024",
              borderColor: "#2c1e3a",
              borderWidth: 1,
              boxShadow: "0 0 12px #000",
            }}
          >
            <Filter className="w-4 h-4 text-[#9d6bff]" />
            Filters
          </button>
          <button
            onClick={exportToCSV}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm transition-colors shadow-md"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(106,13,173,0.95), rgba(157,107,255,0.95))",
              boxShadow: "0 0 18px rgba(106,13,173,0.8)",
            }}
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </motion.div>

      {/* FILTERS */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          className="rounded-2xl p-6 border shadow-lg"
          style={{
            backgroundColor: "#1b1024",
            borderColor: "#2c1e3a",
            boxShadow: "0 0 25px #000",
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-2 block uppercase tracking-wide">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Driver, cargo, city..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#12051a] border border-[#2c1e3a] rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#9d6bff]"
                />
              </div>
            </div>

            {/* Game */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-2 block uppercase tracking-wide">
                Game
              </label>
              <select
                value={filters.game}
                onChange={(e) => handleFilterChange("game", e.target.value)}
                className="w-full px-4 py-2.5 bg-[#12051a] border border-[#2c1e3a] rounded-xl text-sm text-slate-100 focus:outline-none focus:border-[#9d6bff]"
              >
                <option value="">All Games</option>
                <option value="ETS2">Euro Truck Simulator 2</option>
                <option value="ATS">American Truck Simulator</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-2 block uppercase tracking-wide">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full px-4 py-2.5 bg-[#12051a] border border-[#2c1e3a] rounded-xl text-sm text-slate-100 focus:outline-none focus:border-[#9d6bff]"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Mods */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-2 block uppercase tracking-wide">
                Mods
              </label>
              <select
                value={filters.mod_source}
                onChange={(e) =>
                  handleFilterChange("mod_source", e.target.value)
                }
                className="w-full px-4 py-2.5 bg-[#12051a] border border-[#2c1e3a] rounded-xl text-sm text-slate-100 focus:outline-none focus:border-[#9d6bff]"
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
              <label className="text-xs font-semibold text-slate-300 mb-2 block uppercase tracking-wide">
                Flagged
              </label>
              <select
                value={filters.flagged}
                onChange={(e) =>
                  handleFilterChange("flagged", e.target.value)
                }
                className="w-full px-4 py-2.5 bg-[#12051a] border border-[#2c1e3a] rounded-xl text-sm text-slate-100 focus:outline-none focus:border-[#9d6bff]"
              >
                <option value="">All</option>
                <option value="true">Flagged Only</option>
                <option value="false">Not Flagged</option>
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-2 block uppercase tracking-wide">
                From Date
              </label>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) =>
                  handleFilterChange("date_from", e.target.value)
                }
                className="w-full px-4 py-2.5 bg-[#12051a] border border-[#2c1e3a] rounded-xl text-sm text-slate-100 focus:outline-none focus:border-[#9d6bff]"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-2 block uppercase tracking-wide">
                To Date
              </label>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange("date_to", e.target.value)}
                className="w-full px-4 py-2.5 bg-[#12051a] border border-[#2c1e3a] rounded-xl text-sm text-slate-100 focus:outline-none focus:border-[#9d6bff]"
              />
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2.5 rounded-xl text-sm font-medium text-slate-100 transition-colors"
                style={{
                  backgroundColor: "#2c1e3a",
                  borderColor: "#3a274d",
                  borderWidth: 1,
                }}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* JOBS TABLE CARD */}
      <div
        className="rounded-2xl border overflow-hidden shadow-xl"
        style={{
          backgroundColor: "#1b1024",
          borderColor: "#2c1e3a",
          boxShadow: "0 0 30px #000",
        }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6a0dad]" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No jobs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead
                className="border-b"
                style={{
                  backgroundColor: "#12051a",
                  borderColor: "#2c1e3a",
                }}
              >
                <tr>
                  {isStaff() && (
                    <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#6A0DAD]">
                      Driver
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-violet-300">
                    Game
                  </th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-sky-300">
                    Cargo
                  </th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-indigo-300">
                    Route
                  </th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-cyan-300">
                    Distance
                  </th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
                    Income
                  </th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-violet-300">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-amber-300">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2c1e3a]">
                {jobs.map((job) => (
                  <tr
                    key={job.id}
                    className="transition-colors"
                    style={{
                      backgroundColor: "#1b1024",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#241233";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#1b1024";
                    }}
                  >
                    {isStaff() && (
                      <td className="px-6 py-3 whitespace-nowrap">
                        <span className="text-slate-50 font-medium">
                          {job.username || "Unknown"}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-3 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 text-[11px] font-semibold rounded-full ${
                          job.status === "completed"
                            ? "bg-emerald-900/80 text-emerald-200"
                            : job.status === "active"
                            ? "bg-sky-900/80 text-sky-200"
                            : "bg-red-900/80 text-red-200"
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <span className="text-slate-200 text-xs">
                        {job.game}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-50 text-sm">
                          {job.cargo_display || "Unknown"}
                        </span>
                        {job.is_quick_job && (
                          <Zap className="w-3 h-3 text-[#f8cc00]" />
                        )}
                        {job.mod_source && getModBadge(job.mod_source)}
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-1 text-xs text-slate-300">
                        <MapPin className="w-3 h-3" />
                        <span>
                          {job.pickup_city_display || "Unknown"} →{" "}
                          {job.delivery_city_display || "Unknown"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <div className="text-xs">
                        <div className="text-slate-50">
                          {fmtKm(
                            num(job.actual_distance) ||
                              num(job.planned_distance),
                            0
                          )}
                        </div>
                        {num(job.race_miles) > 0 && (
                          <div
                            className={`mt-0.5 ${getRaceMilesColor(
                              job.race_percentage
                            )} text-[11px]`}
                          >
                            ⚡ {fmtPct(job.race_percentage, 1)} racing
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <span className="text-emerald-400 font-semibold text-xs">
                        {fmtMoney(job.total_income) || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="text-[11px] space-y-1 text-slate-300">
                        {job.damage_percent != null && (
                          <div>
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
                    <td className="px-6 py-3 whitespace-nowrap text-xs text-slate-400">
                      {fmtDate(job.completed_at) || fmtDate(job.started_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <p className="text-xs md:text-sm text-slate-400">
            Showing {(currentPage - 1) * jobsPerPage + 1}–
            {Math.min(currentPage * jobsPerPage, totalJobs)} of{" "}
            {totalJobs.toLocaleString()} jobs
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center justify-center px-3 py-2 rounded-xl text-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              style={{
                backgroundColor: "#1b1024",
                borderColor: "#2c1e3a",
                borderWidth: 1,
              }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs md:text-sm text-slate-100">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              disabled={currentPage === totalPages}
              className="inline-flex items-center justify-center px-3 py-2 rounded-xl text-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              style={{
                backgroundColor: "#1b1024",
                borderColor: "#2c1e3a",
                borderWidth: 1,
              }}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
