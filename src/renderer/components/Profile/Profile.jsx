// src/pages/Profile.jsx - FIXED VERSION
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Calendar,
  Award,
  TrendingUp,
  DollarSign,
  Package,
  AlertCircle,
  MapPin,
  Zap,
  Shield,
  Clock,
  Edit,
  Save,
  X,
  Link as LinkIcon,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useModal } from "../../context/ModalContext";
import api from "../../services/api";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { showAlert } = useModal();
  const [stats, setStats] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || "");
  const [tempAvatar, setTempAvatar] = useState("");

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const [statsRes, jobsRes] = await Promise.all([
        api.get("/jobs/my-stats"),
        api.get("/jobs/my-jobs?limit=20"),
      ]);

      setStats(statsRes.data);
      setRecentJobs(jobsRes.data.jobs || jobsRes.data);
    } catch (error) {
      console.error("Failed to fetch profile data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAvatar = async () => {
    try {
      const response = await api.put("/users/me", {
        avatar: tempAvatar,
      });

      setAvatarUrl(tempAvatar);
      updateUser(response.data.user);
      setEditing(false);
      
      if (showAlert && typeof showAlert === 'function') {
        showAlert("Success", "Avatar updated successfully!", "success");
      } else {
        console.log("✅ Avatar updated successfully!");
        alert("Avatar updated successfully!");
      }
    } catch (error) {
      console.error("Failed to update avatar:", error);
      
      if (showAlert && typeof showAlert === 'function') {
        showAlert("Error", error.response?.data?.error || "Failed to update avatar", "error");
      } else {
        const errorMsg = error.response?.data?.error || "Failed to update avatar";
        console.error("❌", errorMsg);
        alert(`Error: ${errorMsg}`);
      }
    }
  };

  const getRaceMilesColor = (percentage) => {
    if (percentage >= 25) return "text-red-400";
    if (percentage >= 10) return "text-orange-400";
    if (percentage > 0) return "text-yellow-400";
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
      <span className={`px-2 py-0.5 text-xs rounded ${colors[modSource.toLowerCase()] || "bg-gray-700 text-gray-300"}`}>
        {modSource}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-600 to-violet-700 rounded-lg p-8 text-white relative"
      >
        <button
          onClick={() => {
            setEditing(!editing);
            setTempAvatar(avatarUrl || "");
          }}
          className="absolute top-4 right-4 p-2 bg-purple-800/50 hover:bg-purple-800 rounded-lg transition-colors"
        >
          <Edit className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-6">
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user?.username}
                className="w-24 h-24 rounded-full object-cover border-4 border-purple-800"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "";
                  setAvatarUrl("");
                }}
              />
            ) : (
              <div className="w-24 h-24 bg-purple-800 rounded-full flex items-center justify-center border-4 border-purple-900">
                <User className="w-12 h-12" />
              </div>
            )}

            {editing && (
              <div className="absolute -bottom-2 -right-2 p-1.5 bg-purple-900 rounded-full">
                <Edit className="w-4 h-4" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2">{user?.username}</h1>
            <div className="flex items-center gap-4 text-purple-100">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>{user?.email || "No email"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span className="capitalize">
                  {user?.roles?.join(", ") || "Driver"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>
                  Joined{" "}
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString()
                    : "Unknown"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {editing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-6 pt-6 border-t border-purple-500"
          >
            <div className="flex items-center gap-3">
              <LinkIcon className="w-5 h-5 text-purple-200" />
              <input
                type="text"
                placeholder="Paste image URL (e.g., from Imgur)"
                value={tempAvatar}
                onChange={(e) => setTempAvatar(e.target.value)}
                className="flex-1 px-4 py-2 bg-purple-800/50 border border-purple-500 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-400"
              />
              <button
                onClick={handleSaveAvatar}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setTempAvatar("");
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
            <p className="text-xs text-purple-200 mt-2 ml-8">
              Upload your image to{" "}
              <a
                href="https://imgur.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-white"
              >
                Imgur
              </a>{" "}
              or any image host, then paste the direct link here
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800 rounded-lg p-6 border border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <Package className="w-8 h-8 text-blue-400" />
            <span className="text-3xl font-bold text-white">
              {stats?.total_jobs || 0}
            </span>
          </div>
          <h3 className="text-gray-400 text-sm mb-2">Total Jobs</h3>
          <div className="flex items-center justify-between text-xs">
            <span className="text-green-400">
              ✓ {stats?.total_completed || 0} completed
            </span>
            <span className="text-red-400">
              ✗ {stats?.total_cancelled || 0} cancelled
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800 rounded-lg p-6 border border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 text-blue-400" />
            <span className="text-3xl font-bold text-white">
              {Number(stats?.total_distance || 0).toLocaleString()}
            </span>
          </div>
          <h3 className="text-gray-400 text-sm mb-2">Total Distance (km)</h3>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">
              {Number(stats?.total_normal_miles || 0).toFixed(0)} km normal
            </span>
            <span
              className={getRaceMilesColor(stats?.avg_race_percentage || 0)}
            >
              ⚡ {Number(stats?.total_race_miles || 0).toFixed(0)} km racing
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800 rounded-lg p-6 border border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 text-yellow-400" />
            <span className="text-3xl font-bold text-white">
              ${Number(stats?.total_income || 0).toLocaleString()}
            </span>
          </div>
          <h3 className="text-gray-400 text-sm mb-2">Total Earnings</h3>
          <p className="text-xs text-green-400">
            ${Number(stats?.avg_income || 0).toFixed(0)} avg per job
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-800 rounded-lg p-6 border border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <AlertCircle className="w-8 h-8 text-purple-400" />
            <span className="text-3xl font-bold text-white">
              {Number(stats?.avg_damage || 0).toFixed(1)}%
            </span>
          </div>
          <h3 className="text-gray-400 text-sm mb-2">Avg. Damage</h3>
          <p className="text-xs text-gray-400">Per completed job</p>
        </motion.div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-800 rounded-lg p-6 border border-gray-700"
        >
          <div className="flex items-center gap-3 mb-4">
            <Award className="w-6 h-6 text-yellow-400" />
            <h2 className="text-xl font-bold text-white">
              Driving Performance
            </h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Completion Rate</span>
              <span className="text-white font-semibold">
                {stats?.total_jobs > 0
                  ? ((stats.total_completed / stats.total_jobs) * 100).toFixed(1)
                  : 0}
                %
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Avg. Race Miles</span>
              <span
                className={`font-semibold ${getRaceMilesColor(
                  stats?.avg_race_percentage || 0
                )}`}
              >
                {Number(stats?.avg_race_percentage || 0).toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Avg. Delivery Time</span>
              <span className="text-white font-semibold">
                {stats?.avg_delivery_time
                  ? `${Math.floor(stats.avg_delivery_time / 60)}m ${
                      stats.avg_delivery_time % 60
                    }s`
                  : "N/A"}
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gray-800 rounded-lg p-6 border border-gray-700"
        >
          <div className="flex items-center gap-3 mb-4">
            <Package className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Job Breakdown</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Quick Jobs</span>
              <span className="text-yellow-400 font-semibold">
                {stats?.total_quick_jobs || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Freight Market</span>
              <span className="text-blue-400 font-semibold">
                {(stats?.total_jobs || 0) - (stats?.total_quick_jobs || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Modded Jobs</span>
              <span className="text-purple-400 font-semibold">
                {stats?.total_modded_jobs || 0}
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gray-800 rounded-lg p-6 border border-gray-700"
        >
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <h2 className="text-xl font-bold text-white">Safety Record</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Flagged Jobs</span>
              <span className="text-red-400 font-semibold">
                {stats?.total_flagged || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Clean Record</span>
              <span className="text-green-400 font-semibold">
                {(stats?.total_jobs || 0) - (stats?.total_flagged || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Safety Score</span>
              <span className="text-white font-semibold">
                {(stats?.total_jobs || 0) > 0
                  ? (
                      ((stats.total_jobs - (stats.total_flagged || 0)) /
                        stats.total_jobs) *
                      100
                    ).toFixed(0)
                  : 100}
                %
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Jobs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-gray-800 rounded-lg p-6 border border-gray-700"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold text-white">Your Recent Jobs</h2>
          </div>
          <span className="text-sm text-gray-400">
            {recentJobs.length} jobs shown
          </span>
        </div>

        <div className="space-y-4">
          {recentJobs.length > 0 ? (
            recentJobs.map((job) => (
              <div
                key={job.id}
                className="p-4 bg-gray-900 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">
                      {job.cargo_display || "Unknown Cargo"}
                    </span>
                    {job.is_quick_job && (
                      <Zap className="w-4 h-4 text-yellow-400" />
                    )}
                    {job.mod_source && getModBadge(job.mod_source)}
                  </div>
                  <div className="flex items-center gap-2">
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
                    <span className="text-xs text-gray-500">{job.game}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {job.pickup_city_display || "Unknown"} →{" "}
                    {job.delivery_city_display || "Unknown"}
                  </span>
                </div>

                {job.status === "completed" && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-gray-700">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Distance</p>
                      <p className="text-sm font-semibold text-white">
                        {Number(job.actual_distance || 0).toFixed(0)} km
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Income</p>
                      <p className="text-sm font-semibold text-green-400">
                        ${Number(job.total_income || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Damage</p>
                      <p className="text-sm font-semibold text-orange-400">
                        {Number(job.damage_percent || 0).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Race Miles</p>
                      <p
                        className={`text-sm font-semibold ${getRaceMilesColor(
                          job.race_percentage
                        )}`}
                      >
                        {Number(job.race_percentage || 0).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                )}

                {job.status === "cancelled" && (
                  <p className="text-sm text-red-400 pt-3 border-t border-gray-700">
                    Cancelled:{" "}
                    {job.cancel_reason?.replace(/_/g, " ") || "Unknown reason"}
                  </p>
                )}

                {job.flagged && (
                  <div className="mt-3 p-2 bg-red-900/20 border border-red-800 rounded">
                    <p className="text-xs text-red-400 font-semibold">
                      🚨 Flagged:{" "}
                      {job.flag_reasons?.join(", ").replace(/_/g, " ") ||
                        "Review required"}
                    </p>
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-3">
                  {job.completed_at
                    ? `Completed ${new Date(job.completed_at).toLocaleString()}`
                    : `Started ${new Date(job.started_at).toLocaleString()}`}
                </p>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No jobs yet. Start driving!</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}