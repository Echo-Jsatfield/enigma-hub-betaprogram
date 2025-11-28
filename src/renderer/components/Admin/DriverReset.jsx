// src/components/Admin/DriverReset.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, RotateCcw, AlertTriangle, Search, User, X, TrendingUp, Award, MapPin, Clock } from "lucide-react";
import api from "../../services/api";

// Custom Confirmation Modal
function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText, type = "warning" }) {
  const [inputValue, setInputValue] = useState("");
  const requiresInput = message.includes("Type");

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (requiresInput) {
      const match = message.match(/Type ["'](.+?)["']/);
      if (match && inputValue === match[1]) {
        onConfirm();
        setInputValue("");
      }
    } else {
      onConfirm();
    }
  };

  const bgColor = type === "danger" ? "from-red-900/90 to-red-800/90" : "from-orange-900/90 to-orange-800/90";
  const borderColor = type === "danger" ? "border-red-500" : "border-orange-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`bg-gradient-to-br ${bgColor} border ${borderColor} rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-6 h-6" />
            {title}
          </h3>
          <button onClick={onClose} className="text-gray-300 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-gray-100 mb-4 whitespace-pre-line leading-relaxed">{message}</p>

        {requiresInput && (
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type here to confirm..."
            className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 mb-4"
            autoFocus
          />
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className={`flex-1 px-4 py-2.5 ${
              type === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-orange-600 hover:bg-orange-700"
            } text-white rounded-lg transition-all font-semibold shadow-lg`}
          >
            {confirmText || "Confirm"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function DriverReset() {
  const [drivers, setDrivers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({});

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const response = await api.get("/admin/users");
      const allUsers = response.data;
      const driverUsers = allUsers.filter(user => 
        user.roles && user.roles.includes('driver')
      );
      setDrivers(driverUsers);
    } catch (error) {
      console.error("Failed to fetch drivers:", error);
    } finally {
      setLoading(false);
    }
  };

  const showConfirm = (config) => {
    setModalConfig(config);
    setModalOpen(true);
  };

  const handleModalConfirm = async () => {
    setModalOpen(false);
    if (modalConfig.action) {
      await modalConfig.action();
    }
  };

  const handleResetStats = async (userId, username) => {
    showConfirm({
      title: "Reset Driver Stats",
      message: `Reset stats for ${username}?\n\nThis will zero out all stats but keep job history.`,
      confirmText: "Reset Stats",
      type: "warning",
      action: async () => {
        setActionLoading(`stats-${userId}`);
        try {
          await api.post(`/admin/reset/reset-driver-stats/${userId}`);
          fetchDrivers();
        } catch (error) {
          console.error("Reset stats failed:", error);
        } finally {
          setActionLoading(null);
        }
      }
    });
  };

  const handleDeleteAllJobs = async (userId, username) => {
    showConfirm({
      title: "Delete All Jobs",
      message: `⚠️ DELETE ALL JOBS for ${username}?\n\nThis will delete all job records and reset stats.\n\nCANNOT BE UNDONE!\n\nType "${username}" to confirm:`,
      confirmText: "Delete All Jobs",
      type: "danger",
      action: async () => {
        setActionLoading(`jobs-${userId}`);
        try {
          await api.delete(`/admin/reset/delete-driver-jobs/${userId}`);
          fetchDrivers();
        } catch (error) {
          console.error("Delete jobs failed:", error);
        } finally {
          setActionLoading(null);
        }
      }
    });
  };

  const handleDeleteCancelledJobs = async (userId, username) => {
    showConfirm({
      title: "Delete Cancelled Jobs",
      message: `Delete all cancelled jobs for ${username}?\n\nThis will recalculate their stats.`,
      confirmText: "Delete Cancelled",
      type: "warning",
      action: async () => {
        setActionLoading(`cancelled-${userId}`);
        try {
          await api.delete(`/admin/reset/delete-cancelled-jobs/${userId}`);
          fetchDrivers();
        } catch (error) {
          console.error("Delete cancelled failed:", error);
        } finally {
          setActionLoading(null);
        }
      }
    });
  };

  const handleFullReset = async (userId, username) => {
    showConfirm({
      title: "🚨 FULL ACCOUNT DELETION",
      message: `DELETE THE ENTIRE ACCOUNT for ${username}?\n\nThis will permanently delete:\n• User account\n• All jobs\n• All data\n\nCANNOT BE UNDONE!\n\nType "DELETE ${username}" to confirm:`,
      confirmText: "Delete Account",
      type: "danger",
      action: async () => {
        setActionLoading(`full-${userId}`);
        try {
          await api.delete(`/admin/reset/full-driver-reset/${userId}`);
          fetchDrivers();
        } catch (error) {
          console.error("Full reset failed:", error);
        } finally {
          setActionLoading(null);
        }
      }
    });
  };

  const filteredDrivers = drivers.filter(driver =>
    driver.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <AnimatePresence>
        {modalOpen && (
          <ConfirmModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            onConfirm={handleModalConfirm}
            {...modalConfig}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Driver Reset Tools</h1>
          <p className="text-gray-400">Manage driver data and statistics</p>
        </div>
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2.5 backdrop-blur-sm">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <span className="text-amber-400 font-semibold">Testing Mode</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search drivers by username..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-[#1a1625] border border-[#2d1b5c] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
        />
      </div>

      {/* Drivers List */}
      <div className="space-y-4">
        {filteredDrivers.map((driver) => (
          <motion.div
            key={driver.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-[#1a1625] to-[#120e1f] rounded-2xl p-6 border border-[#2d1b5c] hover:border-purple-500/50 transition-all shadow-xl"
          >
            {/* Driver Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                {driver.avatar ? (
                  <img
                    src={driver.avatar}
                    alt={driver.username}
                    className="w-16 h-16 rounded-full object-cover border-2 border-purple-500 shadow-lg"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                    <User className="w-8 h-8 text-white" />
                  </div>
                )}
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">{driver.username}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">
                      Driver
                    </span>
                    <span className="text-xs text-gray-500">ID: {driver.id}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-gray-400 uppercase tracking-wide">Total Jobs</span>
                </div>
                <p className="text-2xl font-bold text-white">{driver.total_jobs || 0}</p>
              </div>

              <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-gray-400 uppercase tracking-wide">Completed</span>
                </div>
                <p className="text-2xl font-bold text-white">{driver.total_completed || 0}</p>
              </div>

              <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-gray-400 uppercase tracking-wide">Distance</span>
                </div>
                <p className="text-2xl font-bold text-white">{driver.total_distance?.toLocaleString() || 0} km</p>
              </div>

              <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-gray-400 uppercase tracking-wide">Cancelled</span>
                </div>
                <p className="text-2xl font-bold text-white">{driver.total_cancelled || 0}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Reset Stats - Low danger */}
              <button
                onClick={() => handleResetStats(driver.id, driver.username)}
                disabled={actionLoading === `stats-${driver.id}`}
                className="group relative flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-lg hover:shadow-blue-500/25 hover:scale-[1.02]"
              >
                <RotateCcw className={`w-4 h-4 ${actionLoading === `stats-${driver.id}` ? 'animate-spin' : ''}`} />
                <span className="font-medium text-sm">
                  {actionLoading === `stats-${driver.id}` ? "Resetting..." : "Reset Stats"}
                </span>
              </button>

              {/* Delete Cancelled - Medium danger */}
              <button
                onClick={() => handleDeleteCancelledJobs(driver.id, driver.username)}
                disabled={actionLoading === `cancelled-${driver.id}`}
                className="group relative flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-br from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-lg hover:shadow-orange-500/25 hover:scale-[1.02]"
              >
                <Trash2 className="w-4 h-4" />
                <span className="font-medium text-sm">
                  {actionLoading === `cancelled-${driver.id}` ? "Deleting..." : "Delete Cancelled"}
                </span>
              </button>

              {/* Delete All Jobs - High danger */}
              <button
                onClick={() => handleDeleteAllJobs(driver.id, driver.username)}
                disabled={actionLoading === `jobs-${driver.id}`}
                className="group relative flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-lg hover:shadow-red-500/25 hover:scale-[1.02]"
              >
                <Trash2 className="w-4 h-4" />
                <span className="font-medium text-sm">
                  {actionLoading === `jobs-${driver.id}` ? "Deleting..." : "Delete All Jobs"}
                </span>
              </button>

              {/* Full Reset - Critical danger */}
              <button
                onClick={() => handleFullReset(driver.id, driver.username)}
                disabled={actionLoading === `full-${driver.id}`}
                className="group relative flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-br from-red-900 to-red-950 hover:from-red-800 hover:to-red-900 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed text-white rounded-xl transition-all border-2 border-red-500/50 hover:border-red-500 shadow-lg hover:shadow-red-500/40 hover:scale-[1.02]"
              >
                <AlertTriangle className="w-4 h-4" />
                <span className="font-bold text-sm">
                  {actionLoading === `full-${driver.id}` ? "Deleting..." : "Full Reset"}
                </span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredDrivers.length === 0 && !loading && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 bg-[#1a1625] rounded-2xl border border-[#2d1b5c]"
        >
          <User className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-xl text-gray-400 font-medium">No drivers found</p>
          <p className="text-sm text-gray-500 mt-2">Try adjusting your search term</p>
        </motion.div>
      )}
    </div>
  );
}