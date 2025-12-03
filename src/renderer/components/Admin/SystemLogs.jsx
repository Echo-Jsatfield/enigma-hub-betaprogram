// src/components/Admin/SystemLogs.jsx
import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { User as UserIcon } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

const ACTIONS = [
  { key: "", label: "All actions" },
  { key: "USER_JOIN", label: "User Joined" },
  { key: "USER_DELETE", label: "User Deleted" },
  { key: "USER_UPDATE", label: "User Updated" },
  { key: "PASSWORD_RESET", label: "Password Reset" },
  { key: "DRIVER_ADDED", label: "Driver Added" },
  { key: "USER_APPROVED", label: "User Approved" },
  { key: "USER_SUSPENDED", label: "User Suspended" },
  { key: "USER_UNSUSPENDED", label: "User Unsuspended" },
  { key: "ROLE_CHANGE", label: "Role Change" },
  { key: "JOB_UPDATED", label: "Job Updated" },
  { key: "JOB_DELETED", label: "Job Deleted" },
  { key: "STATS_RESET", label: "Stats Reset" },
  { key: "DRIVER_RESET", label: "Driver Reset" },
  { key: "LOGIN", label: "Login" },
  { key: "LOGOUT", label: "Logout" },
];

// MATCH NEW THEME COLORS
const pillStyle = (action) => {
  switch (action) {
    case "USER_JOIN":
    case "DRIVER_ADDED":
    case "USER_APPROVED":
      return "bg-emerald-900/40 text-emerald-300 border border-emerald-700";
    case "USER_DELETE":
    case "JOB_DELETED":
    case "DRIVER_RESET":
      return "bg-red-900/40 text-red-300 border border-red-700";
    case "USER_SUSPENDED":
      return "bg-orange-900/40 text-orange-300 border border-orange-700";
    case "USER_UNSUSPENDED":
      return "bg-cyan-900/40 text-cyan-300 border border-cyan-700";
    case "ROLE_CHANGE":
    case "USER_UPDATE":
    case "JOB_UPDATED":
      return "bg-sky-900/40 text-sky-300 border border-sky-700";
    case "PASSWORD_RESET":
    case "STATS_RESET":
      return "bg-amber-900/40 text-amber-300 border border-amber-700";
    case "LOGIN":
      return "bg-indigo-900/40 text-indigo-300 border border-indigo-700";
    case "LOGOUT":
      return "bg-gray-800/40 text-gray-300 border border-gray-700";
    default:
      return "bg-purple-900/40 text-purple-300 border border-purple-700";
  }
};

export default function SystemLogs() {
  const { isStaff } = useAuth();
  const [rows, setRows] = useState([]);
  const [action, setAction] = useState("");
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(100);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    setErr("");
    try {
      const { data } = await api.get("/admin/system-logs", {
        params: { action: action || undefined, q: q || undefined, limit },
      });
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr("Failed to load logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line
  }, [action, limit]);

  const filtered = useMemo(() => rows, [rows]);

  if (!isStaff()) {
    return (
      <div className="p-6 text-red-400">
        You don’t have permission to view System Logs.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-b from-[#12051a] via-[#1b1024] to-[#12051a] min-h-full text-slate-200">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-semibold text-slate-100 tracking-tight">
          System Logs
        </h1>

        <div className="flex items-center gap-2">
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="bg-[#12051a]/80 border border-[#2c1e3a] rounded-xl px-3 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-[#6A0DAD] shadow-sm"
          >
            {ACTIONS.map((a) => (
              <option key={a.key} value={a.key}>{a.label}</option>
            ))}
          </select>

          <select
            value={limit}
            onChange={(e)=> setLimit(parseInt(e.target.value, 10))}
            className="bg-[#12051a]/80 border border-[#2c1e3a] rounded-xl px-3 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-[#6A0DAD] shadow-sm"
          >
            {[50,100,200,500].map(n=> <option key={n} value={n}>{n}</option>)}
          </select>

          <input
            value={q}
            onChange={(e)=> setQ(e.target.value)}
            placeholder="Search user/admin…"
            className="bg-[#12051a]/80 border border-[#2c1e3a] rounded-xl px-3 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-[#6A0DAD] shadow-sm"
            onKeyDown={(e)=> e.key === 'Enter' && fetchLogs()}
          />

          <button
            onClick={fetchLogs}
            className="text-white font-semibold px-4 py-2.5 rounded-xl transition shadow-md"
            style={{ background: "linear-gradient(135deg, #6A0DAD, #f8cc00)" }}
          >
            Refresh
          </button>
        </div>
      </div>

      {err && <div className="mb-3 text-red-400">{err}</div>}

      {/* LOADING SKELETON */}
      {loading ? (
        <div className="grid gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-[#1b1024]/50 border border-[#2c1e3a] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-slate-400">No log entries yet.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-[#1b1024]/80 border border-[#2c1e3a] p-5 shadow-md hover:border-[#6A0DAD]/70 transition"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${pillStyle(r.action)}`}>
                    {r.action}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(r.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-6">
                {/* Performed By */}
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex flex-col items-center">
                    {r.performed_by_avatar && r.performed_by_avatar.trim() !== "" ? (
                      <img
                        src={r.performed_by_avatar}
                        alt={r.performed_by || "System"}
                        className="w-10 h-10 rounded-full object-cover border-2 shadow-md"
                        style={{ borderColor: "#f8cc00" }}
                        onError={(e) => {
                          e.target.style.display = "none";
                          if (e.target.nextElementSibling) {
                            e.target.nextElementSibling.style.display = "flex";
                          }
                        }}
                      />
                    ) : null}
                    <div
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6A0DAD] to-[#f8cc00] flex items-center justify-center text-white font-semibold shadow-md"
                      style={{
                        display: r.performed_by_avatar && r.performed_by_avatar.trim() !== "" ? "none" : "flex",
                      }}
                    >
                      {(r.performed_by || "S").charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-0.5">Performed By</p>
                    <p className="text-sm font-medium text-slate-200">
                      {r.performed_by || "System"}
                    </p>
                  </div>
                </div>

                {/* Arrow */}
                <div className="text-slate-600">→</div>

                {/* Target User */}
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex flex-col items-center">
                    {r.target_user_avatar && r.target_user_avatar.trim() !== "" ? (
                      <img
                        src={r.target_user_avatar}
                        alt={r.target_user || "Unknown"}
                        className="w-10 h-10 rounded-full object-cover border-2 shadow-md"
                        style={{ borderColor: "#9d6bff" }}
                        onError={(e) => {
                          e.target.style.display = "none";
                          if (e.target.nextElementSibling) {
                            e.target.nextElementSibling.style.display = "flex";
                          }
                        }}
                      />
                    ) : null}
                    <div
                      className="w-10 h-10 rounded-full bg-[#1b1024] border-2 border-[#2c1e3a] flex items-center justify-center shadow-md"
                      style={{
                        display: r.target_user_avatar && r.target_user_avatar.trim() !== "" ? "none" : "flex",
                      }}
                    >
                      <UserIcon className="w-5 h-5 text-slate-500" />
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-0.5">Target</p>
                    <p className="text-sm font-medium text-slate-200">
                      {r.target_user || "—"}
                    </p>
                  </div>
                </div>
              </div>

              {r.meta && (
                <pre className="mt-4 text-xs text-slate-400 bg-[#12051a]/70 border border-[#2c1e3a] rounded-lg p-3 overflow-x-auto">
                  {JSON.stringify(r.meta, null, 2)}
                </pre>
              )}
            </motion.div>
          ))}
        </div>
      )}

    </div>
  );
}
