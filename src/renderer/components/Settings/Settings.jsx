// src/components/Settings/Settings.jsx
// ✅ FIXED: Save endpoint, removed Appearance tab, added Password Change
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
        type: "success"
      });
    } catch (error) {
      console.error("Failed to save settings:", error);
      await alert({
        title: "Error",
        message: error.response?.data?.error || "Failed to save settings",
        type: "error"
      });
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      await alert({
        title: "Error",
        message: "New passwords do not match",
        type: "error"
      });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      await alert({
        title: "Error",
        message: "Password must be at least 8 characters",
        type: "error"
      });
      return;
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
        type: "success"
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
        type: "error"
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const firstConfirm = await confirm({
      title: "Delete Account?",
      message: `⚠️ This will permanently delete:\n\n• Your account\n• All your jobs\n• Your driver profile\n• ALL your data\n\nThis CANNOT be undone!`,
      confirmText: "Continue",
      cancelText: "Cancel",
      type: "danger"
    });
    
    if (!firstConfirm) return;
    
    const secondConfirm = await confirm({
      title: "Final Confirmation",
      message: `Are you ABSOLUTELY SURE?\n\nYour username: ${user?.username}\n\nThis action is PERMANENT and IRREVERSIBLE.`,
      confirmText: "DELETE EVERYTHING",
      cancelText: "Cancel",
      type: "danger"
    });
    
    if (!secondConfirm) return;

    try {
      await api.delete(`/users/${user.id}`);
      await alert({
        title: "Account Deleted",
        message: "Your account has been permanently deleted. Goodbye.",
        type: "success"
      });
      logout();
    } catch (error) {
      console.error("Failed to delete account:", error);
      await alert({
        title: "Error",
        message: error.response?.data?.error || "Failed to delete account",
        type: "error"
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <SettingsIcon className="w-8 h-8 text-purple-600" />
        <h1 className="text-3xl font-bold text-white">Settings</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? "bg-purple-600 text-white"
                      : "text-gray-400 hover:bg-gray-700 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-3">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-lg border border-gray-700 p-6"
          >
            {/* General Tab */}
            {activeTab === "general" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    General Settings
                  </h2>
                  <p className="text-gray-400">
                    Manage your account preferences
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-gray-900 rounded-lg">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Username
                    </label>
                    <p className="text-white">{user?.username}</p>
                  </div>

                  <div className="p-4 bg-gray-900 rounded-lg">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Your Roles
                    </label>
                    <div className="flex gap-2 flex-wrap">
{user?.roles && (Array.isArray(user.roles) ? user.roles : []).length > 0 ? (
  (Array.isArray(user.roles) ? user.roles : []).map((role) => (
    <span
      key={role}
      className={`px-3 py-1 text-sm font-semibold rounded-full ${
        String(role) === "admin"
          ? "bg-red-900 text-red-200"
          : String(role) === "staff"
          ? "bg-blue-900 text-blue-200"
          : "bg-purple-900 text-purple-200"
      }`}
    >
      {String(role).toUpperCase()}
    </span>
  ))
) : (
  <span className="px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded-full">
    No Role
  </span>
)}
                    </div>
                  </div>

                  <div className="p-4 bg-gray-900 rounded-lg">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email
                    </label>
                    <p className="text-white">{user?.email || "Not set"}</p>
                  </div>

                  <div className="p-4 bg-gray-900 rounded-lg space-y-3">
                    <h3 className="font-medium text-white mb-3">Privacy</h3>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Show Profile</span>
                      <input
                        type="checkbox"
                        checked={settings.privacy.showProfile}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            privacy: {
                              ...settings.privacy,
                              showProfile: e.target.checked,
                            },
                          })
                        }
                        className="w-5 h-5 rounded border-gray-600 text-purple-600 focus:ring-purple-600 focus:ring-offset-gray-800"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Show Statistics</span>
                      <input
                        type="checkbox"
                        checked={settings.privacy.showStats}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            privacy: {
                              ...settings.privacy,
                              showStats: e.target.checked,
                            },
                          })
                        }
                        className="w-5 h-5 rounded border-gray-600 text-purple-600 focus:ring-purple-600 focus:ring-offset-gray-800"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Security Settings
                  </h2>
                  <p className="text-gray-400">
                    Manage your password and account security
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Change Password */}
                  <div className="p-6 bg-gray-900 rounded-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <Lock className="w-6 h-6 text-purple-400" />
                      <h3 className="text-xl font-bold text-white">
                        Change Password
                      </h3>
                    </div>

                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">
                          Current Password
                        </label>
                        <input
                          type="password"
                          value={passwordForm.currentPassword}
                          onChange={(e) =>
                            setPasswordForm({
                              ...passwordForm,
                              currentPassword: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                          required
                          disabled={passwordLoading}
                        />
                      </div>

                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) =>
                            setPasswordForm({
                              ...passwordForm,
                              newPassword: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                          required
                          minLength={8}
                          disabled={passwordLoading}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Must be at least 8 characters
                        </p>
                      </div>

                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) =>
                            setPasswordForm({
                              ...passwordForm,
                              confirmPassword: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                          required
                          minLength={8}
                          disabled={passwordLoading}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={passwordLoading}
                        className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                      >
                        {passwordLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
                  </div>

                  {/* Danger Zone */}
                  <div className="p-6 bg-red-900/20 border-2 border-red-900 rounded-lg space-y-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h3 className="font-bold text-red-400 text-lg mb-2">
                          Danger Zone
                        </h3>
                        <p className="text-gray-300 mb-4">
                          Permanently delete your account and ALL associated
                          data. This action cannot be undone.
                        </p>
                        <p className="text-sm text-gray-400 mb-4">
                          This will delete:
                        </p>
                        <ul className="text-sm text-gray-400 space-y-1 mb-4 list-disc list-inside">
                          <li>Your user account</li>
                          <li>All your jobs and job history</li>
                          <li>Your driver profile and statistics</li>
                          <li>All personal data and preferences</li>
                        </ul>
                        <button
                          onClick={handleDeleteAccount}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                          Delete My Account
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Notification Settings
                  </h2>
                  <p className="text-gray-400">
                    Control what notifications you receive
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-gray-900 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-white font-medium">
                          Job Updates
                        </span>
                        <p className="text-sm text-gray-400">
                          Get notified about job status changes
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.notifications.jobUpdates}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            notifications: {
                              ...settings.notifications,
                              jobUpdates: e.target.checked,
                            },
                          })
                        }
                        className="w-5 h-5 rounded border-gray-600 text-purple-600 focus:ring-purple-600 focus:ring-offset-gray-800"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-white font-medium">
                          System Alerts
                        </span>
                        <p className="text-sm text-gray-400">
                          Important system announcements
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.notifications.systemAlerts}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            notifications: {
                              ...settings.notifications,
                              systemAlerts: e.target.checked,
                            },
                          })
                        }
                        className="w-5 h-5 rounded border-gray-600 text-purple-600 focus:ring-purple-600 focus:ring-offset-gray-800"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-white font-medium">
                          Email Notifications
                        </span>
                        <p className="text-sm text-gray-400">
                          Receive notifications via email
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.notifications.emailNotifications}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            notifications: {
                              ...settings.notifications,
                              emailNotifications: e.target.checked,
                            },
                          })
                        }
                        className="w-5 h-5 rounded border-gray-600 text-purple-600 focus:ring-purple-600 focus:ring-offset-gray-800"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* System Status Tab (Admin only) */}
            {activeTab === "system" && isAdmin() && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    System Status
                  </h2>
                  <p className="text-gray-400">
                    Monitor system health and status
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-purple-900/20 border border-purple-900 rounded-lg">
                    <h3 className="font-medium text-purple-400 mb-2">
                      Administrator Access
                    </h3>
                    <p className="text-sm text-gray-400">
                      You have full administrative privileges.
                    </p>
                  </div>

                  <div className="p-4 bg-gray-900 rounded-lg">
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      System Status
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Backend API</span>
                        <span className="px-3 py-1 text-sm font-semibold rounded-full bg-green-900 text-green-200">
                          ✓ Online
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Database</span>
                        <span className="px-3 py-1 text-sm font-semibold rounded-full bg-green-900 text-green-200">
                          ✓ Connected
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Authentication</span>
                        <span className="px-3 py-1 text-sm font-semibold rounded-full bg-green-900 text-green-200">
                          ✓ Active
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button (except for Security tab) */}
            {activeTab !== "security" && activeTab !== "system" && (
              <div className="mt-6 pt-6 border-t border-gray-700">
                <button
                  onClick={handleSaveSettings}
                  className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
                >
                  <Save className="w-5 h-5" />
                  Save Settings
                </button>
              </div>
            )}

            {/* Check for Updates Button */}
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <h3 className="text-white font-semibold mb-2">
                Application Updates
              </h3>
              <p className="text-gray-400 text-sm mb-3">
                Check for the latest version of Enigma Hub
              </p>
              <button
                onClick={() => window.electronAPI?.checkForUpdates?.()}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                Check for Updates
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}