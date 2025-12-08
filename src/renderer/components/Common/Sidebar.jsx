// src/components/Layout/Sidebar.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  CheckCircle,
  Truck,
  FileText,
  User,
  Download,
  Settings,
  LogOut,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Building2,
  UserCircle,
  Shield,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useModal } from "../../context/ModalContext";
import EnigmaLogo from "../../assets/enigma-logo.svg";
import HolidayIcon from "../../../components/Holiday/HolidayIcon.jsx";
import HolidayLogo from "../../../assets/logo-wreath.png";
import { TextAlignJustify } from "lucide-react";

export default function Sidebar({
  collapsed,
  setCollapsed,
  currentPage,
  setCurrentPage,
}) {
  const { user, logout, isStaff, getRolesString } = useAuth();
  const { confirm } = useModal();
  const [appVersion, setAppVersion] = useState("...");
  const [jobsExpanded, setJobsExpanded] = useState(false);
  const [adminExpanded, setAdminExpanded] = useState(false);

  useEffect(() => {
    // Get app version from Electron
    window.electronAPI
      ?.getAppVersion?.()
      .then((version) => {
        setAppVersion(version);
      })
      .catch(() => {
        setAppVersion("1.0.0");
      });
  }, []);

  const handleLogout = async () => {
    const confirmed = await confirm({
      title: "Logout",
      message: "Are you sure you want to logout?",
      confirmText: "Logout",
      cancelText: "Stay",
      type: "warning",
    });

    if (confirmed) {
      await logout();
    }
  };

  const profilePicture = user?.avatar;

  return (
    <aside
      className={`sidebar ${collapsed ? "w-16" : "w-64"} transition-all duration-300 flex flex-col border-r shadow-xl`}
      style={{
        background: "#0b0c1a", // match auth panel background
        borderColor: "#2d1b5c",
      }}
    >
      {/* Logo + Collapse Button */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "#2d1b5c" }}
      >
        {collapsed ? (
          <HolidayIcon
            defaultSrc={EnigmaLogo}
            holidaySrc={HolidayLogo}
            alt="E"
            className="w-7 h-7 mx-auto"
          />
        ) : (
          <div className="flex items-center gap-2">
            <HolidayIcon
              defaultSrc={EnigmaLogo}
              holidaySrc={HolidayLogo}
              alt="Enigma Hub"
              className="w-6 h-6"
            />
            <div className="flex flex-col">
              <span className="font-semibold text-sm tracking-[0.18em] uppercase text-slate-100">
                Enigma Logistics
              </span>
              <span
                className="text-[11px] font-semibold tracking-wide"
                style={{ color: "#f8cc00" }} // gold accent like TitleBar
              >
                VTC HUB CONTROL
              </span>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-slate-400 hover:text-[#f8cc00] transition-colors"
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <TextAlignJustify className="w-5 h-5" />
        </button>
      </div>

      {/* Nav Items */}
      <nav className="sidebar sidebar-nav flex-1 flex flex-col mt-2 gap-2 overflow-y-auto px-2 pb-4">
        <NavItem
          icon={<LayoutDashboard size={18} />}
          label="Dashboard"
          collapsed={collapsed}
          active={currentPage === "dashboard"}
          onClick={() => setCurrentPage("dashboard")}
        />

        {/* Pending Approvals (staff only, standalone) */}
        {isStaff() && (
          <NavItem
            icon={<CheckCircle size={18} />}
            label="Pending Approvals"
            collapsed={collapsed}
            active={currentPage === "pending-approvals"}
            onClick={() => setCurrentPage("pending-approvals")}
          />
        )}

        {/* Jobs Dropdown - Everyone sees this */}
        <DropdownNavItem
          icon={<Truck size={18} />}
          label="Jobs"
          collapsed={collapsed}
          expanded={jobsExpanded}
          onToggle={() => setJobsExpanded(!jobsExpanded)}
          isActive={currentPage === "my-jobs" || currentPage === "company-jobs"}
        >
          <SubNavItem
            icon={<UserCircle size={16} />}
            label="My Jobs"
            active={currentPage === "my-jobs"}
            onClick={() => {
              setCurrentPage("my-jobs");
              if (collapsed) setJobsExpanded(false);
            }}
          />
          {isStaff() && (
            <SubNavItem
              icon={<Building2 size={16} />}
              label="Company Jobs"
              active={currentPage === "company-jobs"}
              onClick={() => {
                setCurrentPage("company-jobs");
                if (collapsed) setJobsExpanded(false);
              }}
            />
          )}
        </DropdownNavItem>

        {/* Admin Dropdown - Staff only */}
        {isStaff() && (
          <DropdownNavItem
            icon={<Shield size={18} />}
          label="Admin"
          collapsed={collapsed}
          expanded={adminExpanded}
          onToggle={() => setAdminExpanded(!adminExpanded)}
          isActive={
            currentPage === "job-manager" ||
            currentPage === "user-management" ||
            currentPage === "user-roles" ||
            currentPage === "system-logs" ||
            currentPage === "driver-reset"
          }
        >
            <SubNavItem
              icon={<FileText size={16} />}
              label="Job Manager"
              active={currentPage === "job-manager"}
              onClick={() => {
                setCurrentPage("job-manager");
                if (collapsed) setAdminExpanded(false);
              }}
            />
            <SubNavItem
              icon={<Users size={16} />}
              label="User Management"
              active={currentPage === "user-management"}
              onClick={() => {
                setCurrentPage("user-management");
                if (collapsed) setAdminExpanded(false);
              }}
            />
            <SubNavItem
              icon={<Shield size={16} />}
              label="User Roles"
              active={currentPage === "user-roles"}
              onClick={() => {
                setCurrentPage("user-roles");
                if (collapsed) setAdminExpanded(false);
              }}
            />
            <SubNavItem
              icon={<FileText size={16} />}
              label="System Logs"
              active={currentPage === "system-logs"}
              onClick={() => {
                setCurrentPage("system-logs");
                if (collapsed) setAdminExpanded(false);
              }}
            />
            <SubNavItem
              icon={<RotateCcw size={16} />}
              label="Reset Tools"
              active={currentPage === "driver-reset"}
              onClick={() => {
                setCurrentPage("driver-reset");
                if (collapsed) setAdminExpanded(false);
              }}
            />
          </DropdownNavItem>
        )}

        {/* General items - Everyone sees these */}
        <NavItem
          icon={<User size={18} />}
          label="Profile"
          collapsed={collapsed}
          active={currentPage === "profile"}
          onClick={() => setCurrentPage("profile")}
        />
        <NavItem
          icon={<Download size={18} />}
          label="Downloads"
          collapsed={collapsed}
          active={currentPage === "downloads"}
          onClick={() => setCurrentPage("downloads")}
        />
        <NavItem
          icon={<Settings size={18} />}
          label="Settings"
          collapsed={collapsed}
          active={currentPage === "settings"}
          onClick={() => setCurrentPage("settings")}
        />
      </nav>

      {/* User Info + Logout */}
      <div
        className="mt-auto border-t"
        style={{ borderColor: "#2d1b5c" }}
      >
        <div
          className="p-3 border-b"
          style={{ borderColor: "#2d1b5c" }}
        >
          {!collapsed ? (
            <div className="flex items-center gap-3">
              {profilePicture && profilePicture.trim() !== "" ? (
                <img
                  src={profilePicture}
                  alt={user?.username}
                  className="w-10 h-10 rounded-full object-cover border-2"
                  style={{ borderColor: "#f8cc00" }} // gold ring
                  onError={(e) => {
                    e.target.style.display = "none";
                    if (e.target.nextElementSibling) {
                      e.target.nextElementSibling.style.display = "flex";
                    }
                  }}
                />
              ) : null}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-slate-950"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, #6A0DAD, #f8cc00)", // Enigma purple → gold
                  display:
                    profilePicture && profilePicture.trim() !== ""
                      ? "none"
                      : "flex",
                }}
              >
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-100 truncate">
                  {user?.username}
                </p>
                <p className="text-[11px] text-slate-400 uppercase tracking-wide">
                  {getRolesString()}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              {profilePicture && profilePicture.trim() !== "" ? (
                <img
                  src={profilePicture}
                  alt={user?.username}
                  className="w-10 h-10 rounded-full object-cover border-2"
                  style={{ borderColor: "#f8cc00" }}
                  onError={(e) => {
                    e.target.style.display = "none";
                    if (e.target.nextElementSibling) {
                      e.target.nextElementSibling.style.display = "flex";
                    }
                  }}
                />
              ) : null}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-slate-950"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, #6A0DAD, #f8cc00)",
                  display:
                    profilePicture && profilePicture.trim() !== ""
                      ? "none"
                      : "flex",
                }}
              >
                {user?.username?.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 py-3 px-4 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-150"
          title="Logout"
        >
          <LogOut size={18} />
          {!collapsed && (
            <span className="text-sm font-medium tracking-wide">Logout</span>
          )}
        </button>

        {/* Status Bar Footer */}
        {!collapsed ? (
          <div
            className="border-t px-3 py-2 flex items-center justify-between text-[11px]"
            style={{ borderColor: "#2d1b5c" }}
          >
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span className="text-slate-400">Online</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Build</span>
              <span
                className="font-mono font-semibold"
                style={{ color: "#6A0DAD" }} // Enigma purple for version
              >
                {appVersion}
              </span>
            </div>
          </div>
        ) : (
          <div
            className="p-2 text-center border-t"
            style={{ borderColor: "#2d1b5c" }}
          >
            <span className="relative flex h-1.5 w-1.5 mx-auto">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}

function NavItem({ icon, label, collapsed, active, onClick }) {
  return (
    <motion.button
      whileHover={{ x: 5 }}
      onClick={onClick}
      className={`sidebar-item flex items-center gap-3 py-2 px-4 rounded-xl border transition-all duration-150 ${
        active
          ? "text-slate-50 shadow-lg shadow-black/50 border-transparent"
          : "text-slate-400 hover:text-slate-50 hover:border-[#6A0DAD]/60"
      }`}
      style={
        active
          ? {
              backgroundImage:
                "linear-gradient(135deg, #6A0DAD, #f8cc00)", // Enigma purple → gold
            }
          : {
              backgroundColor: "#0f0f20",
              borderColor: "#2d1b5c",
            }
      }
      title={collapsed ? label : undefined}
    >
      <div
        className={`flex items-center justify-center ${
          active ? "text-slate-950" : "text-slate-300"
        }`}
      >
        {icon}
      </div>
      {!collapsed && (
        <span className="text-sm font-medium tracking-wide">{label}</span>
      )}
    </motion.button>
  );
}

function DropdownNavItem({ icon, label, collapsed, expanded, onToggle, isActive, children }) {
  return (
    <div>
      <motion.button
        whileHover={{ x: 5 }}
        onClick={onToggle}
        className={`sidebar-item flex items-center gap-3 py-2 px-4 rounded-xl border transition-all duration-150 w-full ${
          isActive
            ? "text-slate-50 shadow-lg shadow-black/50 border-transparent"
            : "text-slate-400 hover:text-slate-50 hover:border-[#6A0DAD]/60"
        }`}
        style={
          isActive
            ? {
                backgroundImage:
                  "linear-gradient(135deg, #6A0DAD, #f8cc00)",
              }
            : {
                backgroundColor: "#0f0f20",
                borderColor: "#2d1b5c",
              }
        }
        title={collapsed ? label : undefined}
      >
        <div
          className={`flex items-center justify-center ${
            isActive ? "text-slate-950" : "text-slate-300"
          }`}
        >
          {icon}
        </div>
        {!collapsed && (
          <>
            <span className="text-sm font-medium tracking-wide flex-1 text-left">
              {label}
            </span>
            {expanded ? (
              <ChevronDown size={16} className={isActive ? "text-slate-950" : "text-slate-400"} />
            ) : (
              <ChevronRight size={16} className={isActive ? "text-slate-950" : "text-slate-400"} />
            )}
          </>
        )}
      </motion.button>

      <AnimatePresence>
        {expanded && !collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="ml-4 mt-1 space-y-1 border-l-2 border-[#2d1b5c] pl-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SubNavItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 py-1.5 px-3 rounded-lg transition-all duration-150 w-full text-left ${
        active
          ? "bg-[#6A0DAD]/30 text-slate-50 border border-[#6A0DAD]/50"
          : "text-slate-400 hover:text-slate-50 hover:bg-[#0f0f20]"
      }`}
    >
      <div className={`flex items-center justify-center ${active ? "text-slate-50" : "text-slate-400"}`}>
        {icon}
      </div>
      <span className="text-xs font-medium tracking-wide">{label}</span>
    </button>
  );
}
