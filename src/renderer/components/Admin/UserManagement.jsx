// src/components/Admin/UserManagement.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Search,
  Edit,
  Trash2,
  Shield,
  X,
  Save,
  Lock,
  AlertTriangle,
  UserPlus,
  Copy,
  CheckCircle,
  User as UserIcon,
  RefreshCw,
} from "lucide-react";
import api from "../../services/api";
import RoleSelector from '../Common/RoleSelector';
import { RoleBadges } from '../Common/RoleBadge';
import { usePermissions } from '../hooks/usePermissions';

export default function UserManagement() {
  const { hasPermission, hasAnyPermission } = usePermissions();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [approvalFilter, setApprovalFilter] = useState("all");
  const [suspendedFilter, setSuspendedFilter] = useState("all");
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

  // Add Driver Modal State
  const [showAddDriverModal, setShowAddDriverModal] = useState(false);
  const [addDriverForm, setAddDriverForm] = useState({
    username: "",
    email: "",
    steamId: "",
  });
  const [inviteCode, setInviteCode] = useState("");
  const [addDriverLoading, setAddDriverLoading] = useState(false);
  const [addDriverError, setAddDriverError] = useState("");
  const [codeCopied, setCodeCopied] = useState(false);

  // Create User Directly Modal State
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [createUserForm, setCreateUserForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    discord_id: "",
    steam_id: "",
    roles: ["driver"],
  });
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [createUserError, setCreateUserError] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
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

  const handleSave = async () => {
    try {
      if (!editForm.roles || editForm.roles.length === 0) {
        alert("User must have at least one role!");
        return;
      }

      await api.put(`/admin/users/${editingUser}`, editForm);

      // Log the action
      await api.post("/admin/system-logs", {
        action: "USER_UPDATE",
        target_user: editForm.username,
        details: `Updated user: ${editForm.username}`,
      });

      await fetchUsers();
      setEditingUser(null);
    } catch (error) {
      console.error("Failed to update user:", error);
      alert("Failed to update user");
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await api.delete(`/users/${userId}`);
      await fetchUsers();
    } catch (error) {
      console.error("Failed to delete user:", error);
      alert("Failed to delete user");
    }
  };

  const handlePasswordReset = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    setPasswordLoading(true);
    setPasswordError("");

    try {
      await api.post(`/users/admin/${resetPasswordUser.id}/reset-password`, {
        newPassword,
      });

      alert(`Password reset successfully for ${resetPasswordUser.username}`);
      setResetPasswordUser(null);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Failed to reset password:", error);
      setPasswordError(error.response?.data?.error || "Failed to reset password");
    } finally {
      setPasswordLoading(false);
    }
  };

  // Add Driver
  const handleAddDriver = async (e) => {
    e.preventDefault();
    setAddDriverLoading(true);
    setAddDriverError("");

    try {
      const response = await api.post("/admin/invite-driver", addDriverForm);
      setInviteCode(response.data.invite_code);
      setAddDriverForm({ username: "", email: "", steamId: "" });
    } catch (error) {
      console.error("Failed to invite driver:", error);
      setAddDriverError(
        error.response?.data?.error || "Failed to create invite"
      );
    } finally {
      setAddDriverLoading(false);
    }
  };

  const copyInviteCode = () => {
    if (window.electronAPI?.copyToClipboard) {
      window.electronAPI.copyToClipboard(inviteCode);
    } else {
      navigator.clipboard.writeText(inviteCode);
    }
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  // Create User Directly
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateUserLoading(true);
    setCreateUserError("");

    if (createUserForm.password !== createUserForm.confirmPassword) {
      setCreateUserError("Passwords do not match");
      setCreateUserLoading(false);
      return;
    }

    if (createUserForm.password.length < 8) {
      setCreateUserError("Password must be at least 8 characters");
      setCreateUserLoading(false);
      return;
    }

    if (!createUserForm.steam_id) {
      setCreateUserError("Steam ID is required");
      setCreateUserLoading(false);
      return;
    }

    try {
      await api.post("/admin/users", {
        username: createUserForm.username,
        email: createUserForm.email,
        password: createUserForm.password,
        discord_id: createUserForm.discord_id,
        steam_id: createUserForm.steam_id,
        roles: createUserForm.roles,
      });

      await fetchUsers();
      setShowCreateUserModal(false);
      setCreateUserForm({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        discord_id: "",
        steam_id: "",
        roles: ["driver"],
      });
    } catch (error) {
      console.error("Failed to create user:", error);
      setCreateUserError(
        error.response?.data?.error || "Failed to create user"
      );
    } finally {
      setCreateUserLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.steam_id && user.steam_id.includes(searchTerm)) ||
      (user.discord_id && user.discord_id.includes(searchTerm));

    const matchesRole = !roleFilter || user.roles?.includes(roleFilter);

    const matchesApproval =
      approvalFilter === "all" ||
      (approvalFilter === "approved" && user.approved) ||
      (approvalFilter === "pending" && !user.approved);

    const matchesSuspended =
      suspendedFilter === "all" ||
      (suspendedFilter === "active" && !user.suspended) ||
      (suspendedFilter === "suspended" && user.suspended);

    return matchesSearch && matchesRole && matchesApproval && matchesSuspended;
  });

  const stats = {
    total: users.length,
    approved: users.filter((u) => u.approved).length,
    pending: users.filter((u) => !u.approved).length,
    suspended: users.filter((u) => u.suspended).length,
  };

  return (
    <div className="p-6 space-y-6 min-h-full bg-gradient-to-b from-[#12051a] to-[#1a0927]">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center shadow-md"
            style={{
              backgroundColor: "#1e0b29",
              border: "1px solid #6A0DAD90",
              boxShadow: "0 0 18px #6A0DAD50",
            }}
          >
            <Users className="w-6 h-6" style={{ color: "#6A0DAD" }} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              User Management
            </h1>
            <p className="text-sm text-slate-400">
              Manage user accounts, roles, and permissions
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          {hasPermission('users.create') && (
            <>
              <button
                onClick={() => setShowAddDriverModal(true)}
                className="px-4 py-2 bg-[#14071d] hover:bg-[#1e0b29] border border-[#2a0c3f] text-white rounded-xl flex items-center gap-2 transition-all hover:border-[#6A0DAD]"
              >
                <UserPlus className="w-4 h-4" />
                Add Driver
              </button>
              <button
                onClick={() => setShowCreateUserModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-[#6A0DAD] to-[#8b5cf6] hover:from-[#7b1ec9] hover:to-[#9c6dff] text-white rounded-xl flex items-center gap-2 transition-all font-medium shadow-lg shadow-purple-900/50"
              >
                <UserPlus className="w-4 h-4" />
                Create User
              </button>
            </>
          )}
          <button
            onClick={fetchUsers}
            className="p-2 bg-[#14071d] hover:bg-[#1e0b29] border border-[#2a0c3f] text-white rounded-xl transition-all hover:border-[#6A0DAD]"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Users" value={stats.total} color="#6A0DAD" />
        <StatCard label="Approved" value={stats.approved} color="#10b981" />
        <StatCard label="Pending" value={stats.pending} color="#f59e0b" />
        <StatCard label="Suspended" value={stats.suspended} color="#ef4444" />
      </div>

      {/* FILTERS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-[#14071d] border border-[#2a0c3f] rounded-xl text-white placeholder-gray-400 focus:border-purple-600 outline-none"
          />
        </div>

        <select
          value={approvalFilter}
          onChange={(e) => setApprovalFilter(e.target.value)}
          className="px-4 py-3 bg-[#14071d] border border-[#2a0c3f] rounded-xl text-white focus:border-purple-600 outline-none"
        >
          <option value="all">All Status</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
        </select>

        <select
          value={suspendedFilter}
          onChange={(e) => setSuspendedFilter(e.target.value)}
          className="px-4 py-3 bg-[#14071d] border border-[#2a0c3f] rounded-xl text-white focus:border-purple-600 outline-none"
        >
          <option value="all">All Users</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-3 bg-[#14071d] border border-[#2a0c3f] rounded-xl text-white focus:border-purple-600 outline-none"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="staff">Staff</option>
          <option value="driver">Driver</option>
        </select>
      </div>

      {/* TABLE */}
      <div
        className="rounded-xl overflow-hidden shadow-2xl"
        style={{
          backgroundColor: "#14071d",
          border: "1px solid #2a0c3f",
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "#0d0413" }}>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">
                  User
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">
                  Email
                </th>
                <th className="px-4 py-4 text-left text-sm font-medium text-slate-300">
                  Steam ID
                </th>
                <th className="px-4 py-4 text-left text-sm font-medium text-slate-300">
                  Discord ID
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">
                  Roles
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-slate-400">Loading users...</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-t hover:bg-[#1a0927] transition-colors"
                    style={{ borderColor: "#2a0c3f" }}
                  >
                    {/* USER */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {user.avatar && user.avatar.trim() !== "" ? (
                          <img
                            src={user.avatar}
                            alt={user.username}
                            className="w-10 h-10 rounded-full object-cover border-2 shadow-md shadow-black/70"
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
                          className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6A0DAD] to-[#f8cc00] flex items-center justify-center text-white font-semibold shadow-md shadow-black/70"
                          style={{
                            display: user.avatar && user.avatar.trim() !== "" ? "none" : "flex",
                          }}
                        >
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <button
                            onClick={() => {
                              // TODO: Navigate to profile when implemented
                              console.log('Navigate to profile:', user.id);
                            }}
                            className="text-purple-400 hover:text-purple-300 hover:underline font-medium transition-colors text-left"
                          >
                            {user.username}
                          </button>
                          <div className="text-slate-500 text-[11px]">
                            ID: {user.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* EMAIL */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-slate-200 text-sm">
                        {user.email || "—"}
                      </div>
                    </td>

                    {/* STEAM ID */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-slate-300 text-xs font-mono">
                        {user.steam_id || (
                          <span className="text-slate-500 italic">Not linked</span>
                        )}
                      </div>
                    </td>

                    {/* DISCORD ID */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-slate-300 text-xs font-mono">
                        {user.discord_id || (
                          <span className="text-slate-500 italic">Not linked</span>
                        )}
                      </div>
                    </td>

                    {/* ROLES */}
                    <td className="px-6 py-4">
                      <RoleBadges roles={user.roles} maxDisplay={2} size="sm" />
                    </td>

                    {/* STATUS */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex items-center px-2 py-1 text-[11px] font-medium rounded-full border ${
                            user.approved
                              ? "bg-emerald-900/40 text-emerald-300 border-emerald-700"
                              : "bg-amber-900/40 text-amber-300 border-amber-700"
                          }`}
                        >
                          {user.approved ? "Approved" : "Pending"}
                        </span>
                        {user.suspended && (
                          <span className="inline-flex items-center px-2 py-1 text-[11px] font-medium rounded-full bg-red-900/40 text-red-300 border border-red-700">
                            Suspended
                          </span>
                        )}
                      </div>
                    </td>

                    {/* ACTIONS */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {hasAnyPermission(['users.edit.basic', 'users.edit.roles']) && (
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-2 rounded-lg hover:bg-[#2d1b5c]/70 transition-colors"
                            title="Edit user"
                          >
                            <Edit className="w-4 h-4 text-sky-300" />
                          </button>
                        )}
                        {hasPermission('users.edit.basic') && (
                          <button
                            onClick={() => setResetPasswordUser(user)}
                            className="p-2 rounded-lg hover:bg-[#2d1b5c]/70 transition-colors"
                            title="Reset password"
                          >
                            <Lock className="w-4 h-4 text-amber-300" />
                          </button>
                        )}
                        {hasPermission('users.delete') && (
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="p-2 rounded-lg hover:bg-[#2d1b5c]/70 transition-colors"
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}

              {filteredUsers.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-slate-400 text-sm"
                  >
                    No users match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT USER MODAL */}
      <AnimatePresence>
        {editingUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => setEditingUser(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#14071d] border border-[#2a0c3f] rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Edit className="w-5 h-5 text-purple-400" />
                  Edit User
                </h2>
                <button
                  onClick={() => setEditingUser(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) =>
                      setEditForm({ ...editForm, username: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-[#0d0413] border border-[#2a0c3f] rounded-xl text-white focus:border-purple-600 outline-none"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm({ ...editForm, email: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-[#0d0413] border border-[#2a0c3f] rounded-xl text-white focus:border-purple-600 outline-none"
                  />
                </div>

                {/* Roles */}
                {hasPermission('users.edit.roles') && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Roles
                    </label>
                    <RoleSelector
                      selectedRoles={editForm.roles}
                      onChange={(newRoles) =>
                        setEditForm({ ...editForm, roles: newRoles })
                      }
                    />
                  </div>
                )}

                {/* Approved */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.approved}
                    onChange={(e) =>
                      setEditForm({ ...editForm, approved: e.target.checked })
                    }
                    className="w-5 h-5 rounded border-[#2a0c3f] bg-[#0d0413] text-purple-600 focus:ring-purple-600"
                  />
                  <span className="text-sm text-slate-300">Approved</span>
                </label>

                {/* Suspended */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.suspended}
                    onChange={(e) =>
                      setEditForm({ ...editForm, suspended: e.target.checked })
                    }
                    className="w-5 h-5 rounded border-[#2a0c3f] bg-[#0d0413] text-red-600 focus:ring-red-600"
                  />
                  <span className="text-sm text-slate-300">Suspended</span>
                </label>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSave}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingUser(null)}
                  className="flex-1 px-4 py-2 bg-[#0d0413] border border-[#2a0c3f] text-white rounded-xl font-medium transition-colors hover:border-purple-600"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CREATE USER MODAL */}
      <AnimatePresence>
        {showCreateUserModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateUserModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#14071d] border border-[#2a0c3f] rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-purple-400" />
                  Create User
                </h2>
                <button
                  onClick={() => setShowCreateUserModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={createUserForm.username}
                    onChange={(e) =>
                      setCreateUserForm({
                        ...createUserForm,
                        username: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 bg-[#0d0413] border border-[#2a0c3f] rounded-xl text-white focus:border-purple-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={createUserForm.email}
                    onChange={(e) =>
                      setCreateUserForm({
                        ...createUserForm,
                        email: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 bg-[#0d0413] border border-[#2a0c3f] rounded-xl text-white focus:border-purple-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Steam ID * (Required)
                  </label>
                  <input
                    type="text"
                    required
                    value={createUserForm.steam_id}
                    onChange={(e) =>
                      setCreateUserForm({
                        ...createUserForm,
                        steam_id: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 bg-[#0d0413] border border-[#2a0c3f] rounded-xl text-white focus:border-purple-600 outline-none"
                    placeholder="76561198012345678"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Discord ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={createUserForm.discord_id}
                    onChange={(e) =>
                      setCreateUserForm({
                        ...createUserForm,
                        discord_id: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 bg-[#0d0413] border border-[#2a0c3f] rounded-xl text-white focus:border-purple-600 outline-none"
                    placeholder="123456789012345678"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={createUserForm.password}
                    onChange={(e) =>
                      setCreateUserForm({
                        ...createUserForm,
                        password: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 bg-[#0d0413] border border-[#2a0c3f] rounded-xl text-white focus:border-purple-600 outline-none"
                    placeholder="Min 8 characters"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={createUserForm.confirmPassword}
                    onChange={(e) =>
                      setCreateUserForm({
                        ...createUserForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 bg-[#0d0413] border border-[#2a0c3f] rounded-xl text-white focus:border-purple-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Roles
                  </label>
                  <RoleSelector
                    selectedRoles={createUserForm.roles}
                    onChange={(newRoles) =>
                      setCreateUserForm({ ...createUserForm, roles: newRoles })
                    }
                  />
                </div>

                {createUserError && (
                  <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-900/50 rounded-xl text-red-300 text-sm">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    {createUserError}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={createUserLoading}
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {createUserLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Create User
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateUserModal(false)}
                    className="flex-1 px-4 py-2 bg-[#0d0413] border border-[#2a0c3f] text-white rounded-xl font-medium transition-colors hover:border-purple-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PASSWORD RESET MODAL */}
      <AnimatePresence>
        {resetPasswordUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setResetPasswordUser(null);
              setNewPassword("");
              setConfirmPassword("");
              setPasswordError("");
            }}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#14071d] border border-[#2a0c3f] rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Lock className="w-5 h-5 text-amber-400" />
                  Reset Password
                </h2>
                <button
                  onClick={() => {
                    setResetPasswordUser(null);
                    setNewPassword("");
                    setConfirmPassword("");
                    setPasswordError("");
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4 p-3 bg-amber-900/20 border border-amber-900/50 rounded-xl">
                <p className="text-sm text-amber-300">
                  Resetting password for: <strong>{resetPasswordUser.username}</strong>
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2 bg-[#0d0413] border border-[#2a0c3f] rounded-xl text-white focus:border-purple-600 outline-none"
                    placeholder="Min 8 characters"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 bg-[#0d0413] border border-[#2a0c3f] rounded-xl text-white focus:border-purple-600 outline-none"
                  />
                </div>

                {passwordError && (
                  <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-900/50 rounded-xl text-red-300 text-sm">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    {passwordError}
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handlePasswordReset}
                  disabled={passwordLoading}
                  className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-900 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {passwordLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Reset Password
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setResetPasswordUser(null);
                    setNewPassword("");
                    setConfirmPassword("");
                    setPasswordError("");
                  }}
                  className="flex-1 px-4 py-2 bg-[#0d0413] border border-[#2a0c3f] text-white rounded-xl font-medium transition-colors hover:border-purple-600"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ADD DRIVER MODAL (Invite Code) */}
      <AnimatePresence>
        {showAddDriverModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowAddDriverModal(false);
              setInviteCode("");
              setAddDriverError("");
            }}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#14071d] border border-[#2a0c3f] rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-purple-400" />
                  Add Driver
                </h2>
                <button
                  onClick={() => {
                    setShowAddDriverModal(false);
                    setInviteCode("");
                    setAddDriverError("");
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {!inviteCode ? (
                <form onSubmit={handleAddDriver} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Username *
                    </label>
                    <input
                      type="text"
                      required
                      value={addDriverForm.username}
                      onChange={(e) =>
                        setAddDriverForm({
                          ...addDriverForm,
                          username: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 bg-[#0d0413] border border-[#2a0c3f] rounded-xl text-white focus:border-purple-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={addDriverForm.email}
                      onChange={(e) =>
                        setAddDriverForm({
                          ...addDriverForm,
                          email: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 bg-[#0d0413] border border-[#2a0c3f] rounded-xl text-white focus:border-purple-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Steam ID
                    </label>
                    <input
                      type="text"
                      value={addDriverForm.steamId}
                      onChange={(e) =>
                        setAddDriverForm({
                          ...addDriverForm,
                          steamId: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 bg-[#0d0413] border border-[#2a0c3f] rounded-xl text-white focus:border-purple-600 outline-none"
                      placeholder="76561198012345678"
                    />
                  </div>

                  {addDriverError && (
                    <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-900/50 rounded-xl text-red-300 text-sm">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      {addDriverError}
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={addDriverLoading}
                      className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {addDriverLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          Generate Invite
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddDriverModal(false);
                        setInviteCode("");
                        setAddDriverError("");
                      }}
                      className="flex-1 px-4 py-2 bg-[#0d0413] border border-[#2a0c3f] text-white rounded-xl font-medium transition-colors hover:border-purple-600"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-green-900/20 border border-green-900/50 rounded-xl">
                    <p className="text-sm text-green-300 mb-3">
                      ✓ Invite code generated successfully!
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-2 bg-[#0d0413] border border-[#2a0c3f] rounded-lg text-white font-mono text-sm">
                        {inviteCode}
                      </code>
                      <button
                        onClick={copyInviteCode}
                        className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
                        title="Copy to clipboard"
                      >
                        {codeCopied ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-slate-400">
                    Share this code with the driver to complete registration.
                  </p>

                  <button
                    onClick={() => {
                      setShowAddDriverModal(false);
                      setInviteCode("");
                      setAddDriverForm({ username: "", email: "", steamId: "" });
                    }}
                    className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors"
                  >
                    Done
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// STAT CARD COMPONENT
function StatCard({ label, value, color }) {
  return (
    <div
      className="p-4 rounded-xl"
      style={{
        backgroundColor: "#14071d",
        border: "1px solid #2a0c3f",
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center"
          style={{
            backgroundColor: `${color}20`,
            border: `1px solid ${color}50`,
          }}
        >
          <Shield className="w-6 h-6" style={{ color }} />
        </div>
      </div>
    </div>
  );
}