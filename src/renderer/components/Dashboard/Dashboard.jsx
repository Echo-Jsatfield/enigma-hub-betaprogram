// src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Calendar,
  DollarSign,
  Package,
  Truck,
  Award,
  Zap,
  MapPin,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, jobsRes, leaderboardRes] = await Promise.all([
        api.get("/stats/company"),
        api.get("/jobs?limit=20&sort=started_at&order=desc"),
        api.get("/stats/leaderboard?limit=5")
      ]);
      
      setStats(statsRes.data);
      setRecentJobs(jobsRes.data.jobs || jobsRes.data);
      setLeaderboard(leaderboardRes.data || []);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
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
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-600 to-violet-700 rounded-lg p-6 text-white"
      >
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user.username}!
        </h1>
        <p className="text-purple-100">Company Overview</p>
      </motion.div>

      {/* Company Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Jobs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800 rounded-lg p-6 border border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <Package className="w-8 h-8 text-blue-400" />
            <span className="text-2xl font-bold text-white">
              {stats?.total_jobs?.toLocaleString() || 0}
            </span>
          </div>
          <h3 className="text-gray-400 text-sm">Total Jobs</h3>
          <p className="text-xs text-green-400 mt-1">
            {stats?.total_completed || 0} completed
          </p>
        </motion.div>

        {/* Total Distance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800 rounded-lg p-6 border border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 text-green-400" />
            <span className="text-2xl font-bold text-white">
              {stats?.total_distance?.toLocaleString() || 0}
            </span>
          </div>
          <h3 className="text-gray-400 text-sm">Total Distance (km)</h3>
          <p className="text-xs text-orange-400 mt-1">
            {Number(stats?.total_race_miles || 0).toFixed(0)} km racing
          </p>
        </motion.div>

        {/* Total Income */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800 rounded-lg p-6 border border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 text-yellow-400" />
            <span className="text-2xl font-bold text-white">
              ${stats?.total_income?.toLocaleString() || 0}
            </span>
          </div>
          <h3 className="text-gray-400 text-sm">Total Earnings</h3>
        </motion.div>

        {/* Active Drivers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-800 rounded-lg p-6 border border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-purple-400" />
            <span className="text-2xl font-bold text-white">
              {stats?.total_drivers || 0}
            </span>
          </div>
          <h3 className="text-gray-400 text-sm">Active Drivers</h3>
          <p className="text-xs text-yellow-400 mt-1">
            {stats?.pending_approvals || 0} pending
          </p>
        </motion.div>
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Jobs */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-800 rounded-lg p-6 border border-gray-700"
        >
          <div className="flex items-center gap-3 mb-4">
            <Truck className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Active Jobs</h2>
          </div>
          <div className="text-3xl font-bold text-blue-400">
            {stats?.active_jobs || 0}
          </div>
          <p className="text-sm text-gray-400 mt-2">Currently in progress</p>
        </motion.div>

        {/* Completed Today */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gray-800 rounded-lg p-6 border border-gray-700"
        >
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <h2 className="text-xl font-bold text-white">Completed Today</h2>
          </div>
          <div className="text-3xl font-bold text-green-400">
            {stats?.completed_today || 0}
          </div>
          <p className="text-sm text-gray-400 mt-2">Last 24 hours</p>
        </motion.div>

        {/* Flagged Jobs */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gray-800 rounded-lg p-6 border border-gray-700"
        >
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <h2 className="text-xl font-bold text-white">Flagged Jobs</h2>
          </div>
          <div className="text-3xl font-bold text-red-400">
            {stats?.flagged_jobs || 0}
          </div>
          <p className="text-sm text-gray-400 mt-2">Need review</p>
        </motion.div>
      </div>

      {/* Leaderboard & Recent Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Drivers */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gray-800 rounded-lg p-6 border border-gray-700"
        >
          <div className="flex items-center gap-3 mb-4">
            <Award className="w-6 h-6 text-yellow-400" />
            <h2 className="text-xl font-bold text-white">Top Drivers</h2>
          </div>
          <div className="space-y-3">
            {leaderboard.length > 0 ? (
              leaderboard.map((driver, index) => (
                <div key={driver.id} className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className={`text-2xl font-bold ${
                      index === 0 ? "text-yellow-400" :
                      index === 1 ? "text-gray-300" :
                      index === 2 ? "text-orange-400" :
                      "text-gray-500"
                    }`}>
                      #{index + 1}
                    </span>
                    <div>
                      <p className="text-white font-medium">{driver.username}</p>
                      <p className="text-sm text-gray-400">
                        {driver.total_jobs || 0} jobs • {Number(driver.total_distance || 0).toLocaleString()} km
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-semibold">
                      ${Number(driver.total_income || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-4">No data yet</p>
            )}
          </div>
        </motion.div>

        {/* Recent Company Jobs */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-gray-800 rounded-lg p-6 border border-gray-700"
        >
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold text-white">Company Recent Jobs</h2>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recentJobs.length > 0 ? (
              recentJobs.slice(0, 10).map((job) => (
                <div key={job.id} className="p-3 bg-gray-900 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">{job.username || 'Unknown Driver'}</span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      job.status === "completed" ? "bg-green-900 text-green-200" :
                      job.status === "active" ? "bg-blue-900 text-blue-200" :
                      "bg-red-900 text-red-200"
                    }`}>
                      {job.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-gray-300">{job.cargo_display || 'Unknown'}</span>
                    {job.is_quick_job && <Zap className="w-3 h-3 text-yellow-400" />}
                    {job.mod_source && getModBadge(job.mod_source)}
                  </div>
                  <p className="text-xs text-gray-400">
                    {job.pickup_city_display || 'Unknown'} → {job.delivery_city_display || 'Unknown'}
                  </p>
                  {job.status === 'completed' && (
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <span className="text-gray-400">{Number(job.actual_distance || 0).toFixed(0)} km</span>
                      {job.race_miles > 0 && (
                        <span className={getRaceMilesColor(job.race_percentage)}>
                          ⚡ {Number(job.race_percentage || 0).toFixed(1)}% racing
                        </span>
                      )}
                      {job.flagged && <span className="text-red-400">🚨 Flagged</span>}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-8">No recent jobs</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}