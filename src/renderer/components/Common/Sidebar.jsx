// src/components/Layout/Sidebar.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useModal } from "../../context/ModalContext";
import EnigmaLogo from '../../assets/enigma-logo.svg';
import { TextAlignJustify } from 'lucide-react';


export default function Sidebar({ collapsed, setCollapsed, currentPage, setCurrentPage }) {
  const { user, logout, isStaff, getRolesString } = useAuth();
  const { confirm } = useModal();
  const [appVersion, setAppVersion] = useState('...');

  useEffect(() => {
    // Get app version from Electron
    window.electronAPI?.getAppVersion?.().then(version => {
      setAppVersion(version);
    }).catch(() => {
      setAppVersion('1.0.0');
    });
  }, []);

  const handleLogout = async () => {
    const confirmed = await confirm({
      title: "Logout",
      message: "Are you sure you want to logout?",
      confirmText: "Logout",
      cancelText: "Stay",
      type: "warning"
    });
    
    if (confirmed) {
      await logout();
    }
  };

  const profilePicture = user?.avatar;

  return (
    <aside
      className={`${
        collapsed ? "w-16" : "w-64"
      } bg-[#1b1024]/90 border-r border-[#2c1e3a] transition-all duration-300 flex flex-col backdrop-blur-md`}
    >
      {/* Logo + Collapse Button */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2c1e3a]">
        {collapsed ? (
          <img src={EnigmaLogo} alt="E" className="w-7 h-7 mx-auto" />
        ) : (
          <div className="flex items-center gap-2">
            <img src={EnigmaLogo} alt="Enigma Hub" className="w-6 h-6" />
            <span className="font-semibold text-lg text-yellow-400 tracking-wide">
              ENIGMA HUB
            </span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-400 hover:text-yellow-400 transition"
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <TextAlignJustify className="w-5 h-5" />
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex flex-col mt-2 gap-1">
        <NavItem
          icon={<LayoutDashboard size={18} />}
          label="Dashboard"
          collapsed={collapsed}
          active={currentPage === "dashboard"}
          onClick={() => setCurrentPage("dashboard")}
        />

        {/* ===== ADMIN/STAFF ONLY ITEMS ===== */}
        {isStaff() && (
          <>
            <NavItem
              icon={<CheckCircle size={18} />}
              label="Pending Approvals"
              collapsed={collapsed}
              active={currentPage === "pending-approvals"}
              onClick={() => setCurrentPage("pending-approvals")}
            />
            <NavItem
              icon={<Users size={18} />}
              label="User Management"
              collapsed={collapsed}
              active={currentPage === "user-management"}
              onClick={() => setCurrentPage("user-management")}
            />
            <NavItem
              icon={<RotateCcw size={18} />}
              label="Reset Tools"
              collapsed={collapsed}
              active={currentPage === "driver-reset"}
              onClick={() => setCurrentPage("driver-reset")}
            />
            <NavItem
              icon={<FileText size={18} />}
              label="System Logs"
              collapsed={collapsed}
              active={currentPage === "system-logs"}
              onClick={() => setCurrentPage("system-logs")}
            />
          </>
        )}
        {/* ===== END ADMIN SECTION ===== */}

        {/* General items - Everyone sees these */}
        <NavItem
          icon={<Truck size={18} />}
          label="Jobs"
          collapsed={collapsed}
          active={currentPage === "jobs"}
          onClick={() => setCurrentPage("jobs")}
        />
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
      <div className="mt-auto border-t border-[#2c1e3a]">
        <div className="p-3 border-b border-[#2c1e3a]">
          {!collapsed ? (
            <div className="flex items-center gap-3">
              {profilePicture && profilePicture.trim() !== "" ? (
                <img
                  src={profilePicture}
                  alt={user?.username}
                  className="w-10 h-10 rounded-full object-cover border-2 border-[#f8cc00]"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextElementSibling.style.display = "flex";
                  }}
                />
              ) : null}
              <div
                className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f8cc00] to-[#6d28d9] flex items-center justify-center text-white font-bold"
                style={{
                  display:
                    profilePicture && profilePicture.trim() !== ""
                      ? "none"
                      : "flex",
                }}
              >
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200 truncate">
                  {user?.username}
                </p>
                <p className="text-xs text-gray-500 uppercase">
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
                  className="w-10 h-10 rounded-full object-cover border-2 border-[#f8cc00]"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextElementSibling.style.display = "flex";
                  }}
                />
              ) : null}
              <div
                className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f8cc00] to-[#6d28d9] flex items-center justify-center text-white font-bold"
                style={{
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
          {!collapsed && <span>Logout</span>}
        </button>

        {/* Fancy Status Bar Footer */}
        {!collapsed ? (
          <div className="border-t border-[#2c1e3a]">
            <div className="flex items-center justify-between px-3 py-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-gray-500">Online</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-gray-500">Build</span>
                <span className="text-purple-400 font-mono font-semibold">{appVersion}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-2 text-center border-t border-[#2c1e3a]">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse mx-auto" />
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
      className={`flex items-center gap-3 py-2 px-4 transition-all duration-150 ${
        active
          ? "bg-[#f8cc00] text-[#18122b]"
          : "text-gray-400 hover:text-yellow-400 hover:bg-[#2a1b3a]"
      }`}
      title={collapsed ? label : undefined}
    >
      {icon}
      {!collapsed && <span>{label}</span>}
    </motion.button>
  );
}