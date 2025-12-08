// src/components/Settings/Settings.jsx
// FIXED: Password autocomplete issue

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Bell,
  Save,
  Trash2,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useModal } from "../../context/ModalContext";
import api from "../../services/api";

export default function Settings() {
  const { user, logout, isAdmin } = useAuth();
  const { confirm, alert } = useModal();
  const [activeTab, setActiveTab] = useState("general");

  const PURPLE = "#6A0DAD";

  const [settings, setSettings] = useState({
    notifications: {
      jobUpdates: true,
      systemAlerts: true,
      emailNotifications: false,
    },
    privacy: {
      showProfile: true,
      showStats: true,
    },
  });

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [checkingUpdates, setCheckingUpdates] = useState(false);

  const tabs = [
    { id: "general", label: "General", icon: User },
    { id: "security", label: "Security", icon: Lock },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  if (isAdmin()) {
    tabs.push({ id: "system", label: "System Status", icon: Shield });
  }

  const handleSaveSettings = async () => {
    try {
      await api.put("/users/me/settings", settings);
      await alert({
        title: "Success!",
        message: "Settings saved successfully!",
        type: "success",
      });
    } catch (error) {
      await alert({
        title: "Error",
        message: error.response?.data?.error || "Failed to save settings",
        type: "error",
      });
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return alert({
        title: "Error",
        message: "New passwords do not match",
        type: "error",
      });
    }
    if (passwordForm.newPassword.length < 8) {
      return alert({
        title: "Error",
        message: "Password must be at least 8 characters",
        type: "error",
      });
    }

    try {
      setPasswordLoading(true);

      await api.put("/users/me/password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      await alert({
        title: "Success!",
        message: "Password changed successfully!",
        type: "success",
      });

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      await alert({
        title: "Error",
        message: error.response?.data?.error || "Failed to change password",
        type: "error",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleCheckForUpdates = async () => {
    if (!window.electronAPI?.checkForUpdates) {
      return alert({
        title: "Unavailable",
        message: "Update checking only works in the desktop app.",
        type: "info",
      });
    }

    try {
      setCheckingUpdates(true);
      await window.electronAPI.checkForUpdates();

      setTimeout(() => {
        alert({
          title: "Done!",
          message:
            "Update check finished. If a new version exists, you'll be notified.",
          type: "success",
        });
        setCheckingUpdates(false);
      }, 1000);
    } catch (error) {
      await alert({
        title: "Error",
        message: "Failed to check for updates.",
        type: "error",
      });
      setCheckingUpdates(false);
    }
  };

  const handleDeleteAccount = async () => {
    const first = await confirm({
      title: "Delete Account?",
      message: `⚠️ This will permanently delete EVERYTHING.\n\nThis CANNOT be undone.`,
      confirmText: "Continue",
      type: "danger",
    });

    if (!first) return;

    const second = await confirm({
      title: "Final Confirmation",
      message: `Delete user: ${user?.username}\n\nThis is irreversible.`,
      confirmText: "DELETE EVERYTHING",
      type: "danger",
    });

    if (!second) return;

    try {
      await api.delete(`/users/${user.id}`);
      await alert({
        title: "Account Deleted",
        message: "Your account has been permanently removed.",
        type: "success",
      });
      logout();
    } catch (error) {
      await alert({
        title: "Error",
        message: error.response?.data?.error || "Failed to delete account",
        type: "error",
      });
    }
  };

  return (
    <div className="settings-page p-6 space-y-6 min-h-full bg-gradient-to-b from-[#12051a] to-[#1a0927]">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center shadow-md"
          style={{
            backgroundColor: "#1e0b29",
            border: `1px solid ${PURPLE}90`,
            boxShadow: `0 0 18px ${PURPLE}50`,
          }}
        >
          <SettingsIcon className="w-6 h-6" style={{ color: PURPLE }} />
        </div>

        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Settings
          </h1>
          <p className="text-sm text-slate-400">
            Manage your account, security, notifications, and preferences.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1">
          <div
            className="card settings-nav rounded-2xl p-2 shadow-lg"
            style={{
              backgroundColor: "#14071d",
              border: "1px solid #2a0c3f",
              boxShadow: "0 0 25px #000",
            }}
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? "text-white shadow-md"
                      : "text-slate-300 hover:text-white"
                  }`}
                  style={{
                    background: active
                      ? `linear-gradient(90deg, ${PURPLE}, #4a0a7d)`
                      : "transparent",
                  }}
                >
                  <Icon
                    className="w-5 h-5"
                    style={{
                      color: active ? "white" : "#9874a8",
                    }}
                  />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="card settings-panel rounded-2xl p-6 shadow-lg"
            style={{
              backgroundColor: "#14071d",
              border: "1px solid #2a0c3f",
            }}
          >
            {activeTab === "general" && (
              <GeneralTab
                user={user}
                settings={settings}
                setSettings={setSettings}
              />
            )}

            {activeTab === "security" && (
              <SecurityTab
                passwordForm={passwordForm}
                setPasswordForm={setPasswordForm}
                passwordLoading={passwordLoading}
                handlePasswordChange={handlePasswordChange}
                handleDeleteAccount={handleDeleteAccount}
              />
            )}

            {activeTab === "notifications" && (
              <NotificationsTab settings={settings} setSettings={setSettings} />
            )}

            {activeTab === "system" && <SystemStatusTab />}

            {(activeTab === "general" || activeTab === "notifications") && (
              <button
                onClick={handleSaveSettings}
                className="w-full mt-6 px-6 py-3 rounded-xl text-white font-medium flex items-center justify-center gap-2 shadow-md"
                style={{
                  background: "linear-gradient(90deg, #6A0DAD, #f8cc00)",
                }}
              >
                <Save className="w-4 h-4" />
                Save Settings
              </button>
            )}

            {activeTab === "system" && (
              <button
                onClick={handleCheckForUpdates}
                disabled={checkingUpdates}
                className="w-full mt-6 px-6 py-3 rounded-xl text-white font-medium flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                style={{
                  background: "linear-gradient(90deg, #6A0DAD, #f8cc00)",
                }}
              >
                {checkingUpdates ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-b-2 border-white" />
                    Checking...
                  </span>
                ) : (
                  "Check for Updates"
                )}
              </button>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// GENERAL TAB
function GeneralTab({ user, settings, setSettings }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">General Settings</h2>

      <Section title="Username">
        <p className="text-sm text-slate-300">{user?.username}</p>
      </Section>

      <Section title="Roles">
        <div className="flex gap-2 flex-wrap">
          {(user?.roles || []).map((role) => (
            <span
              key={role}
              className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-900/50 border border-purple-700 text-purple-200"
            >
              {String(role).toUpperCase()}
            </span>
          ))}
        </div>
      </Section>

      <Section title="Email">
        <p className="text-sm text-slate-300">{user?.email || "Not set"}</p>
      </Section>

      <Section title="Privacy">
        <ToggleRow
          label="Show Profile"
          checked={settings.privacy.showProfile}
          onChange={(v) =>
            setSettings({
              ...settings,
              privacy: { ...settings.privacy, showProfile: v },
            })
          }
        />

        <ToggleRow
          label="Show Statistics"
          checked={settings.privacy.showStats}
          onChange={(v) =>
            setSettings({
              ...settings,
              privacy: { ...settings.privacy, showStats: v },
            })
          }
        />
      </Section>
    </div>
  );
}

// SECURITY TAB - FIXED PASSWORD INPUTS
function SecurityTab({
  passwordForm,
  setPasswordForm,
  passwordLoading,
  handlePasswordChange,
  handleDeleteAccount,
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">Security Settings</h2>

      {/* Change Password */}
      <Section title="Change Password">
        <form onSubmit={handlePasswordChange} className="space-y-4">
          {/* FIXED: Added name and autoComplete attributes */}
          <InputRow
            label="Current Password"
            type="password"
            name="current-password"
            autoComplete="current-password"
            value={passwordForm.currentPassword}
            onChange={(v) =>
              setPasswordForm({ ...passwordForm, currentPassword: v })
            }
            disabled={passwordLoading}
            placeholder="Enter current password"
          />

          <InputRow
            label="New Password"
            type="password"
            name="new-password"
            autoComplete="new-password"
            minLength={8}
            value={passwordForm.newPassword}
            onChange={(v) =>
              setPasswordForm({ ...passwordForm, newPassword: v })
            }
            disabled={passwordLoading}
            placeholder="Enter new password (min 8 characters)"
          />

          <InputRow
            label="Confirm New Password"
            type="password"
            name="confirm-password"
            autoComplete="new-password"
            minLength={8}
            value={passwordForm.confirmPassword}
            onChange={(v) =>
              setPasswordForm({ ...passwordForm, confirmPassword: v })
            }
            disabled={passwordLoading}
            placeholder="Confirm new password"
          />

          <button
            type="submit"
            className="w-full px-6 py-3 rounded-xl text-white font-medium flex items-center justify-center gap-2 shadow-md"
            style={{
              background: "linear-gradient(90deg, #6A0DAD, #f8cc00)",
            }}
            disabled={passwordLoading}
          >
            {passwordLoading ? (
              <>
                <div className="animate-spin h-4 w-4 border-b-2 border-white" />
                Changing Password...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Change Password
              </>
            )}
          </button>
        </form>
      </Section>

      {/* Danger Zone */}
      <DangerZone handleDeleteAccount={handleDeleteAccount} />
    </div>
  );
}

// NOTIFICATIONS TAB
function NotificationsTab({ settings, setSettings }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">Notification Settings</h2>

      <Section title="Job Notifications">
        <ToggleRow
          label="Job Updates"
          sub="Get notified about job status changes."
          checked={settings.notifications.jobUpdates}
          onChange={(v) =>
            setSettings({
              ...settings,
              notifications: { ...settings.notifications, jobUpdates: v },
            })
          }
        />

        <ToggleRow
          label="System Alerts"
          sub="Important system messages and announcements."
          checked={settings.notifications.systemAlerts}
          onChange={(v) =>
            setSettings({
              ...settings,
              notifications: { ...settings.notifications, systemAlerts: v },
            })
          }
        />

        <ToggleRow
          label="Email Notifications"
          sub="Receive updates via email (if configured)."
          checked={settings.notifications.emailNotifications}
          onChange={(v) =>
            setSettings({
              ...settings,
              notifications: {
                ...settings.notifications,
                emailNotifications: v,
              },
            })
          }
        />
      </Section>
    </div>
  );
}

// SYSTEM TAB
function SystemStatusTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">System Status</h2>

      <Section title="Backend">
        <StatusRow label="API" status="Online" />
        <StatusRow label="Database" status="Connected" />
        <StatusRow label="Authentication" status="Active" />
      </Section>
    </div>
  );
}

/* ---------- UI COMPONENT HELPERS ---------- */

function Section({ title, children }) {
  return (
    <div
      className="card settings-section p-4 rounded-2xl space-y-3"
      style={{
        backgroundColor: "#11061a",
        border: "1px solid #2a0c3f",
      }}
    >
      <h3 className="text-sm font-semibold text-purple-200 mb-1">{title}</h3>
      {children}
    </div>
  );
}

// FIXED: InputRow with proper autocomplete handling
function InputRow({ label, onChange, ...props }) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1">{label}</label>
      <input
        {...props}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 bg-[#0d0413] border border-[#2a0c3f] rounded-xl text-sm text-white focus:border-purple-600 outline-none"
      />
    </div>
  );
}

function ToggleRow({ label, sub, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <span className="text-sm text-white">{label}</span>
        {sub && <p className="text-xs text-slate-400">{sub}</p>}
      </div>

      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-5 h-5 rounded border-slate-600 text-purple-600 focus:ring-purple-500 focus:ring-offset-slate-900"
      />
    </div>
  );
}

function StatusRow({ label, status }) {
  return (
    <div className="flex items-center justify-between text-sm text-slate-200">
      <span>{label}</span>
      <span className="px-3 py-1 rounded-full bg-emerald-900/70 text-emerald-300 text-xs">
        ✓ {status}
      </span>
    </div>
  );
}

function DangerZone({ handleDeleteAccount }) {
  return (
    <div className="p-6 rounded-2xl border border-red-800 bg-red-950/30 space-y-2">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-6 h-6 text-red-400" />
        <div className="flex-1">
          <h3 className="font-semibold text-red-300 text-lg">Danger Zone</h3>
          <p className="text-sm text-red-200/80 mb-4">
            Permanently delete your account and ALL associated data.
          </p>

          <button
            onClick={handleDeleteAccount}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-all shadow-md shadow-red-900/60"
          >
            <Trash2 className="w-4 h-4 inline-block mr-2" /> Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
