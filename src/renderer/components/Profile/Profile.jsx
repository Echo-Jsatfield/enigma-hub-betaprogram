// src/pages/Profile.jsx - Next Gen Profile (self-profile, no react-router)
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Link as LinkIcon,
  Image as ImageIcon,
  Activity,
  Star,
  ChevronDown,
  ChevronRight,
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

  const [editingAvatar, setEditingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || "");
  const [tempAvatar, setTempAvatar] = useState("");
  const [editingBanner, setEditingBanner] = useState(false);
  const [bannerUrl, setBannerUrl] = useState(user?.banner || "");
  const [tempBanner, setTempBanner] = useState("");

  // Game section expansion states
  const [ets2Expanded, setEts2Expanded] = useState(true);
  const [atsExpanded, setAtsExpanded] = useState(true);

  // Achievements placeholder – safe to keep empty for now,
  // later we can fill from /jobs/my-achievements or similar.
  const [achievements] = useState([]);

  useEffect(() => {
    fetchProfileData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const [statsRes, jobsRes] = await Promise.all([
        api.get("/jobs/my-stats"),
        api.get("/jobs/my-jobs?limit=20"),
      ]);

      setStats(statsRes.data);
      setRecentJobs(jobsRes.data?.jobs || jobsRes.data || []);
    } catch (error) {
      console.error("Failed to fetch profile data:", error);
      if (showAlert && typeof showAlert === "function") {
        showAlert(
          "Error",
          error.response?.data?.error || "Failed to load profile data",
          "error"
        );
      }
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
      setEditingAvatar(false);

      if (showAlert && typeof showAlert === "function") {
        showAlert("Success", "Avatar updated successfully!", "success");
      } else {
        alert("Avatar updated successfully!");
      }
    } catch (error) {
      console.error("Failed to update avatar:", error);
      const errorMsg =
        error.response?.data?.error || "Failed to update avatar";
      if (showAlert && typeof showAlert === "function") {
        showAlert("Error", errorMsg, "error");
      } else {
        alert(`Error: ${errorMsg}`);
      }
    }
  };

  const handleSaveBanner = async () => {
    try {
      const response = await api.put("/users/me", {
        banner: tempBanner,
      });

      setBannerUrl(tempBanner);
      updateUser(response.data.user);
      setEditingBanner(false);

      if (showAlert && typeof showAlert === "function") {
        showAlert("Success", "Banner updated successfully!", "success");
      } else {
        alert("Banner updated successfully!");
      }
    } catch (error) {
      console.error("Failed to update banner:", error);
      const errorMsg =
        error.response?.data?.error || "Failed to update banner";
      if (showAlert && typeof showAlert === "function") {
        showAlert("Error", errorMsg, "error");
      } else {
        alert(`Error: ${errorMsg}`);
      }
    }
  };

  const handleClearBanner = async () => {
    try {
      const response = await api.put("/users/me", {
        banner: null,
      });

      setBannerUrl("");
      updateUser(response.data.user);
      setEditingBanner(false);

      if (showAlert && typeof showAlert === "function") {
        showAlert("Success", "Banner cleared", "success");
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.error || "Failed to clear banner";
      if (showAlert && typeof showAlert === "function") {
        showAlert("Error", errorMsg, "error");
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
      <span
        className={`px-2 py-0.5 text-xs rounded ${
          colors[modSource.toLowerCase()] || "bg-slate-800 text-slate-200"
        }`}
      >
        {modSource}
      </span>
    );
  };

  const completionRate = useMemo(() => {
    if (!stats?.total_jobs) return 0;
    return ((stats.total_completed || 0) / stats.total_jobs) * 100;
  }, [stats]);

  const safetyScore = useMemo(() => {
    if (!stats?.total_jobs) return 100;
    const flagged = stats.total_flagged || 0;
    const clean = Math.max(stats.total_jobs - flagged, 0);
    return (clean / stats.total_jobs) * 100;
  }, [stats]);

  const avgIncomePerJob = useMemo(() => {
    if (!stats) return 0;
    return Number(stats.avg_income || 0);
  }, [stats]);

  // Group jobs by game
  const jobsByGame = useMemo(() => {
    const ets2Jobs = recentJobs.filter(job => job.game === "ETS2");
    const atsJobs = recentJobs.filter(job => job.game === "ATS");
    return { ets2Jobs, atsJobs };
  }, [recentJobs]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-b from-[#12051a] via-[#1b1024] to-[#12051a]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6a0dad]" />
      </div>
    );
  }

  const safeStats = stats || {};

  return (
    <div className="p-6 space-y-6 bg-gradient-to-b from-[#12051a] via-[#1b1024] to-[#12051a] min-h-full">
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border text-white shadow-xl bg-gradient-to-r"
        style={{
          borderColor: "#2c1e3a",
          backgroundImage:
            "linear-gradient(to right, rgba(106,13,173,0.9), rgba(27,16,36,0.95), rgba(44,30,58,0.95))",
        }}
      >
        {bannerUrl && (
          <img
            src={bannerUrl}
            alt="Profile banner"
            className="absolute inset-0 w-full h-full object-cover opacity-35"
            onError={(e) => {
              e.target.onerror = null;
              setBannerUrl("");
            }}
          />
        )}
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,_#f8cc00_0,_transparent_55%),_radial-gradient(circle_at_bottom,_#6a0dad_0,_transparent_55%)]" />
        <div className="relative p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* LEFT: avatar + identity */}
          <div className="flex items-center gap-5">
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={user?.username}
                  className="w-24 h-24 md:w-28 md:h-28 rounded-2xl object-cover border-4 border-[#6a0dad] shadow-xl shadow-black/70"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "";
                    setAvatarUrl("");
                  }}
                />
              ) : (
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-[#12051a] border-4 border-[#6a0dad] flex items-center justify-center shadow-xl shadow-black/70">
                  <User className="w-12 h-12 text-purple-200" />
                </div>
              )}

              {/* Status pill – for future account state */}
              <div className="absolute -bottom-3 left-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#12051a]/95 border border-[#2c1e3a] flex items-center gap-1">
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="uppercase tracking-wide text-slate-100">
                  Active
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                  {user?.username}
                </h1>
                {user?.roles?.includes("admin") && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-amber-400/15 border border-amber-400/50 text-amber-200">
                    <Shield className="h-3 w-3" />
                    Admin
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide bg-sky-500/15 border border-sky-400/50 text-sky-200">
                  <Activity className="h-3 w-3" />
                  Driver
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm text-purple-100/90">
                <div className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4 opacity-80" />
                  <span>{user?.email || "No email"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 opacity-80" />
                  <span className="capitalize">
                    {user?.roles?.join(", ") || "Driver"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 opacity-80" />
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

          {/* RIGHT: avatar edit + KPIs */}
          <div className="flex flex-col gap-4 md:items-end">
            {/* Avatar edit button */}
            <button
              onClick={() => {
                setEditingAvatar((prev) => !prev);
                setTempAvatar(avatarUrl || "");
              }}
              className="self-end inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#12051a]/80 hover:bg-[#1b1024] border border-[#2c1e3a] text-xs font-medium shadow-sm shadow-black/60 transition-colors"
            >
              <LinkIcon className="w-3.5 h-3.5 text-[#f8cc00]" />
              <span>Edit Avatar</span>
            </button>

            {/* Banner edit button */}
            <button
              onClick={() => {
                setEditingBanner((prev) => !prev);
                setTempBanner(bannerUrl || "");
              }}
              className="self-end inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#12051a]/80 hover:bg-[#1b1024] border border-[#2c1e3a] text-xs font-medium shadow-sm shadow-black/60 transition-colors"
            >
              <ImageIcon className="w-3.5 h-3.5 text-[#9d6bff]" />
              <span>Edit Banner</span>
            </button>

            {/* KPI cards */}
            <div className="grid grid-cols-3 gap-3 w-full md:w-[320px]">
              <HeaderStat
                label="Total Jobs"
                value={safeStats.total_jobs || 0}
                icon={Package}
              />
              <HeaderStat
                label="Distance (km)"
                value={Number(safeStats.total_distance || 0).toLocaleString()}
                icon={TrendingUp}
              />
              <HeaderStat
                label="Total Earnings"
                value={
                  "$" +
                  Number(safeStats.total_income || 0).toLocaleString(
                    undefined,
                    { maximumFractionDigits: 0 }
                  )
                }
                icon={DollarSign}
              />
            </div>
          </div>
        </div>

        {/* Avatar edit area */}
        {editingAvatar && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="relative border-t px-6 py-4"
            style={{
              borderColor: "#2c1e3a",
              backgroundColor: "#12051a",
            }}
          >
            <div className="flex flex-wrap items-center gap-3">
              <LinkIcon className="w-5 h-5 text-purple-200" />
              <input
                type="text"
                placeholder="Paste image URL (e.g., Imgur direct link)"
                value={tempAvatar}
                onChange={(e) => setTempAvatar(e.target.value)}
                className="flex-1 min-w-[200px] px-4 py-2 bg-[#1b1024] border border-[#2c1e3a] rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-200"
              />
              <button
                onClick={handleSaveAvatar}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2 text-sm transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditingAvatar(false);
                  setTempAvatar("");
                }}
                className="px-4 py-2 bg-red-600/90 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
            <p className="text-[11px] text-purple-200 mt-2 ml-8">
              Upload your image to{" "}
              <a
                href="https://imgur.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-white"
              >
                Imgur
              </a>{" "}
              or any image host, then paste the direct link above.
            </p>
          </motion.div>
        )}

        {/* Banner edit area */}
        {editingBanner && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="relative border-t px-6 py-4"
            style={{
              borderColor: "#2c1e3a",
              backgroundColor: "#12051a",
            }}
          >
            <div className="flex flex-wrap items-center gap-3">
              <LinkIcon className="w-5 h-5 text-purple-200" />
              <input
                type="text"
                placeholder="Paste banner image URL (e.g., Imgur direct link)"
                value={tempBanner}
                onChange={(e) => setTempBanner(e.target.value)}
                className="flex-1 min-w-[200px] px-4 py-2 bg-[#1b1024] border border-[#2c1e3a] rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-200"
              />
              <button
                onClick={handleSaveBanner}
                className="px-4 py-2 text-white rounded-lg flex items-center gap-2 text-sm transition-colors"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, #6A0DAD, #f8cc00)",
                }}
              >
                Save
              </button>
              <button
                onClick={handleClearBanner}
                className="px-4 py-2 bg-[#1b1024] border border-[#2c1e3a] text-slate-100 rounded-lg text-sm transition-colors"
              >
                Clear
              </button>
              <button
                onClick={() => {
                  setEditingBanner(false);
                  setTempBanner("");
                }}
                className="px-4 py-2 bg-red-600/90 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
            <p className="text-[11px] text-purple-200 mt-2 ml-8">
              Upload your banner to Imgur or any image host, then paste the
              direct link above.
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* MID GRID: Performance + Job breakdown + Safety + Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT 2/3 */}
        <div className="space-y-6 lg:col-span-2">
          {/* 3 stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Driving Performance */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl p-5 border shadow-lg"
              style={{
                backgroundColor: "#1b1024",
                borderColor: "#2c1e3a",
                boxShadow: "0 0 25px #000",
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <Award className="w-5 h-5 text-[#f8cc00]" />
                <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-100">
                  Driving Performance
                </h2>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs">
                    Completion Rate
                  </span>
                  <span className="text-slate-50 font-semibold">
                    {completionRate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs">
                    Avg. Race Miles
                  </span>
                  <span
                    className={
                      "font-semibold text-xs " +
                      getRaceMilesColor(
                        safeStats.avg_race_percentage || 0
                      )
                    }
                  >
                    {Number(
                      safeStats.avg_race_percentage || 0
                    ).toFixed(1)}
                    %
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs">
                    Avg. Delivery Time
                  </span>
                  <span className="text-slate-50 font-semibold text-xs">
                    {safeStats.avg_delivery_time
                      ? `${Math.floor(
                          safeStats.avg_delivery_time / 60
                        )}m ${safeStats.avg_delivery_time % 60}s`
                      : "N/A"}
                  </span>
                </div>
              </div>

              {/* Completion bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1">
                  <span>Completion</span>
                  <span className="font-mono">
                    {completionRate.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 via-sky-400 to-violet-400 rounded-full"
                    style={{ width: `${Math.min(completionRate, 100)}%` }}
                  />
                </div>
              </div>
            </motion.div>

            {/* Job Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-2xl p-5 border shadow-lg"
              style={{
                backgroundColor: "#1b1024",
                borderColor: "#2c1e3a",
                boxShadow: "0 0 25px #000",
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <Package className="w-5 h-5 text-sky-300" />
                <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-100">
                  Job Breakdown
                </h2>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs">Quick Jobs</span>
                  <span className="text-yellow-400 font-semibold text-xs">
                    {safeStats.total_quick_jobs || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs">Freight Market</span>
                  <span className="text-sky-300 font-semibold text-xs">
                    {(safeStats.total_jobs || 0) -
                      (safeStats.total_quick_jobs || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs">Modded Jobs</span>
                  <span className="text-purple-300 font-semibold text-xs">
                    {safeStats.total_modded_jobs || 0}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Safety Record */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl p-5 border shadow-lg"
              style={{
                backgroundColor: "#1b1024",
                borderColor: "#2c1e3a",
                boxShadow: "0 0 25px #000",
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-100">
                  Safety Record
                </h2>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs">Flagged Jobs</span>
                  <span className="text-red-400 font-semibold text-xs">
                    {safeStats.total_flagged || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs">Clean Jobs</span>
                  <span className="text-emerald-300 font-semibold text-xs">
                    {(safeStats.total_jobs || 0) -
                      (safeStats.total_flagged || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs">Safety Score</span>
                  <span className="text-slate-50 font-semibold text-xs">
                    {safetyScore.toFixed(0)}%
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-yellow-400 rounded-full"
                    style={{ width: `${Math.min(safetyScore, 100)}%` }}
                  />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Achievements */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-2xl p-5 border shadow-lg"
            style={{
              backgroundColor: "#1b1024",
              borderColor: "#2c1e3a",
              boxShadow: "0 0 25px #000",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#f8cc00]" />
                <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-100">
                  Achievements
                </h2>
              </div>
            <span className="text-[11px] text-slate-400">
                {achievements.filter((a) => a.unlocked).length} unlocked
              </span>
            </div>

            {achievements.length === 0 ? (
              <p className="text-xs text-slate-400">
                Achievement system isn&apos;t live yet. Once you wire it in from
                the backend, this will auto-fill from your jobs and mileage.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {achievements.map((a) => (
                  <AchievementCard key={a.id} achievement={a} />
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* RIGHT 1/3 – Earnings summary */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl p-5 border shadow-lg"
            style={{
              backgroundColor: "#1b1024",
              borderColor: "#2c1e3a",
              boxShadow: "0 0 25px #000",
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <DollarSign className="w-5 h-5 text-emerald-300" />
              <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-100">
                Earnings Summary
              </h2>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs">Total Earnings</span>
                <span className="text-emerald-300 font-semibold text-xs">
                  $
                  {Number(safeStats.total_income || 0).toLocaleString(
                    undefined,
                    { maximumFractionDigits: 0 }
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs">
                  Avg. Income / Job
                </span>
                <span className="text-slate-50 font-semibold text-xs">
                  ${avgIncomePerJob.toFixed(0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs">Total Jobs</span>
                <span className="text-slate-100 font-semibold text-xs">
                  {safeStats.total_jobs || 0}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* RECENT JOBS */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl p-6 border shadow-xl"
        style={{
          backgroundColor: "#1b1024",
          borderColor: "#2c1e3a",
          boxShadow: "0 0 30px #000",
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-[#9d6bff]" />
            <h2 className="text-sm md:text-base font-semibold text-slate-100">
              Recent Jobs
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            {recentJobs.length} jobs shown
          </span>
        </div>

        {recentJobs.length > 0 ? (
          <div className="space-y-4">
            {/* ETS2 Section */}
            {jobsByGame.ets2Jobs.length > 0 && (
              <div>
                <button
                  onClick={() => setEts2Expanded(!ets2Expanded)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border transition-colors hover:bg-[#12051a]/60"
                  style={{
                    backgroundColor: "#12051a",
                    borderColor: "#2c1e3a",
                  }}
                >
                  <div className="flex items-center gap-3">
                    {ets2Expanded ? (
                      <ChevronDown className="w-4 h-4 text-sky-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-sky-400" />
                    )}
                    <span className="text-sm font-semibold text-slate-100">
                      Euro Truck Simulator 2
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-900/60 text-sky-200">
                      {jobsByGame.ets2Jobs.length}
                    </span>
                  </div>
                </button>

                <AnimatePresence>
                  {ets2Expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 space-y-3">
                        {jobsByGame.ets2Jobs.map((job) => (
                          <JobCard key={job.id || job.job_number} job={job} getRaceMilesColor={getRaceMilesColor} getModBadge={getModBadge} />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* ATS Section */}
            {jobsByGame.atsJobs.length > 0 && (
              <div>
                <button
                  onClick={() => setAtsExpanded(!atsExpanded)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border transition-colors hover:bg-[#12051a]/60"
                  style={{
                    backgroundColor: "#12051a",
                    borderColor: "#2c1e3a",
                  }}
                >
                  <div className="flex items-center gap-3">
                    {atsExpanded ? (
                      <ChevronDown className="w-4 h-4 text-orange-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-orange-400" />
                    )}
                    <span className="text-sm font-semibold text-slate-100">
                      American Truck Simulator
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-900/60 text-orange-200">
                      {jobsByGame.atsJobs.length}
                    </span>
                  </div>
                </button>

                <AnimatePresence>
                  {atsExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 space-y-3">
                        {jobsByGame.atsJobs.map((job) => (
                          <JobCard key={job.id || job.job_number} job={job} getRaceMilesColor={getRaceMilesColor} getModBadge={getModBadge} />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-10">
            <Package className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">
              No jobs yet. Start driving!
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

/* === SMALL SUBCOMPONENTS === */

function HeaderStat({ label, value, icon: Icon }) {
  return (
    <div
      className="rounded-xl px-3 py-2.5 border shadow-sm"
      style={{
        backgroundColor: "#12051a",
        borderColor: "#2c1e3a",
        boxShadow: "0 0 10px #000",
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-slate-300/80">{label}</span>
        <Icon className="h-3.5 w-3.5 text-[#9d6bff]" />
      </div>
      <div className="mt-1 text-sm font-semibold text-slate-50 truncate">
        {value}
      </div>
    </div>
  );
}

function JobCard({ job, getRaceMilesColor, getModBadge }) {
  return (
    <div
      className="p-4 rounded-xl border transition-colors"
      style={{
        backgroundColor: "#12051a",
        borderColor: "#2c1e3a",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-slate-100">
            {job.cargo_display || "Unknown Cargo"}
          </span>
          {job.is_quick_job && (
            <Zap className="w-4 h-4 text-[#f8cc00]" />
          )}
          {job.mod_source && getModBadge(job.mod_source)}
        </div>
        <div className="flex items-center gap-2">
          <span
            className="font-mono text-xs px-2 py-0.5 rounded"
            style={{
              color: "#f8cc00",
              backgroundColor: "rgba(248, 204, 0, 0.1)"
            }}
          >
            #{job.job_number || job.job_id || "N/A"}
          </span>
          <span
            className={`px-3 py-1 text-[11px] font-semibold rounded-full ${
              job.status === "completed"
                ? "bg-emerald-900 text-emerald-200"
                : job.status === "active"
                ? "bg-sky-900 text-sky-200"
                : "bg-red-900 text-red-200"
            }`}
          >
            {job.status}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-300 mb-3">
        <MapPin className="w-4 h-4" />
        <span>
          {job.pickup_city_display || "Unknown"} →{" "}
          {job.delivery_city_display || "Unknown"}
        </span>
      </div>

      {job.status === "completed" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-slate-800">
          <div>
            <p className="text-[11px] text-slate-500 mb-1">
              Distance
            </p>
            <p className="text-xs font-semibold text-slate-100">
              {Number(job.actual_distance || 0).toFixed(0)} km
            </p>
          </div>
          <div>
            <p className="text-[11px] text-slate-500 mb-1">
              Income
            </p>
            <p className="text-xs font-semibold text-emerald-300">
              $
              {Number(job.total_income || 0).toLocaleString(
                undefined,
                { maximumFractionDigits: 0 }
              )}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-slate-500 mb-1">
              Damage
            </p>
            <p className="text-xs font-semibold text-orange-400">
              {Number(job.damage_percent || 0).toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-[11px] text-slate-500 mb-1">
              Race Miles
            </p>
            <p
              className={
                "text-xs font-semibold " +
                getRaceMilesColor(job.race_percentage)
              }
            >
              {Number(job.race_percentage || 0).toFixed(1)}%
            </p>
          </div>
        </div>
      )}

      {job.status === "cancelled" && (
        <p className="text-xs text-red-400 pt-3 border-t border-slate-800">
          Cancelled:{" "}
          {job.cancel_reason?.replace(/_/g, " ") ||
            "Unknown reason"}
        </p>
      )}

      {job.flagged && (
        <div className="mt-3 p-2 bg-red-950/40 border border-red-800 rounded">
          <p className="text-[11px] text-red-300 font-semibold">
            🚨 Flagged:{" "}
            {job.flag_reasons?.join(", ").replace(/_/g, " ") ||
              "Review required"}
          </p>
        </div>
      )}

      <p className="text-[11px] text-slate-500 mt-3">
        {job.completed_at
          ? `Completed ${new Date(
              job.completed_at
            ).toLocaleString()}`
          : job.started_at
          ? `Started ${new Date(
              job.started_at
            ).toLocaleString()}`
          : ""}
      </p>
    </div>
  );
}

function AchievementCard({ achievement }) {
  const { name, description, rarity, progress, unlocked, unlocked_at } =
    achievement;

  const rarityStyles =
    {
      Common: "bg-[#1b1024] border-[#2c1e3a]",
      Rare: "bg-sky-900/60 border-sky-500/70",
      Epic: "bg-purple-900/60 border-purple-500/80",
      Legendary: "bg-amber-900/70 border-amber-500/80",
    }[rarity] || "bg-[#1b1024] border-[#2c1e3a]";

  return (
    <div
      className={`rounded-xl border px-3 py-3 flex gap-3 items-start shadow-sm shadow-black/60 ${rarityStyles}`}
    >
      <div className="mt-0.5">
        <div className="h-8 w-8 rounded-lg bg-[#12051a] flex items-center justify-center border border-[#2c1e3a]">
          <Star className="h-4 w-4 text-amber-300" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-xs font-semibold text-slate-50 truncate">
              {name}
            </div>
            <div className="text-[11px] text-slate-300 line-clamp-2">
              {description}
            </div>
          </div>
          <span className="text-[10px] uppercase tracking-wide text-slate-300">
            {rarity}
          </span>
        </div>

        <div className="mt-2 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-slate-300">
            <span>{unlocked ? "Completed" : "Progress"}</span>
            <span className="font-mono">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={
                "h-full rounded-full " +
                (unlocked
                  ? "bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500"
                  : "bg-gradient-to-r from-sky-400 via-sky-500 to-violet-500")
              }
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          {unlocked && unlocked_at && (
            <div className="text-[10px] text-slate-400">
              Unlocked {new Date(unlocked_at).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
