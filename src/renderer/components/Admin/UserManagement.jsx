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

const AVAILABLE_ROLES = [
  { value: "admin", label: "Admin", iconColor: "text-red-400" },
  { value: "staff", label: "Staff", iconColor: "text-sky-400" },
  { value: "driver", label: "Driver", iconColor: "text-purple-300" },
];

const ROLE_BADGE_CLASSES = {
  admin:
    "bg-red-900/40 text-red-200 border-red-700",
  staff:
    "bg-sky-900/40 text-sky-200 border-sky-700",
  driver:
    "bg-purple-900/40 text-purple-200 border-purple-700",
};

export default function UserManagement() {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get("/admin/users");
      console.log("🔍 Full API response:", response.data);
      console.log("🔍 First user:", response.data[0]);
      console.log("🔍 First user avatar:", response.data[0]?.avatar);
      console.log("🔍 Avatar type:", typeof response.data[0]?.avatar);
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

      // Log the action
      await api.post("/admin/system-logs", {
        action: "USER_UPDATE",
        target_user: editForm.username,
        meta: {
          roles: editForm.roles,
          approved: editForm.approved,
          suspended: editForm.suspended
        }
      });

      await fetchUsers();
      setEditingUser(null);
    } catch (error) {
      console.error("Failed to update user:", error);
    }
  };

  const handleDelete = async (userId) => {
    const user = users.find(u => u.id === userId);
    if (!confirm(`Are you sure you want to delete ${user?.username}?`)) return;

    try {
      await api.delete(`/admin/users/${userId}`);

      // Log the action
      await api.post("/admin/system-logs", {
        action: "USER_DELETE",
        target_user: user?.username,
        meta: { userId }
      });

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
      await api.post(
        `/users/admin/${resetPasswordUser.id}/reset-password`,
        { newPassword }
      );

      // Log the action
      await api.post("/admin/system-logs", {
        action: "PASSWORD_RESET",
        target_user: resetPasswordUser.username,
        meta: { adminReset: true }
      });

      alert(`Password reset successfully for ${resetPasswordUser.username}`);
      setResetPasswordUser(null);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setPasswordError(
        error.response?.data?.error ||
          error.message ||
          "Failed to reset password"
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAddDriver = async () => {
    setAddDriverError("");
    setAddDriverLoading(true);

    // Validation
    if (!addDriverForm.username || !addDriverForm.steamId) {
      setAddDriverError("Username and Steam ID are required");
      setAddDriverLoading(false);
      return;
    }

    try {
      // Generate invite code and create pending driver
      const response = await api.post("/admin/add-driver", {
        username: addDriverForm.username,
        email: addDriverForm.email,
        steam_id: addDriverForm.steamId,
      });

      setInviteCode(response.data.inviteCode);

      // Log the action
      await api.post("/admin/system-logs", {
        action: "DRIVER_ADDED",
        target_user: addDriverForm.username,
        meta: {
          steam_id: addDriverForm.steamId,
          email: addDriverForm.email
        }
      });

      // Refresh users list
      await fetchUsers();
    } catch (error) {
      setAddDriverError(
        error.response?.data?.error || "Failed to add driver"
      );
    } finally {
      setAddDriverLoading(false);
    }
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const closeAddDriverModal = () => {
    setShowAddDriverModal(false);
    setAddDriverForm({ username: "", email: "", steamId: "" });
    setInviteCode("");
    setAddDriverError("");
    setCodeCopied(false);
  };

  const handleCreateUser = async () => {
    setCreateUserError("");

    // Validation
    if (!createUserForm.username || !createUserForm.password || !createUserForm.steam_id) {
      setCreateUserError("Username, password, and Steam ID are required");
      return;
    }

    if (createUserForm.password.length < 8) {
      setCreateUserError("Password must be at least 8 characters");
      return;
    }

    if (createUserForm.password !== createUserForm.confirmPassword) {
      setCreateUserError("Passwords do not match");
      return;
    }

    if (createUserForm.roles.length === 0) {
      setCreateUserError("Select at least one role");
      return;
    }

    setCreateUserLoading(true);

    try {
      // Create user directly via admin endpoint
      await api.post("/admin/users", {
        username: createUserForm.username,
        email: createUserForm.email,
        password: createUserForm.password,
        discord_id: createUserForm.discord_id,
        steam_id: createUserForm.steam_id,
        roles: createUserForm.roles,
      });

      // Log the action
      await api.post("/admin/system-logs", {
        action: "USER_CREATED_MANUALLY",
        target_user: createUserForm.username,
        meta: {
          roles: createUserForm.roles,
          email: createUserForm.email
        }
      });

      // Close modal and refresh
      closeCreateUserModal();
      await fetchUsers();
      alert(`User ${createUserForm.username} created successfully!`);
    } catch (error) {
      setCreateUserError(
        error.response?.data?.error || "Failed to create user"
      );
    } finally {
      setCreateUserLoading(false);
    }
  };

  const closeCreateUserModal = () => {
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
    setCreateUserError("");
  };

  const toggleRole = (role) => {
    setCreateUserForm(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }));
  };

  const filteredUsers = users
    .filter(
      (user) =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.roles?.some((role) =>
          role.toLowerCase().includes(searchTerm.toLowerCase())
        )
    )
    .filter((user) =>
      roleFilter ? (user.roles || []).includes(roleFilter) : true
    )
    .filter((user) =>
      approvalFilter === "all"
        ? true
        : approvalFilter === "approved"
        ? !!user.approved
        : !user.approved
    )
    .filter((user) =>
      suspendedFilter === "all"
        ? true
        : suspendedFilter === "suspended"
        ? !!user.suspended
        : !user.suspended
    );

  const getRoleBadgeClasses = (role) =>
    ROLE_BADGE_CLASSES[role] ||
    "bg-slate-800/60 text-slate-200 border-slate-600";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-b from-[#12051a] via-[#1b1024] to-[#12051a]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6A0DAD]" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-b from-[#12051a] via-[#1b1024] to-[#12051a] min-h-full">
      {/* HEADER */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#1b1024] border border-[#2c1e3a] flex items-center justify-center shadow-md shadow-black/60">
            <Users className="w-5 h-5 text-[#f8cc00]" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-purple-200/80 mb-1">
              Admin Panel
            </p>
            <h1 className="text-2xl md:text-3xl font-semibold text-slate-50 tracking-tight">
              User Management
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              View, edit, approve and secure all Enigma Hub accounts.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #2d1b5c, #6A0DAD)" }}
            title="Refresh user list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowAddDriverModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white shadow-lg transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg, #6A0DAD, #f8cc00)" }}
          >
            <UserPlus className="w-4 h-4" />
            Add Driver (Invite)
          </button>
          <button
            onClick={() => setShowCreateUserModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white shadow-lg transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg, #0ea5e9, #06b6d4)" }}
          >
            <UserIcon className="w-4 h-4" />
            Create User
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="flex items-center gap-2 rounded-xl bg-[#12051a]/80 border border-[#2c1e3a] px-3 py-2">
          <span className="text-[11px] text-slate-400">Total</span>
          <span className="text-sm font-semibold text-slate-100">{users.length}</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-[#12051a]/80 border border-[#2c1e3a] px-3 py-2">
          <span className="text-[11px] text-slate-400">Pending</span>
          <span className="text-sm font-semibold text-amber-300">{users.filter(u=>!u.approved).length}</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-[#12051a]/80 border border-[#2c1e3a] px-3 py-2">
          <span className="text:[11px] text-slate-400">Suspended</span>
          <span className="text-sm font-semibold text-red-300">{users.filter(u=>u.suspended).length}</span>
        </div>
      </div>

      {/* SEARCH + FILTERS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search users by name, email, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-[#12051a]/90 border border-[#2c1e3a] rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#6A0DAD] focus:ring-1 focus:ring-[#6A0DAD]/60 shadow-sm shadow-black/60"
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <select
            value={roleFilter}
            onChange={(e)=> setRoleFilter(e.target.value)}
            className="bg-[#12051a]/90 border border-[#2c1e3a] rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#6A0DAD]"
          >
            <option value="">All roles</option>
            {AVAILABLE_ROLES.map(r=> (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <select
            value={approvalFilter}
            onChange={(e)=> setApprovalFilter(e.target.value)}
            className="bg-[#12051a]/90 border border-[#2c1e3a] rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#6A0DAD]"
          >
            <option value="all">All</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
          </select>
          <select
            value={suspendedFilter}
            onChange={(e)=> setSuspendedFilter(e.target.value)}
            className="bg-[#12051a]/90 border border-[#2c1e3a] rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#6A0DAD]"
          >
            <option value="all">All</option>
            <option value="suspended">Suspended</option>
            <option value="active">Active</option>
          </select>
        </div>
      </div>

      {/* USERS TABLE CARD */}
      <div className="bg-[#1b1024] rounded-2xl border border-[#2c1e3a] overflow-hidden shadow-xl shadow-black/80">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#12051a]/95 border-b border-[#2c1e3a]">
              <tr>
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                  User
                </th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                  Steam ID
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                  Discord ID
                </th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                  Roles
                </th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2c1e3a]/70">
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-[#241233] transition-colors"
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
                        <div className="text-slate-50 font-medium">
                          {user.username}
                        </div>
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
                    <div className="flex flex-wrap gap-2">
                      {user.roles?.map((role) => (
                        <span
                          key={role}
                          className={
                            "px-2 py-1 text-[11px] font-medium rounded-full border " +
                            getRoleBadgeClasses(role)
                          }
                        >
                          {role}
                        </span>
                      ))}
                    </div>
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
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 rounded-lg hover:bg-[#2d1b5c]/70 transition-colors"
                        title="Edit user"
                      >
                        <Edit className="w-4 h-4 text-sky-300" />
                      </button>
                      <button
                        onClick={() => setResetPasswordUser(user)}
                        className="p-2 rounded-lg hover:bg-[#2d1b5c]/70 transition-colors"
                        title="Reset password"
                      >
                        <Lock className="w-4 h-4 text-amber-300" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-2 rounded-lg hover:bg-[#2d1b5c]/70 transition-colors"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
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
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#18122b] rounded-2xl p-6 w-full max-w-md border border-[#2d1b5c] shadow-2xl shadow-black/80"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-50">
                  Edit User
                </h2>
                <button
                  onClick={() => setEditingUser(null)}
                  className="p-2 rounded-lg hover:bg-[#2d1b5c]/70 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) =>
                      setEditForm({ ...editForm, username: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-[#12051a] border border-[#2c1e3a] rounded-lg text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#6A0DAD]"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm({ ...editForm, email: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-[#12051a] border border-[#2c1e3a] rounded-lg text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#6A0DAD]"
                  />
                </div>

                {/* Roles */}
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-3">
                    Roles (Select at least one)
                  </label>
                  <div className="space-y-2">
                    {AVAILABLE_ROLES.map((role) => (
                      <label
                        key={role.value}
                        className="flex items-center gap-3 p-3 bg-[#12051a] rounded-lg hover:bg-[#1b1024] cursor-pointer transition-colors border border-[#2c1e3a]"
                      >
                        <input
                          type="checkbox"
                          checked={
                            editForm.roles?.includes(role.value) || false
                          }
                          onChange={() => handleRoleToggle(role.value)}
                          className="w-4 h-4 rounded border-slate-600 text-[#6A0DAD] focus:ring-[#6A0DAD] focus:ring-offset-[#18122b]"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Shield
                              className={`w-4 h-4 ${role.iconColor}`}
                            />
                            <span className="text-slate-100 font-medium">
                              {role.label}
                            </span>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  {(!editForm.roles || editForm.roles.length === 0) && (
                    <p className="text-red-400 text-xs mt-2">
                      ⚠️ At least one role is required
                    </p>
                  )}
                </div>

                {/* Approved */}
                <div className="flex items-center justify-between p-3 bg-[#12051a] rounded-lg border border-[#2c1e3a]">
                  <span className="text-slate-200 text-sm">Approved</span>
                  <input
                    type="checkbox"
                    checked={editForm.approved}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        approved: e.target.checked,
                      })
                    }
                    className="w-5 h-5 rounded border-slate-600 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-[#18122b]"
                  />
                </div>

                {/* Suspended */}
                <div className="flex items-center justify-between p-3 bg-[#12051a] rounded-lg border border-[#2c1e3a]">
                  <span className="text-slate-200 text-sm">Suspended</span>
                  <input
                    type="checkbox"
                    checked={editForm.suspended}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        suspended: e.target.checked,
                      })
                    }
                    className="w-5 h-5 rounded border-slate-600 text-red-500 focus:ring-red-500 focus:ring-offset-[#18122b]"
                  />
                </div>

                <button
                  onClick={handleSave}
                  disabled={!editForm.roles || editForm.roles.length === 0}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-white font-semibold rounded-lg transition-colors shadow-md shadow-black/70"
                  style={{ background: "linear-gradient(135deg, #6A0DAD, #f8cc00)" }}
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ADD DRIVER MODAL */}
      <AnimatePresence>
        {showAddDriverModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={closeAddDriverModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#18122b] rounded-2xl p-6 w-full max-w-md border border-[#2d1b5c] shadow-2xl shadow-black/80"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <UserPlus className="w-6 h-6 text-[#f8cc00]" />
                  <h2 className="text-xl font-semibold text-slate-50">
                    Add New Driver
                  </h2>
                </div>
                <button
                  onClick={closeAddDriverModal}
                  className="p-2 rounded-lg hover:bg-[#2d1b5c]/70 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {!inviteCode ? (
                <>
                  <div className="flex items-start gap-3 p-4 bg-sky-900/20 border border-sky-700 rounded-lg mb-4">
                    <AlertTriangle className="w-5 h-5 text-sky-300 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-sky-200 mb-1">
                        Manual Driver Registration
                      </p>
                      <p className="text-xs text-sky-200/90">
                        Create a driver account with invite code. The driver will receive a password reset link upon first login.
                      </p>
                    </div>
                  </div>

                  {addDriverError && (
                    <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg mb-4">
                      <p className="text-xs text-red-200">{addDriverError}</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-200 mb-2">
                        Username <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={addDriverForm.username}
                        onChange={(e) =>
                          setAddDriverForm({ ...addDriverForm, username: e.target.value })
                        }
                        className="w-full px-4 py-2 bg-[#12051a] border border-[#2c1e3a] rounded-lg text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#6A0DAD]"
                        placeholder="Driver username"
                        disabled={addDriverLoading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-200 mb-2">
                        Email (Optional)
                      </label>
                      <input
                        type="email"
                        value={addDriverForm.email}
                        onChange={(e) =>
                          setAddDriverForm({ ...addDriverForm, email: e.target.value })
                        }
                        className="w-full px-4 py-2 bg-[#12051a] border border-[#2c1e3a] rounded-lg text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#6A0DAD]"
                        placeholder="driver@example.com"
                        disabled={addDriverLoading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-200 mb-2">
                        Steam ID <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={addDriverForm.steamId}
                        onChange={(e) =>
                          setAddDriverForm({ ...addDriverForm, steamId: e.target.value })
                        }
                        className="w-full px-4 py-2 bg-[#12051a] border border-[#2c1e3a] rounded-lg text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#6A0DAD]"
                        placeholder="76561198XXXXXXXXX"
                        disabled={addDriverLoading}
                      />
                    </div>

                    <div className="flex gap-3 pt-3">
                      <button
                        onClick={handleAddDriver}
                        disabled={addDriverLoading}
                        className="flex-1 px-4 py-2.5 text-white rounded-lg disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-semibold shadow-md shadow-black/70"
                        style={{ background: "linear-gradient(135deg, #6A0DAD, #f8cc00)" }}
                      >
                        {addDriverLoading ? "Creating..." : "Generate Invite Code"}
                      </button>
                      <button
                        onClick={closeAddDriverModal}
                        disabled={addDriverLoading}
                        className="flex-1 px-4 py-2.5 bg-[#2d1b5c] hover:bg-[#3a2370] text-slate-100 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3 p-4 bg-emerald-900/20 border border-emerald-700 rounded-lg mb-4">
                    <CheckCircle className="w-5 h-5 text-emerald-300 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-emerald-200 mb-1">
                        Driver Created Successfully!
                      </p>
                      <p className="text-xs text-emerald-200/90">
                        Share this invite code with <span className="font-semibold">{addDriverForm.username}</span>. It will be deleted after use.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-200 mb-2">
                        Invite Code
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={inviteCode}
                          readOnly
                          className="flex-1 px-4 py-2 bg-[#12051a] border border-[#2c1e3a] rounded-lg text-slate-100 font-mono text-lg tracking-wide"
                        />
                        <button
                          onClick={copyInviteCode}
                          className="px-4 py-2 bg-[#2d1b5c] hover:bg-[#3a2370] rounded-lg transition-colors flex items-center gap-2"
                        >
                          {codeCopied ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-emerald-400" />
                              <span className="text-sm text-emerald-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 text-slate-300" />
                              <span className="text-sm text-slate-300">Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={closeAddDriverModal}
                      className="w-full px-4 py-2.5 text-white rounded-lg transition-colors font-semibold shadow-md shadow-black/70"
                      style={{ background: "linear-gradient(135deg, #6A0DAD, #f8cc00)" }}
                    >
                      Done
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CREATE USER DIRECTLY MODAL */}
      <AnimatePresence>
        {showCreateUserModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={closeCreateUserModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#18122b] rounded-2xl p-6 w-full max-w-md border border-[#2d1b5c] shadow-2xl shadow-black/80"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <UserIcon className="w-6 h-6 text-sky-400" />
                  <h2 className="text-xl font-semibold text-slate-50">
                    Create User Directly
                  </h2>
                </div>
                <button
                  onClick={closeCreateUserModal}
                  className="p-2 rounded-lg hover:bg-[#2d1b5c]/70 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="flex items-start gap-3 p-4 bg-sky-900/20 border border-sky-700 rounded-lg mb-4">
                <Shield className="w-5 h-5 text-sky-300 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-sky-200 mb-1">
                    Admin Manual User Creation
                  </p>
                  <p className="text-xs text-sky-200/90">
                    Create user with credentials directly (auto-approved). Steam ID required to link driver to trucking system.
                  </p>
                </div>
              </div>

              {createUserError && (
                <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg mb-4">
                  <p className="text-xs text-red-200">{createUserError}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Username <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={createUserForm.username}
                    onChange={(e) =>
                      setCreateUserForm({ ...createUserForm, username: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-[#12051a] border border-[#2c1e3a] rounded-lg text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    placeholder="username"
                    disabled={createUserLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={createUserForm.email}
                    onChange={(e) =>
                      setCreateUserForm({ ...createUserForm, email: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-[#12051a] border border-[#2c1e3a] rounded-lg text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    placeholder="user@example.com"
                    disabled={createUserLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Discord ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={createUserForm.discord_id}
                    onChange={(e) =>
                      setCreateUserForm({ ...createUserForm, discord_id: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-[#12051a] border border-[#2c1e3a] rounded-lg text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    placeholder="123456789012345678"
                    disabled={createUserLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Steam ID <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={createUserForm.steam_id}
                    onChange={(e) =>
                      setCreateUserForm({ ...createUserForm, steam_id: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-[#12051a] border border-[#2c1e3a] rounded-lg text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    placeholder="76561198XXXXXXXXX"
                    disabled={createUserLoading}
                  />
                  <p className="text-xs text-slate-400 mt-1">Required to link driver to trucking system</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Password <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="password"
                    value={createUserForm.password}
                    onChange={(e) =>
                      setCreateUserForm({ ...createUserForm, password: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-[#12051a] border border-[#2c1e3a] rounded-lg text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    placeholder="Min. 8 characters"
                    disabled={createUserLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Confirm Password <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="password"
                    value={createUserForm.confirmPassword}
                    onChange={(e) =>
                      setCreateUserForm({ ...createUserForm, confirmPassword: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-[#12051a] border border-[#2c1e3a] rounded-lg text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    placeholder="Re-enter password"
                    disabled={createUserLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Roles <span className="text-red-400">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_ROLES.map(role => (
                      <button
                        key={role.value}
                        onClick={() => toggleRole(role.value)}
                        disabled={createUserLoading}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          createUserForm.roles.includes(role.value)
                            ? ROLE_BADGE_CLASSES[role.value] + ' scale-105'
                            : 'bg-[#12051a] border-[#2c1e3a] text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        {role.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    onClick={handleCreateUser}
                    disabled={createUserLoading}
                    className="flex-1 px-4 py-2.5 text-white rounded-lg disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-semibold shadow-md shadow-black/70"
                    style={{ background: "linear-gradient(135deg, #0ea5e9, #06b6d4)" }}
                  >
                    {createUserLoading ? "Creating..." : "Create User"}
                  </button>
                  <button
                    onClick={closeCreateUserModal}
                    disabled={createUserLoading}
                    className="flex-1 px-4 py-2.5 bg-[#2d1b5c] hover:bg-[#3a2370] text-slate-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RESET PASSWORD MODAL */}
      <AnimatePresence>
        {resetPasswordUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => setResetPasswordUser(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#18122b] rounded-2xl p-6 w-full max-w-md border border-[#2d1b5c] shadow-2xl shadow-black/80"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Lock className="w-6 h-6 text-amber-300" />
                  <h2 className="text-xl font-semibold text-slate-50">
                    Reset Password
                  </h2>
                </div>
                <button
                  onClick={() => setResetPasswordUser(null)}
                  className="p-2 rounded-lg hover:bg-[#2d1b5c]/70 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="flex items-start gap-3 p-4 bg-amber-900/20 border border-amber-700 rounded-lg mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-300 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-amber-200 mb-1">
                    Admin Action
                  </p>
                  <p className="text-xs text-amber-200/90">
                    You are resetting the password for{" "}
                    <span className="font-semibold">
                      {resetPasswordUser.username}
                    </span>
                    . This action will be logged.
                  </p>
                </div>
              </div>

              {passwordError && (
                <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg mb-4">
                  <p className="text-xs text-red-200">{passwordError}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2 bg-[#12051a] border border-[#2c1e3a] rounded-lg text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#6A0DAD]"
                    placeholder="Enter new password (min 8 characters)"
                    disabled={passwordLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 bg-[#12051a] border border-[#2c1e3a] rounded-lg text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#6A0DAD]"
                    placeholder="Confirm new password"
                    disabled={passwordLoading}
                  />
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    onClick={handleResetPassword}
                    disabled={passwordLoading}
                  className="flex-1 px-4 py-2.5 text-white rounded-lg disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-semibold shadow-md shadow-black/70"
                  style={{ background: "linear-gradient(135deg, #6A0DAD, #f8cc00)" }}
                >
                  {passwordLoading ? "Resetting..." : "Reset Password"}
                </button>
                <button
                  onClick={() => setResetPasswordUser(null)}
                  disabled={passwordLoading}
                  className="flex-1 px-4 py-2.5 bg-[#2d1b5c] hover:bg-[#3a2370] text-slate-100 rounded-lg transition-colors"
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