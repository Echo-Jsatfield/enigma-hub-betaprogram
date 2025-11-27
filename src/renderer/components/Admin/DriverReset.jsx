// src/components/Admin/DriverReset.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, RotateCcw, AlertTriangle, Search, User, X } from "lucide-react";
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
        className={`bg-gradient-to-br ${bgColor} border ${borderColor} rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-6 h-6" />
            {title}
          </h3>
          <button onClick={onClose} className="text-gray-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-gray-100 mb-4 whitespace-pre-line">{message}</p>

        {requiresInput && (
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type here to confirm..."
            className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 mb-4"
            autoFocus
          />
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className={`flex-1 px-4 py-2 ${
              type === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-orange-600 hover:bg-orange-700"
            } text-white rounded-lg transition-colors font-semibold`}
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
    <div className="p-6 space-y-6">
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
          <h1 className="text-3xl font-bold text-white">Driver Reset Tools</h1>
          <p className="text-gray-400 mt-1">Testing tools - Use with caution!</p>
        </div>
        <div className="flex items-center gap-2 bg-yellow-900/20 border border-yellow-700 rounded-lg px-4 py-2">
          <AlertTriangle className="w-5 h-5 text-yellow-400" />
          <span className="text-yellow-400 font-semibold">Testing Mode</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search drivers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Drivers List */}
      <div className="space-y-4">
        {filteredDrivers.map((driver) => (
          <motion.div
            key={driver.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-lg p-6 border border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {driver.avatar ? (
                  <img
                    src={driver.avatar}
                    alt={driver.username}
                    className="w-12 h-12 rounded-full object-cover border-2 border-purple-500"
                  />
                ) : (
                  <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-white">{driver.username}</h3>
                  <p className="text-sm text-gray-400">
                    {driver.total_jobs || 0} jobs • {driver.total_completed || 0} completed
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Reset Stats Only */}
              <button
                onClick={() => handleResetStats(driver.id, driver.username)}
                disabled={actionLoading === `stats-${driver.id}`}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                {actionLoading === `stats-${driver.id}` ? "Resetting..." : "Reset Stats"}
              </button>

              {/* Delete Cancelled Jobs */}
              <button
                onClick={() => handleDeleteCancelledJobs(driver.id, driver.username)}
                disabled={actionLoading === `cancelled-${driver.id}`}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                {actionLoading === `cancelled-${driver.id}` ? "Deleting..." : "Delete Cancelled"}
              </button>

              {/* Delete All Jobs */}
              <button
                onClick={() => handleDeleteAllJobs(driver.id, driver.username)}
                disabled={actionLoading === `jobs-${driver.id}`}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                {actionLoading === `jobs-${driver.id}` ? "Deleting..." : "Delete All Jobs"}
              </button>

              {/* Full Reset (Delete Account) */}
              <button
                onClick={() => handleFullReset(driver.id, driver.username)}
                disabled={actionLoading === `full-${driver.id}`}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-red-900 hover:bg-red-800 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors border-2 border-red-500"
              >
                <AlertTriangle className="w-4 h-4" />
                {actionLoading === `full-${driver.id}` ? "Deleting..." : "Full Reset"}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredDrivers.length === 0 && (
        <div className="text-center py-12">
          <User className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No drivers found</p>
        </div>
      )}
    </div>
  );
}