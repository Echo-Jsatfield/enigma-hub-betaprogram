// src/components/Admin/UserManagement.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Search, Edit, Trash2, Shield, X, Save, Lock, AlertTriangle } from "lucide-react";
import api from "../../services/api";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    username: "",
    email: "",
    roles: [],
    approved: false,
    suspended: false,
  });

  const AVAILABLE_ROLES = [
    { value: "admin", label: "Admin", color: "red" },
    { value: "staff", label: "Staff", color: "blue" },
    { value: "driver", label: "Driver", color: "purple" },
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get("/admin/users");
      setUsers(response.data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user.id);
    setEditForm({
      username: user.username,
      email: user.email || "",
      roles: user.roles || [],
      approved: user.approved,
      suspended: user.suspended,
    });
  };

  const handleRoleToggle = (roleValue) => {
    setEditForm((prev) => {
      const roles = prev.roles || [];
      if (roles.includes(roleValue)) {
        return { ...prev, roles: roles.filter((r) => r !== roleValue) };
      } else {
        return { ...prev, roles: [...roles, roleValue] };
      }
    });
  };

  const handleSave = async () => {
    try {
      if (!editForm.roles || editForm.roles.length === 0) {
        alert("User must have at least one role!");
        return;
      }

      await api.put(`/admin/users/${editingUser}`, editForm);
      await fetchUsers();
      setEditingUser(null);
    } catch (error) {
      console.error("Failed to update user:", error);
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      await api.delete(`/admin/users/${userId}`);
      await fetchUsers();
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  };

  const handleResetPassword = async () => {
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    try {
      setPasswordLoading(true);
      await api.post(`/users/admin/${resetPasswordUser.id}/reset-password`, { newPassword });
      alert(`Password reset successfully for ${resetPasswordUser.username}`);
      setResetPasswordUser(null);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setPasswordError(error.response?.data?.error || error.message || "Failed to reset password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.roles?.some(role => role.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getRoleBadgeColor = (role) => {
    const roleConfig = AVAILABLE_ROLES.find((r) => r.value === role);
    return roleConfig?.color || "gray";
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-white">User Management</h1>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search users by name, email, or role..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
        />
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Roles
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-750 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-white font-medium">{user.username}</div>
                        <div className="text-gray-400 text-sm">ID: {user.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-300">{user.email || "—"}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {user.roles?.map((role) => (
                        <span
                          key={role}
                          className={`px-2 py-1 text-xs font-medium rounded-full bg-${getRoleBadgeColor(role)}-900/30 text-${getRoleBadgeColor(role)}-400 border border-${getRoleBadgeColor(role)}-700`}
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${user.approved ? 'bg-green-900/30 text-green-400 border border-green-700' : 'bg-yellow-900/30 text-yellow-400 border border-yellow-700'}`}>
                        {user.approved ? "Approved" : "Pending"}
                      </span>
                      {user.suspended && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-900/30 text-red-400 border border-red-700">
                          Suspended
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Edit user"
                      >
                        <Edit className="w-4 h-4 text-blue-400" />
                      </button>
                      <button
                        onClick={() => setResetPasswordUser(user)}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Reset password"
                      >
                        <Lock className="w-4 h-4 text-yellow-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {editingUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setEditingUser(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Edit User</h2>
                <button
                  onClick={() => setEditingUser(null)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) =>
                      setEditForm({ ...editForm, username: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm({ ...editForm, email: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Roles (Select at least one)
                  </label>
                  <div className="space-y-2">
                    {AVAILABLE_ROLES.map((role) => (
                      <label
                        key={role.value}
                        className="flex items-center gap-3 p-3 bg-gray-900 rounded-lg hover:bg-gray-750 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={editForm.roles?.includes(role.value) || false}
                          onChange={() => handleRoleToggle(role.value)}
                          className="w-5 h-5 rounded border-gray-600 text-purple-600 focus:ring-purple-600 focus:ring-offset-gray-800"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Shield className={`w-4 h-4 text-${role.color}-400`} />
                            <span className="text-white font-medium">
                              {role.label}
                            </span>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  {(!editForm.roles || editForm.roles.length === 0) && (
                    <p className="text-red-400 text-sm mt-2">
                      ⚠️ At least one role is required
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                  <span className="text-gray-300">Approved</span>
                  <input
                    type="checkbox"
                    checked={editForm.approved}
                    onChange={(e) =>
                      setEditForm({ ...editForm, approved: e.target.checked })
                    }
                    className="w-5 h-5 rounded border-gray-600 text-green-600 focus:ring-green-600 focus:ring-offset-gray-800"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                  <span className="text-gray-300">Suspended</span>
                  <input
                    type="checkbox"
                    checked={editForm.suspended}
                    onChange={(e) =>
                      setEditForm({ ...editForm, suspended: e.target.checked })
                    }
                    className="w-5 h-5 rounded border-gray-600 text-red-600 focus:ring-red-600 focus:ring-offset-gray-800"
                  />
                </div>

                <button
                  onClick={handleSave}
                  disabled={!editForm.roles || editForm.roles.length === 0}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
                >
                  <Save className="w-5 h-5" />
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {resetPasswordUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setResetPasswordUser(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Lock className="w-6 h-6 text-yellow-400" />
                  <h2 className="text-2xl font-bold text-white">Reset Password</h2>
                </div>
                <button
                  onClick={() => setResetPasswordUser(null)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="flex items-start gap-3 p-4 bg-yellow-900/20 border border-yellow-800 rounded-lg mb-4">
                <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-yellow-200 font-semibold mb-1">
                    Admin Action
                  </p>
                  <p className="text-xs text-yellow-300">
                    You are resetting the password for{" "}
                    <span className="font-semibold">{resetPasswordUser.username}</span>. 
                    This action will be logged.
                  </p>
                </div>
              </div>

              {passwordError && (
                <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg mb-4">
                  <p className="text-sm text-red-200">{passwordError}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                    placeholder="Enter new password (min 8 characters)"
                    disabled={passwordLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                    placeholder="Confirm new password"
                    disabled={passwordLoading}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleResetPassword}
                    disabled={passwordLoading}
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                  >
                    {passwordLoading ? "Resetting..." : "Reset Password"}
                  </button>
                  <button
                    onClick={() => setResetPasswordUser(null)}
                    disabled={passwordLoading}
                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}