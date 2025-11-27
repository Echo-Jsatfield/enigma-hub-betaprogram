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

const pillStyle = (action) => {
  switch (action) {
    case "USER_JOIN":
      return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    case "USER_DELETE":
      return "bg-red-500/15 text-red-300 border-red-500/30";
    case "ROLE_CHANGE":
    case "USER_UPDATE":
      return "bg-sky-500/15 text-sky-300 border-sky-500/30";
    case "LOGIN":
      return "bg-indigo-500/15 text-indigo-300 border-indigo-500/30";
    case "LOGOUT":
      return "bg-gray-500/15 text-gray-300 border-gray-500/30";
    default:
      return "bg-[#2d1b5c] text-gray-300 border-[#3b296f]";
  }
};

export default function SystemLogs() {
  const { isStaff } = useAuth(); // admins & staff only should see this page
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

  useEffect(() => { fetchLogs(); /* eslint-disable-next-line */ }, [action, limit]);
  const filtered = useMemo(() => rows, [rows]); // server-side filters already applied

  if (!isStaff()) {
    return (
      <div className="p-6 text-red-300">
        You don’t have permission to view System Logs.
      </div>
    );
  }

  return (
    <div className="p-6 text-gray-200">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-semibold text-[#f8cc00]">System Logs</h1>
        <div className="flex items-center gap-2">
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="bg-[#0b0c1a] border border-[#2d1b5c] rounded-md px-3 py-2"
          >
            {ACTIONS.map((a) => (
              <option key={a.key} value={a.key}>{a.label}</option>
            ))}
          </select>
          <select
            value={limit}
            onChange={(e)=> setLimit(parseInt(e.target.value, 10))}
            className="bg-[#0b0c1a] border border-[#2d1b5c] rounded-md px-3 py-2"
          >
            {[50,100,200,500].map(n=> <option key={n} value={n}>{n}</option>)}
          </select>
          <input
            value={q}
            onChange={(e)=> setQ(e.target.value)}
            placeholder="Search user/admin…"
            className="bg-[#0b0c1a] border border-[#2d1b5c] rounded-md px-3 py-2"
            onKeyDown={(e)=> e.key === 'Enter' && fetchLogs()}
          />
          <button
            onClick={fetchLogs}
            className="bg-[#f8cc00] text-[#18122b] font-semibold px-4 py-2 rounded-md"
          >
            Refresh
          </button>
        </div>
      </div>

      {err && <div className="mb-3 text-red-400">{err}</div>}

      {loading ? (
        <div className="grid gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-[#18122b]/70 border border-[#2d1b5c] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-gray-400">No log entries yet.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-[#18122b]/80 border border-[#2d1b5c] p-4 hover:border-[#6d28d9] transition"
            >
              <div className="flex items-center justify-between gap-4">
                <span className={`text-xs px-2 py-1 rounded-full border ${pillStyle(r.action)}`}>
                  {r.action}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(r.created_at).toLocaleString()}
                </span>
              </div>
              <div className="mt-2 text-sm text-gray-300">
                <strong>Target:</strong> {r.target_user || "—"}
                {"  "}•{"  "}
                <strong>By:</strong> {r.performed_by || "System"}
              </div>
              {r.meta && (
                <pre className="mt-2 text-xs text-gray-400 bg-[#0b0c1a] border border-[#2d1b5c] rounded-lg p-2 overflow-x-auto">
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
