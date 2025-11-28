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
        api.get("/stats/leaderboard?limit=5"),
      ]);

      setStats(statsRes.data);
      setRecentJobs(jobsRes.data.jobs || jobsRes.data || []);
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
    return "text-emerald-400";
  };

  const getModBadge = (modSource) => {
    if (!modSource) return null;
    const colors = {
      promods: "bg-blue-900/60 text-blue-200",
      tmp: "bg-purple-900/70 text-purple-200",
      wot: "bg-yellow-900/70 text-yellow-200",
      rusmap: "bg-emerald-900/70 text-emerald-200",
    };
    return (
      <span
        className={`px-2 py-0.5 text-xs rounded ${
          colors[modSource.toLowerCase()] || "bg-[#241534] text-slate-200"
        }`}
      >
        {modSource}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-b from-[#12051a] via-[#1b1024] to-[#12051a]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6a0dad]" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-b from-[#12051a] via-[#1b1024] to-[#12051a] min-h-full">
      {/* HEADER / HERO */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-[#2c1e3a] bg-gradient-to-r from-[#2a0e4a] via-[#1b1024] to-[#12051a] text-white shadow-xl shadow-black/70"
      >
        {/* subtle glow overlay */}
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,_#38bdf8_0,_transparent_55%),_radial-gradient(circle_at_bottom,_#6a0dad_0,_transparent_55%)]" />
        <div className="relative px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-purple-100/80 mb-1">
              Company Dashboard
            </p>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-1">
              Welcome back, {user?.username || "Driver"}.
            </h1>
            <p className="text-sm text-purple-100/90">
              Live overview of Enigma Logistics performance.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 md:items-center">
            <SmallStatPill
              label="Total Jobs"
              value={stats?.total_jobs?.toLocaleString() || 0}
              icon={Package}
            />
            <SmallStatPill
              label="Distance (km)"
              value={stats?.total_distance?.toLocaleString() || 0}
              icon={TrendingUp}
            />
            <SmallStatPill
              label="Active Drivers"
              value={stats?.total_drivers || 0}
              icon={Users}
            />
          </div>
        </div>
      </motion.div>

      {/* PRIMARY STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Jobs */}
        <StatCard
          delay={0.1}
          icon={Package}
          iconClass="text-sky-300"
          title="Total Jobs"
          value={stats?.total_jobs?.toLocaleString() || 0}
          subtitle={`${stats?.total_completed || 0} completed`}
          subtitleClass="text-emerald-300"
        />

        {/* Total Distance */}
        <StatCard
          delay={0.15}
          icon={TrendingUp}
          iconClass="text-emerald-300"
          title="Total Distance (km)"
          value={stats?.total_distance?.toLocaleString() || 0}
          subtitle={`${Number(stats?.total_race_miles || 0).toFixed(
            0
          )} km racing`}
          subtitleClass="text-amber-300"
        />

        {/* Total Income */}
        <StatCard
          delay={0.2}
          icon={DollarSign}
          iconClass="text-amber-300"
          title="Total Earnings"
          value={`$${stats?.total_income?.toLocaleString() || 0}`}
        />

        {/* Active Drivers */}
        <StatCard
          delay={0.25}
          icon={Users}
          iconClass="text-purple-200"
          title="Active Drivers"
          value={stats?.total_drivers || 0}
          subtitle={`${stats?.pending_approvals || 0} pending`}
          subtitleClass="text-yellow-300"
        />
      </div>

      {/* SECONDARY STATS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Jobs */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#1b1024] rounded-2xl p-5 border border-[#2c1e3a] shadow-lg shadow-black/70"
        >
          <div className="flex items-center gap-3 mb-4">
            <Truck className="w-6 h-6 text-sky-300" />
            <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wide">
              Active Jobs
            </h2>
          </div>
          <div className="text-3xl font-semibold text-sky-300">
            {stats?.active_jobs || 0}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Currently in-progress across the company
          </p>
        </motion.div>

        {/* Completed Today */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-[#1b1024] rounded-2xl p-5 border border-[#2c1e3a] shadow-lg shadow-black/70"
        >
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-6 h-6 text-emerald-300" />
            <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wide">
              Completed Today
            </h2>
          </div>
          <div className="text-3xl font-semibold text-emerald-300">
            {stats?.completed_today || 0}
          </div>
          <p className="text-xs text-slate-400 mt-2">In the last 24 hours</p>
        </motion.div>

        {/* Flagged Jobs */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#1b1024] rounded-2xl p-5 border border-[#2c1e3a] shadow-lg shadow-black/70"
        >
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wide">
              Flagged Jobs
            </h2>
          </div>
          <div className="text-3xl font-semibold text-red-400">
            {stats?.flagged_jobs || 0}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Require staff review or follow-up
          </p>
        </motion.div>
      </div>

      {/* LEADERBOARD + RECENT JOBS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Drivers */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-[#1b1024] rounded-2xl p-5 border border-[#2c1e3a] shadow-lg shadow-black/70"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Award className="w-6 h-6 text-amber-300" />
              <h2 className="text-sm md:text-base font-semibold text-slate-100">
                Top Drivers
              </h2>
            </div>
            <span className="text-[11px] text-slate-400 uppercase tracking-wide">
              Last 30 days
            </span>
          </div>

          <div className="space-y-3">
            {leaderboard.length > 0 ? (
              leaderboard.map((driver, index) => (
                <div
                  key={driver.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#12051a]/90 border border-[#2c1e3a]"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-2xl font-bold ${
                        index === 0
                          ? "text-amber-300"
                          : index === 1
                          ? "text-slate-200"
                          : index === 2
                          ? "text-orange-400"
                          : "text-slate-500"
                      }`}
                    >
                      #{index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-100">
                        {driver.username}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {driver.total_jobs || 0} jobs •{" "}
                        {Number(
                          driver.total_distance || 0
                        ).toLocaleString()}{" "}
                        km
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-emerald-300 font-semibold">
                      $
                      {Number(driver.total_income || 0).toLocaleString(
                        undefined,
                        { maximumFractionDigits: 0 }
                      )}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">
                No leaderboard data yet.
              </p>
            )}
          </div>
        </motion.div>

        {/* Recent Company Jobs */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-[#1b1024] rounded-2xl p-5 border border-[#2c1e3a] shadow-lg shadow-black/70"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-purple-300" />
              <h2 className="text-sm md:text-base font-semibold text-slate-100">
                Company Recent Jobs
              </h2>
            </div>
            <span className="text-[11px] text-slate-400">
              {recentJobs.length} total
            </span>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {recentJobs.length > 0 ? (
              recentJobs.slice(0, 10).map((job) => (
                <div
                  key={job.id}
                  className="p-3 rounded-xl bg-[#12051a]/90 border border-[#2c1e3a]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-100">
                      {job.username || "Unknown Driver"}
                    </span>
                    <span
                      className={`px-2 py-1 text-[11px] font-semibold rounded-full ${
                        job.status === "completed"
                          ? "bg-emerald-900/70 text-emerald-200 border border-emerald-700/70"
                          : job.status === "active"
                          ? "bg-sky-900/70 text-sky-200 border border-sky-700/70"
                          : "bg-red-900/70 text-red-200 border border-red-700/70"
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-slate-200">
                      {job.cargo_display || "Unknown"}
                    </span>
                    {job.is_quick_job && (
                      <Zap className="w-3 h-3 text-yellow-400" />
                    )}
                    {job.mod_source && getModBadge(job.mod_source)}
                  </div>

                  <p className="text-[11px] text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>
                      {job.pickup_city_display || "Unknown"} →{" "}
                      {job.delivery_city_display || "Unknown"}
                    </span>
                  </p>

                  {job.status === "completed" && (
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px]">
                      <span className="text-slate-400">
                        {Number(job.actual_distance || 0).toFixed(0)} km
                      </span>
                      {job.race_miles > 0 && (
                        <span
                          className={getRaceMilesColor(job.race_percentage)}
                        >
                          ⚡ {Number(job.race_percentage || 0).toFixed(1)}% race
                          miles
                        </span>
                      )}
                      {job.flagged && (
                        <span className="text-red-400">🚨 Flagged</span>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 text-center py-8">
                No recent jobs logged yet.
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* === SMALL PRESENTATIONAL COMPONENTS === */

function StatCard({
  icon: Icon,
  iconClass,
  title,
  value,
  subtitle,
  subtitleClass,
  delay,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-[#1b1024] rounded-2xl p-5 border border-[#2c1e3a] shadow-lg shadow-black/70"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="h-10 w-10 rounded-xl bg-[#12051a] flex items-center justify-center border border-[#2c1e3a]">
          <Icon className={`w-5 h-5 ${iconClass}`} />
        </div>
        <span className="text-xl font-semibold text-slate-50">{value}</span>
      </div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-300">
        {title}
      </h3>
      {subtitle && (
        <p
          className={`text-[11px] mt-1 ${
            subtitleClass || "text-slate-500"
          }`}
        >
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}

function SmallStatPill({ label, value, icon: Icon }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-[#12051a]/90 border border-[#2c1e3a] px-3 py-2 shadow-sm shadow-black/70">
      <Icon className="w-4 h-4 text-sky-300/90" />
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-wide text-slate-300/80">
          {label}
        </span>
        <span className="text-sm font-semibold text-slate-50">{value}</span>
      </div>
    </div>
  );
}
