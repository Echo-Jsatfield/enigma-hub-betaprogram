// src/components/Admin/PendingApprovals.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, User, Calendar, Key, Users } from "lucide-react";
import { useModal } from "../../context/ModalContext";
import api from "../../services/api";

export default function PendingApprovals() {
  const { confirm, alert } = useModal();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      const response = await api.get("/admin/pending-approvals");
      setPendingUsers(response.data || []);
    } catch (error) {
      console.error("Failed to fetch pending approvals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId, username) => {
    const confirmed = await confirm({
      title: "Approve User",
      message: `Approve ${username} as a driver?\n\nThey will gain access to the system immediately.`,
      confirmText: "Approve",
      cancelText: "Cancel",
      type: "success",
    });

    if (!confirmed) return;

    try {
      setActionLoading(userId);
      await api.post(`/admin/approve/${userId}`);
      setPendingUsers(pendingUsers.filter((u) => u.id !== userId));
      await alert({
        title: "Success!",
        message: `✅ ${username} approved successfully!`,
        type: "success",
      });
    } catch (error) {
      console.error("Failed to approve user:", error);
      await alert({
        title: "Error",
        message: error.response?.data?.error || "Failed to approve user",
        type: "error",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId, username) => {
    const confirmed = await confirm({
      title: "Reject User",
      message: `Reject ${username}'s application?\n\nThey will not be able to access the system.\n\nThis action cannot be undone.`,
      confirmText: "Reject",
      cancelText: "Cancel",
      type: "danger",
    });

    if (!confirmed) return;

    try {
      setActionLoading(userId);
      await api.post(`/admin/reject/${userId}`, {
        reason: "Rejected by admin",
      });
      setPendingUsers(pendingUsers.filter((u) => u.id !== userId));
      await alert({
        title: "User Rejected",
        message: `${username} has been rejected`,
        type: "warning",
      });
    } catch (error) {
      console.error("Failed to reject user:", error);
      await alert({
        title: "Error",
        message: error.response?.data?.error || "Failed to reject user",
        type: "error",
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6 bg-gradient-to-b from-[#12051a] via-[#1b1024] to-[#12051a] min-h-full">
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-[#6A0DAD] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-b from-[#12051a] via-[#1b1024] to-[#12051a] min-h-full">
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-[#2c1e3a] bg-[#1b1024] text-white shadow-xl px-6 py-4"
      >
        <div className="absolute inset-0 opacity-10" />
        <div className="relative flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#12051a]/80 border border-[#2c1e3a] flex items-center justify-center shadow-md shadow-black/70">
              <CheckCircle className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.25em] text-purple-100/80 mb-0.5">
                Admin Queue
              </p>
              <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
                Pending Approvals
              </h1>
              <p className="text-xs md:text-sm text-purple-100/90 mt-1">
                Review and approve new driver applications •{" "}
                <span className="font-semibold text-[#f8cc00]">
                  {pendingUsers.length} pending
                </span>
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* CONTENT */}
      {pendingUsers.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#1b1024]/90 backdrop-blur-lg border border-[#2c1e3a] rounded-2xl p-12 text-center shadow-xl shadow-black/80"
        >
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/40">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-50 mb-2">
            All caught up!
          </h3>
          <p className="text-sm text-slate-400">
            No pending approvals at the moment.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {pendingUsers.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-[#1b1024]/90 backdrop-blur-lg border border-[#2c1e3a] rounded-2xl p-6 hover:border-[#6A0DAD]/60 hover:bg-[#241233] transition-all shadow-lg shadow-black/80"
            >
              <div className="flex items-center justify-between flex-wrap gap-4">
                {/* LEFT: avatar + info */}
                <div className="flex items-center gap-6 flex-1 min-w-0">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#6A0DAD] to-[#f8cc00] flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 shadow-md shadow-black/70">
                    {user.username.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 min-w-0">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-slate-500" />
                        <span className="text-[11px] text-slate-500 uppercase tracking-wide">
                          Username
                        </span>
                      </div>
                      <p className="text-slate-50 font-medium truncate">
                        {user.username}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-slate-500" />
                        <span className="text-[11px] text-slate-500 uppercase tracking-wide">
                          Discord ID
                        </span>
                      </div>
                      <p className="text-slate-300 text-sm truncate">
                        {user.discord_id || "Not set"}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Key className="w-4 h-4 text-slate-500" />
                        <span className="text-[11px] text-slate-500 uppercase tracking-wide">
                          Steam ID
                        </span>
                      </div>
                      <p className="text-slate-300 text-sm font-mono truncate">
                        {user.steam_id || "Not set"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* RIGHT: actions */}
                <div className="flex items-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleApprove(user.id, user.username)}
                    disabled={actionLoading === user.id}
                    className="px-6 py-2 bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 rounded-lg hover:bg-emerald-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleReject(user.id, user.username)}
                    disabled={actionLoading === user.id}
                    className="px-6 py-2 bg-red-500/15 border border-red-500/40 text-red-300 rounded-lg hover:bg-red-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </motion.button>
                </div>
              </div>

                <div className="mt-4 pt-4 border-t border-[#2c1e3a] flex flex-wrap items-center gap-6 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Registered:{" "}
                    {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>
                {user.invited_by_username && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>Invited by: {user.invited_by_username}</span>
                  </div>
                )}
                {user.invite_code && (
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    <span>Code: {user.invite_code}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
