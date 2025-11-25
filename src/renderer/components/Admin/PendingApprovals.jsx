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
      type: "success"
    });

    if (!confirmed) return;

    try {
      setActionLoading(userId);
      await api.post(`/admin/approve/${userId}`);
      setPendingUsers(pendingUsers.filter((u) => u.id !== userId));
      await alert({
        title: "Success!",
        message: `✅ ${username} approved successfully!`,
        type: "success"
      });
    } catch (error) {
      console.error("Failed to approve user:", error);
      await alert({
        title: "Error",
        message: error.response?.data?.error || "Failed to approve user",
        type: "error"
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
      type: "danger"
    });

    if (!confirmed) return;

    try {
      setActionLoading(userId);
      await api.post(`/admin/reject/${userId}`, { reason: "Rejected by admin" });
      setPendingUsers(pendingUsers.filter((u) => u.id !== userId));
      await alert({
        title: "User Rejected",
        message: `${username} has been rejected`,
        type: "warning"
      });
    } catch (error) {
      console.error("Failed to reject user:", error);
      await alert({
        title: "Error",
        message: error.response?.data?.error || "Failed to reject user",
        type: "error"
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-[#f8cc00] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <CheckCircle className="w-8 h-8 text-[#f8cc00]" />
          Pending Approvals
        </h1>
        <p className="text-gray-400">
          Review and approve new driver applications • {pendingUsers.length} pending
        </p>
      </motion.div>

      {pendingUsers.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#18122b]/60 backdrop-blur-lg border border-[#2d1b5c] rounded-xl p-12 text-center"
        >
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">All caught up!</h3>
          <p className="text-gray-400">No pending approvals at the moment</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {pendingUsers.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-[#18122b]/60 backdrop-blur-lg border border-[#2d1b5c] rounded-xl p-6 hover:border-[#2d1b5c]/80 transition-all"
            >
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-6 flex-1 min-w-0">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#f8cc00] to-[#6d28d9] flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                    {user.username.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 min-w-0">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-xs text-gray-500 uppercase">Username</span>
                      </div>
                      <p className="text-white font-medium truncate">{user.username}</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-xs text-gray-500 uppercase">Discord ID</span>
                      </div>
                      <p className="text-gray-300 text-sm truncate">
                        {user.discord_id || "Not set"}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Key className="w-4 h-4 text-gray-500" />
                        <span className="text-xs text-gray-500 uppercase">Steam ID</span>
                      </div>
                      <p className="text-gray-300 text-sm font-mono truncate">
                        {user.steam_id || "Not set"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleApprove(user.id, user.username)}
                    disabled={actionLoading === user.id}
                    className="px-6 py-2 bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg hover:bg-green-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleReject(user.id, user.username)}
                    disabled={actionLoading === user.id}
                    className="px-6 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </motion.button>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-[#2d1b5c] flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Registered: {new Date(user.created_at).toLocaleDateString()}
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