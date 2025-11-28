// src/components/Admin/SystemLogs.jsx
import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

const ACTIONS = [
  { key: "", label: "All actions" },
  { key: "USER_JOIN", label: "User Joined" },
  { key: "USER_DELETE", label: "User Deleted" },
  { key: "USER_UPDATE", label: "User Updated" },
  { key: "ROLE_CHANGE", label: "Role Change" },
  { key: "LOGIN", label: "Login" },
  { key: "LOGOUT", label: "Logout" },
];

// MATCH NEW THEME COLORS
const pillStyle = (action) => {
  switch (action) {
    case "USER_JOIN":
      return "bg-emerald-900/40 text-emerald-300 border border-emerald-700";
    case "USER_DELETE":
      return "bg-red-900/40 text-red-300 border border-red-700";
    case "ROLE_CHANGE":
    case "USER_UPDATE":
      return "bg-sky-900/40 text-sky-300 border border-sky-700";
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
        <div className="space-y-4">
          {filtered.map((r) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-[#1b1024]/80 border border-[#2c1e3a] p-4 shadow-md hover:border-[#6A0DAD]/70 transition"
            >
              <div className="flex items-center justify-between gap-4">
                <span className={`text-xs px-2 py-1 rounded-full ${pillStyle(r.action)}`}>
                  {r.action}
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(r.created_at).toLocaleString()}
                </span>
              </div>

              <div className="mt-3 text-sm text-slate-300">
                <strong>Target:</strong> {r.target_user || "—"}
                {" • "}
                <strong>By:</strong> {r.performed_by || "System"}
              </div>

              {r.meta && (
                <pre className="mt-3 text-xs text-slate-400 bg-[#12051a]/70 border border-[#2c1e3a] rounded-lg p-3 overflow-x-auto">
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
