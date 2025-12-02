// src/components/Admin/JobManager.jsx
import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  Pencil,
  Trash2,
  RefreshCcw,
  Flag,
  X,
  Eye,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

const initialEditState = {
  job_number: null,
  total_income: "",
  actual_distance: "",
  damage_percent: "",
  status: "",
  flagged: false,
  flag_reasons: "",
};

export default function JobManager() {
  const { isStaff } = useAuth();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [flagFilter, setFlagFilter] = useState("all");

  const [selectedJob, setSelectedJob] = useState(null);
  const [editState, setEditState] = useState(initialEditState);
  const [deleteReason, setDeleteReason] = useState("");

  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showHardDeleteModal, setShowHardDeleteModal] = useState(false);

  const fetchJobs = async (currentStatusFilter) => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (currentStatusFilter && currentStatusFilter !== "all") {
        params.status = currentStatusFilter;
      }
      const { data } = await api.get("/admin/all-jobs", { params });
      const list = Array.isArray(data) ? data : data.jobs || [];
      setJobs(list);
    } catch (e) {
      console.error("Failed to fetch jobs:", e);
      setError("Failed to load jobs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isStaff && isStaff()) {
      fetchJobs(statusFilter);
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStaff, statusFilter]);

  useEffect(() => {
    const handleJobDeleted = (data) => {
      console.log('[JobManager] Received job:deleted event for job:', data.jobId);
      setJobs((prevJobs) => prevJobs.filter((job) => job.job_number !== data.jobId));
    };

    const unsubscribe = window.electronAPI.onJobDeleted(handleJobDeleted);

    return () => {
      unsubscribe();
    };
  }, []);

  const filteredJobs = useMemo(() => {
    const t = searchTerm.trim().toLowerCase();

    return jobs
      .filter((job) => {
        if (!t) return true;
        return (
          String(job.job_number || "").toLowerCase().includes(t) ||
          (job.username && job.username.toLowerCase().includes(t)) ||
          (job.cargo_display &&
            job.cargo_display.toLowerCase().includes(t)) ||
          (job.pickup_city_display &&
            job.pickup_city_display.toLowerCase().includes(t)) ||
          (job.delivery_city_display &&
            job.delivery_city_display.toLowerCase().includes(t))
        );
      })
      .filter((job) => {
        if (statusFilter === "all") return true;
        const s = (job.status || "").toLowerCase();
        return s === statusFilter;
      })
      .filter((job) => {
        if (flagFilter === "all") return true;
        const flagged = !!job.flagged;
        return flagFilter === "flagged" ? flagged : !flagged;
      });
  }, [jobs, searchTerm, statusFilter, flagFilter]);

  const statusToClasses = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "completed") return "bg-emerald-900/40 text-emerald-300 border-emerald-700";
    if (s === "cancelled") return "bg-red-900/40 text-red-300 border-red-700";
    if (s === "abandoned") return "bg-amber-900/40 text-amber-300 border-amber-700";
    if (s === "in_progress") return "bg-sky-900/40 text-sky-300 border-sky-700";
    return "bg-[#050312]/90 text-slate-100 border-[#3b234f]";
  };

  const damageToClasses = (pct) => {
    const p = Number(pct);
    if (Number.isNaN(p)) return "text-slate-100";
    if (p <= 5) return "text-emerald-300";
    if (p <= 15) return "text-amber-300";
    return "text-red-300";
  };

  const stats = useMemo(
    () => ({
      total: jobs.length,
      flagged: jobs.filter((j) => j.flagged).length,
      completed: jobs.filter((j) => (j.status || "").toLowerCase() === "completed").length,
      inProgress: jobs.filter((j) => (j.status || "").toLowerCase() === "in_progress").length,
    }),
    [jobs]
  );

  const openEditModal = (job) => {
    setSelectedJob(job);
    setEditState({
      job_number: job.job_number,
      total_income: job.total_income ?? "",
      actual_distance: job.actual_distance ?? "",
      damage_percent: job.damage_percent ?? "",
      status: job.status ?? "",
      flagged: !!job.flagged,
      flag_reasons: job.flag_reasons ?? "",
    });
    setShowEditModal(true);
  };

  const handleEditChange = (field, value) => {
    setEditState((prev) => ({ ...prev, [field]: value }));
  };

  const submitEdit = async () => {
    if (!editState.job_number) return;
    setActionLoading(true);
    setError("");
    try {
      const payload = {
        total_income:
          editState.total_income === "" ? null : Number(editState.total_income),
        actual_distance:
          editState.actual_distance === "" ? null : Number(editState.actual_distance),
        damage_percent:
          editState.damage_percent === ""
            ? null
            : Number(editState.damage_percent),
        status: editState.status || null,
        flagged: !!editState.flagged,
        flag_reasons: editState.flag_reasons || null,
      };

      await api.patch(`/admin/all-jobs/${editState.job_number}`, payload);
      await fetchJobs();
      setShowEditModal(false);
      setSelectedJob(null);
      setEditState(initialEditState);
    } catch (e) {
      console.error("Failed to update job:", e);
      setError("Failed to update job. Check console for details.");
    } finally {
      setActionLoading(false);
    }
  };

  const forceDiscordSync = async (job) => {
    setActionLoading(true);
    setError("");
    try {
      await api.post(`/admin/all-jobs/${job.job_number}/sync-discord`);
      await fetchJobs();
    } catch (e) {
      console.error("Discord sync failed:", e);
      setError("Failed to sync Discord message.");
    } finally {
      setActionLoading(false);
    }
  };

  const openDeleteModal = (job) => {
    setSelectedJob(job);
    setDeleteReason("");
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedJob) return;
    setActionLoading(true);
    setError("");
    try {
      await api.delete(`/admin/all-jobs/${selectedJob.job_number}`, {
        data: { reason: deleteReason || null },
      });
      await fetchJobs();
      setShowDeleteModal(false);
      setSelectedJob(null);
    } catch (e) {
      console.error("Delete failed:", e);
      setError("Failed to delete job.");
    } finally {
      setActionLoading(false);
    }
  };

  const openHardDeleteModal = (job) => {
    setSelectedJob(job);
    setShowHardDeleteModal(true);
  };

  const confirmHardDelete = async () => {
    if (!selectedJob) return;
    setActionLoading(true);
    setError("");
    try {
      await api.delete(`/admin/all-jobs/hard-delete/${selectedJob.job_number}`);
      await fetchJobs();
      setShowHardDeleteModal(false);
      setSelectedJob(null);
    } catch (e) {
      console.error("Hard delete failed:", e);
      setError("Failed to hard delete job.");
    } finally {
      setActionLoading(false);
    }
  };

  const openViewModal = (job) => {
    setSelectedJob(job);
    setShowViewModal(true);
  };

  if (!isStaff || !isStaff()) {
    return (
      <div className="p-6 bg-gradient-to-b from-[#12051a] via-[#1b1024] to-[#12051a] min-h-full">
        <div className="bg-[#1b1024] border border-[#2c1e3a] rounded-2xl p-6 text-center shadow-xl shadow-black/70">
          <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-slate-50 mb-1">
            Staff Only
          </h2>
          <p className="text-sm text-slate-400">
            The job manager is restricted to staff members.
          </p>
          {/* Hard Delete Modal */}
      {showHardDeleteModal && selectedJob && (
        <Modal
          onClose={() => setShowHardDeleteModal(false)}
          title="Permanently Delete Job"
        >
          <div className="space-y-3 text-sm text-slate-100">
            <p className="text-red-400 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5" />
              WARNING: This action cannot be undone. The job record will be
              permanently removed from the database.
            </p>
            <DetailRow
              label="Job"
              value={`#${selectedJob.job_number} - ${
                selectedJob.username || "Unknown"
              }`}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowHardDeleteModal(false)}
                className="rounded-lg border border-slate-700 px-3 py-1 text-sm text-slate-300 hover:bg-slate-700/30 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmHardDelete}
                disabled={actionLoading}
                className="rounded-lg bg-red-700 px-3 py-1 text-sm text-white hover:bg-red-800 transition-colors disabled:opacity-50"
              >
                {actionLoading ? "Deleting..." : "Confirm Hard Delete"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4 bg-gradient-to-b from-[#12051a] via-[#1b1024] to-[#12051a] min-h-full">
      {/* HEADER */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-purple-200/80 mb-1">
            Staff Tools
          </p>
          <h1 className="text-2xl font-semibold text-slate-50 tracking-tight">
            Admin Job Manager
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Search, edit, flag, and manage all completed jobs.
          </p>
        </div>
        <button
          onClick={fetchJobs}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white transition disabled:opacity-50 shadow-sm shadow-black/70"
          style={{ background: "linear-gradient(135deg, #6A0DAD, #f8cc00)" }}
        >
          <RefreshCcw className="w-4 h-4 text-sky-300" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="flex items-center gap-2 rounded-xl bg-[#12051a]/80 border border-[#2c1e3a] px-3 py-2">
          <span className="text-[11px] text-slate-400">Total</span>
          <span className="text-sm font-semibold text-slate-100">{stats.total}</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-[#12051a]/80 border border-[#2c1e3a] px-3 py-2">
          <span className="text-[11px] text-slate-400">Completed</span>
          <span className="text-sm font-semibold text-emerald-300">{stats.completed}</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-[#12051a]/80 border border-[#2c1e3a] px-3 py-2">
          <span className="text-[11px] text-slate-400">In Progress</span>
          <span className="text-sm font-semibold text-sky-300">{stats.inProgress}</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-[#12051a]/80 border border-[#2c1e3a] px-3 py-2">
          <span className="text-[11px] text-slate-400">Flagged</span>
          <span className="text-sm font-semibold text-red-300">{stats.flagged}</span>
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-[#1b1024] border border-[#2c1e3a] rounded-2xl p-4 flex flex-wrap gap-3 items-center shadow-lg shadow-black/70">
        <div className="flex items-center flex-1 gap-2">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by job ID, username, cargo, city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#12051a]/80 border border-[#2c1e3a] text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#6A0DAD] focus:ring-1 focus:ring-[#6A0DAD]/60"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            className="rounded-xl bg-[#12051a]/80 border border-[#2c1e3a] px-2 py-1.5 text-[11px] text-slate-100 focus:outline-none focus:border-[#6A0DAD]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="completed">Completed</option>
            <option value="abandoned">Abandoned</option>
            <option value="cancelled">Cancelled</option>
            <option value="in_progress">In progress</option>
          </select>
          <select
            className="rounded-xl bg-[#12051a]/80 border border-[#2c1e3a] px-2 py-1.5 text-[11px] text-slate-100 focus:outline-none focus:border-[#6A0DAD]"
            value={flagFilter}
            onChange={(e) => setFlagFilter(e.target.value)}
          >
            <option value="all">All jobs</option>
            <option value="flagged">Flagged only</option>
            <option value="unflagged">Unflagged only</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/50 bg-red-500/10 text-sm text-red-200 px-3 py-2">
          {error}
        </div>
      )}

      {/* TABLE */}
      <div className="overflow-x-auto rounded-2xl border border-[#2c1e3a] bg-[#1b1024] shadow-xl shadow-black/80">
        <table className="min-w-full text-xs">
          <thead className="bg-[#12051a]/95 text-[11px] uppercase tracking-wide text-slate-400 border-b border-[#2c1e3a]">
            <tr>
              <th className="px-3 py-2 text-left text-[#f8cc00]">Job ID</th>
              <th className="px-3 py-2 text-left text-[#6A0DAD]">Driver</th>
              <th className="px-3 py-2 text-left text-sky-300">Cargo</th>
              <th className="px-3 py-2 text-left text-indigo-300">Route</th>
              <th className="px-3 py-2 text-left text-cyan-300">Distance</th>
              <th className="px-3 py-2 text-left text-amber-300">Damage %</th>
              <th className="px-3 py-2 text-left text-emerald-300">Status</th>
              <th className="px-3 py-2 text-left text-red-300">Flags</th>
              <th className="px-3 py-2 text-right text-violet-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-3 py-6 text-center text-slate-500"
                >
                  Loading jobs...
                </td>
              </tr>
            ) : filteredJobs.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-3 py-6 text-center text-slate-500"
                >
                  No jobs found with current filters.
                </td>
              </tr>
            ) : (
              filteredJobs.map((job) => (
                <tr
                  key={job.job_number}
                  className="border-t border-[#2c1e3a] hover:bg-[#241233] transition-colors"
                >
                  <td
                    className={`px-3 py-2 font-mono text-[11px] ${String(
                      job.job_number || ""
                    )
                      .toUpperCase()
                      .startsWith("EH")
                      ? "text-[#f8cc00] font-semibold"
                      : "text-slate-300"}`}
                  >
                    {job.job_number}
                  </td>
                  <td className="px-3 py-2 text-slate-100">
                    <div className="font-medium text-white">
                      {job.username || "Unknown"}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {job.game || "—"}
                    </div>
                    {job.is_quick_job && (
                      <div className="mt-0.5 text-[10px] text-indigo-300">
                        Quick Job
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-slate-100">
                    <div className="truncate max-w-[140px]">
                      {job.cargo_display || job.cargo || "—"}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-slate-100">
                    <div className="text-[11px]">
                      {job.pickup_city_display || job.source_city || "?"} →{" "}
                      {job.delivery_city_display ||
                        job.destination_city ||
                        "?"}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-slate-100">
                    <div className="text-[11px]">
                      {job.actual_distance != null
                        ? `${job.actual_distance} km`
                        : job.planned_distance != null
                        ? `${job.planned_distance} km`
                        : "—"}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span className={damageToClasses(job.damage_percent)}>
                      {job.damage_percent != null ? `${job.damage_percent}%` : "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide border ${statusToClasses(job.status)}`}>
                      {job.status || "unknown"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {job.flagged ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] text-red-300 border border-red-500/60">
                        <Flag className="w-3 h-3" />
                        Flagged
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500">
                        None
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openViewModal(job)}
                        className="rounded-lg border border-[#2c1e3a] px-2 py-1 text-[11px] text-slate-100 hover:bg-[#1b1024]/80 transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => openEditModal(job)}
                        className="rounded-lg border border-[#2c1e3a] px-2 py-1 text-[11px] text-slate-100 hover:bg-[#1b1024]/80 transition-colors"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => forceDiscordSync(job)}
                        disabled={actionLoading}
                        title="Force Discord sync"
                        className="rounded-lg border border-[#2c1e3a] px-2 py-1 text-[11px] text-slate-100 hover:bg-[#1b1024]/80 disabled:opacity-50 transition-colors"
                      >
                        <RefreshCcw className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(job)}
                        className="rounded-lg border border-red-500/70 px-2 py-1 text-[11px] text-red-300 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => openHardDeleteModal(job)}
                        className="rounded-lg border border-red-700/70 px-2 py-1 text-[11px] text-red-500 hover:bg-red-700/10 transition-colors"
                        title="Permanently delete job"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedJob && (
        <Modal onClose={() => setShowEditModal(false)} title="Edit Job">
          <div className="space-y-3 text-sm text-slate-100">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 text-xs text-slate-400">
                  Income
                </label>
                <input
                  type="number"
                  value={editState.total_income}
                  onChange={(e) =>
                    handleEditChange("total_income", e.target.value)
                  }
                  className="w-full rounded-lg bg-[#050312] border border-[#332148] px-2 py-1 text-sm text-slate-100 focus:outline-none focus:border-[#6a0dad]"
                />
              </div>
              <div>
                <label className="block mb-1 text-xs text-slate-400">
                  Distance (km)
                </label>
                <input
                  type="number"
                  value={editState.actual_distance}
                  onChange={(e) =>
                    handleEditChange("actual_distance", e.target.value)
                  }
                  className="w-full rounded-lg bg-[#050312] border border-[#332148] px-2 py-1 text-sm text-slate-100 focus:outline-none focus:border-[#6a0dad]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 text-xs text-slate-400">
                  Damage %
                </label>
                <input
                  type="number"
                  value={editState.damage_percent}
                  onChange={(e) =>
                    handleEditChange("damage_percent", e.target.value)
                  }
                  className="w-full rounded-lg bg-[#050312] border border-[#332148] px-2 py-1 text-sm text-slate-100 focus:outline-none focus:border-[#6a0dad]"
                />
              </div>
              <div>
                <label className="block mb-1 text-xs text-slate-400">
                  Status
                </label>
                <input
                  type="text"
                  value={editState.status}
                  onChange={(e) =>
                    handleEditChange("status", e.target.value)
                  }
                  className="w-full rounded-lg bg-[#050312] border border-[#332148] px-2 py-1 text-sm text-slate-100 focus:outline-none focus:border-[#6a0dad]"
                  placeholder="completed / abandoned / cancelled..."
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="flagged"
                type="checkbox"
                checked={editState.flagged}
                onChange={(e) =>
                  handleEditChange("flagged", e.target.checked)
                }
                className="h-4 w-4 rounded border-[#3b234f] bg-[#050312] text-[#6a0dad] focus:ring-[#6a0dad]"
              />
              <label
                htmlFor="flagged"
                className="text-xs text-slate-200 flex items-center gap-1"
              >
                <Flag className="w-3 h-3 text-red-300" />
                Mark as flagged
              </label>
            </div>

            <div>
              <label className="block mb-1 text-xs text-slate-400">
                Flag reasons / notes
              </label>
              <textarea
                rows={3}
                value={editState.flag_reasons}
                onChange={(e) =>
                  handleEditChange("flag_reasons", e.target.value)
                }
                className="w-full rounded-lg bg-[#050312] border border-[#332148] px-2 py-1 text-sm text-slate-100 focus:outline-none focus:border-[#6a0dad]"
                placeholder="Why is this job flagged?"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-3 py-1.5 rounded-lg border border-[#2c1e3a] text-xs text-slate-200 hover:bg-[#1b1024]/80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitEdit}
                disabled={actionLoading}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#6a0dad] via-[#8b5cf6] to-[#22d3ee] text-xs text-white hover:brightness-110 disabled:opacity-50 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* View Modal */}
      {showViewModal && selectedJob && (
        <Modal
          onClose={() => setShowViewModal(false)}
          title={`Job #${selectedJob.job_number}`}
        >
          <div className="space-y-2 text-sm text-slate-100">
            <DetailRow label="Driver" value={selectedJob.username} />
            <DetailRow label="Game" value={selectedJob.game} />
            <DetailRow
              label="Cargo"
              value={selectedJob.cargo_display || selectedJob.cargo}
            />
            <DetailRow
              label="Route"
              value={`${selectedJob.pickup_city_display || selectedJob.source_city || "?"} → ${
                selectedJob.delivery_city_display || selectedJob.destination_city || "?"
              }`}
            />
            <DetailRow
              label="Distance"
              value={
                selectedJob.actual_distance != null
                  ? `${selectedJob.actual_distance} km`
                  : selectedJob.planned_distance != null
                  ? `${selectedJob.planned_distance} km`
                  : "—"
              }
            />
            <DetailRow
              label="Income"
              value={
                selectedJob.total_income != null
                  ? `$${selectedJob.total_income.toLocaleString()}`
                  : "—"
              }
            />
            <DetailRow
              label="Damage %"
              value={
                selectedJob.damage_percent != null
                  ? `${selectedJob.damage_percent}%`
                  : "—"
              }
            />
            <DetailRow
              label="Status"
              value={selectedJob.status || "unknown"}
            />
            <DetailRow
              label="Quick Job"
              value={selectedJob.is_quick_job ? "Yes" : "No"}
            />
            <DetailRow
              label="Modded"
              value={selectedJob.is_modded ? "Yes" : "No"}
            />
            <DetailRow
              label="Mod Source"
              value={selectedJob.mod_source || "—"}
            />
            <DetailRow
              label="Discord Message ID"
              value={selectedJob.discord_message_id || "—"}
            />
            <DetailRow
              label="Flagged"
              value={selectedJob.flagged ? "Yes" : "No"}
            />
            {selectedJob.flag_reasons && (
              <DetailRow
                label="Flag Reasons"
                value={selectedJob.flag_reasons}
              />
            )}
          </div>
        </Modal>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedJob && (
        <Modal
          onClose={() => setShowDeleteModal(false)}
          title="Delete Job (Soft Delete)"
        >
          <div className="space-y-3 text-sm text-slate-100">
            <p className="text-amber-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5" />
              This will mark the job as deleted but keep it in history for
              auditing. You can include a reason below.
            </p>
            <DetailRow
              label="Job"
              value={`#${selectedJob.job_number} - ${
                selectedJob.username || "Unknown"
              }`}
            />
            <div>
              <label className="block mb-1 text-xs text-slate-400">
                Reason for soft delete (optional)
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="w-full rounded-lg bg-[#050312] border border-[#332148] px-2 py-1 text-sm text-slate-100 focus:outline-none focus:border-[#6a0dad]"
                rows="3"
              ></textarea>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="rounded-lg border border-slate-700 px-3 py-1 text-sm text-slate-300 hover:bg-slate-700/30 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={actionLoading}
                className="rounded-lg bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? "Deleting..." : "Confirm Soft Delete"}
              </button>
            </div>
          </div>
        </Modal>
      )}


    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg rounded-2xl bg-[#120b21] border border-[#3b234f] shadow-2xl shadow-black/80 p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-50">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-[#1b1024]/80 text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between gap-3 text-xs">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-100 text-right break-all">
        {value ?? "—"}
      </span>
    </div>
  );
}
