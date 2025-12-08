// src/components/Admin/UserRoles.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Shield,
  PlusCircle,
  Edit,
  Trash2,
  X,
  Save,
  Info,
} from "lucide-react";
import api from "../../services/api";

// Default tiers and sample permissions as a safety net if API is unavailable
const TIER_INFO = [
  {
    tier: "TIER_0",
    label: "Tier 0 — Drivers & External Staff",
    summary:
      "Basic access. View own jobs, edit own profile. No admin abilities.",
  },
  {
    tier: "TIER_1",
    label: "Tier 1 — Staff Trial",
    summary:
      "Can view all jobs, approve jobs, view users, and basic support access.",
  },
  {
    tier: "TIER_2",
    label: "Tier 2 — Enigma Staff, Media, Event Team",
    summary:
      "Can edit users (basic), edit/delete jobs, create events/media/announcements.",
  },
  {
    tier: "TIER_3",
    label: "Tier 3 — Division & HR Managers",
    summary:
      "Can approve registrations, suspend users, assign lower roles, view finances, run reports.",
  },
  {
    tier: "TIER_4",
    label: "Tier 4 — Directors & Dev Leads",
    summary:
      "Can delete users, assign any role below director, edit finances/system settings, view logs, create backups.",
  },
  {
    tier: "TIER_5",
    label: "Tier 5 — Ops & GM",
    summary:
      "Can create roles, edit role permissions, critical settings, access dev console/database.",
  },
  {
    tier: "TIER_6",
    label: "Tier 6 — CEO/Board",
    summary: "Wildcard (*) — full access to everything.",
  },
];

const FALLBACK_ROLES = [
  { id: "driver", name: "Driver", tier: "TIER_0", permissions: [] },
  { id: "admin", name: "Admin", tier: "TIER_6", permissions: ["*"] },
];

export default function UserRoles() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    tier: "TIER_0",
    permissions: [],
    color: "#6A0DAD",
  });
  const [saving, setSaving] = useState(false);

  const [editingRole, setEditingRole] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", tier: "TIER_0", permissions: [], color: "#6A0DAD" });
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [showPermsCreate, setShowPermsCreate] = useState(false);
  const [showPermsEdit, setShowPermsEdit] = useState(false);
  const [adminRolesAvailable, setAdminRolesAvailable] = useState(false);
  const isValidHex = (val) => /^#([0-9a-fA-F]{6})$/.test(val);
  const safeColor = (val, fallback = "#6A0DAD") => (isValidHex(val) ? val : fallback);

  const roleStyles = useMemo(
    () => ({
      owner: { bg: "bg-red-500/25", border: "border-red-400/60", text: "text-white" },
      "board member": { bg: "bg-red-500/25", border: "border-red-300/60", text: "text-white" },
      admin: { bg: "bg-amber-500/25", border: "border-amber-300/60", text: "text-white" },
      driver: { bg: "bg-purple-500/25", border: "border-purple-200/70", text: "text-white" },
      default: { bg: "bg-amber-500/15", border: "border-amber-400/50", text: "text-white" },
    }),
    []
  );

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    setError("");
    try {
      // Try admin endpoint first (supports colors & mutations)
      const resAdmin = await api.get("/admin/roles");
      if (resAdmin.data?.roles) {
        setRoles(resAdmin.data.roles);
        setAdminRolesAvailable(true);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn("Admin roles endpoint unavailable, falling back to /roles", err);
      setAdminRolesAvailable(false);
    }

    try {
      const res = await api.get("/roles");
      setRoles(res.data?.roles || res.data || FALLBACK_ROLES);
      // /roles is read-only; keep admin flag false so we don't try mutations without support
      setAdminRolesAvailable(false);
    } catch (err) {
      console.error("Failed to fetch roles", err);
      setRoles(FALLBACK_ROLES);
      setError("Could not load roles from API. Showing fallback list.");
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const res = await api.get("/roles/permissions");
      const raw = res.data?.permissions;
      let perms = [];
      if (Array.isArray(raw)) {
        perms = raw;
      } else if (raw && typeof raw === "object") {
        perms = Object.keys(raw);
      }
      setAvailablePermissions(perms);
    } catch (err) {
      console.error("Failed to fetch permissions", err);
      setAvailablePermissions([]);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!adminRolesAvailable) {
      setError("Backend does not expose /admin/roles. Role changes cannot be saved yet.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: form.name,
        tier: form.tier,
        permissions: form.permissions,
        color: safeColor(form.color),
      };
      await api.post("/admin/roles", payload);
      await fetchRoles();
      setForm({ name: "", tier: "TIER_0", permissions: [], color: "#6A0DAD" });
    } catch (err) {
      console.error("Failed to create role", err);
      setError(err.response?.data?.error || "Role creation failed. Ensure backend /admin/roles exists.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (role) => {
    setEditingRole(role);
    setEditForm({
      name: role.name,
      tier: role.tier,
      permissions: role.permissions || [],
      color: role.color || "#6A0DAD",
    });
    setShowPermsEdit(false);
  };

  const handleUpdate = async () => {
    if (!editingRole) return;
    if (!adminRolesAvailable) {
      setError("Backend does not expose /admin/roles. Role changes cannot be saved yet.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: editForm.name,
        tier: editForm.tier,
        permissions: editForm.permissions,
        color: safeColor(editForm.color),
      };
      const key = editingRole.id || editingRole.name;
      await api.put(`/admin/roles/${encodeURIComponent(key)}`, payload);
      await fetchRoles();
      setEditingRole(null);
      setShowPermsEdit(false);
    } catch (err) {
      console.error("Failed to update role", err);
      setError(err.response?.data?.error || "Role update failed. Ensure backend /admin/roles exists.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (roleId) => {
    if (!window.confirm("Delete this role?")) return;
    if (!adminRolesAvailable) {
      setError("Backend does not expose /admin/roles. Role changes cannot be saved yet.");
      return;
    }
    setError("");
    try {
      await api.delete(`/admin/roles/${encodeURIComponent(roleId)}`);
      await fetchRoles();
    } catch (err) {
      console.error("Failed to delete role", err);
      setError(err.response?.data?.error || "Role deletion failed. Ensure backend /admin/roles exists.");
    }
  };

  const renderBadge = (name, colorOverride) => {
    const key = (name || "").toLowerCase();
    const style = roleStyles[key] || roleStyles.default;
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase border ${style.bg} ${style.border} ${style.text}`}
        style={colorOverride ? { backgroundColor: `${colorOverride}33`, borderColor: `${colorOverride}66`, color: "#fff" } : undefined}
      >
        {name}
      </span>
    );
  };

  const getTierLabel = (tier) =>
    TIER_INFO.find((t) => t.tier === tier)?.label || tier;

  const tierNumber = (tier) => {
    if (!tier || typeof tier !== "string") return 0;
    const parts = tier.split("_");
    const num = parseInt(parts[1], 10);
    return Number.isNaN(num) ? 0 : num;
  };

  const sortedRoles = useMemo(() => {
    return [...roles].sort((a, b) => {
      const ta = tierNumber(a.tier);
      const tb = tierNumber(b.tier);
      if (ta !== tb) return ta - tb; // lower tier first
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [roles]);

  return (
    <div className="p-6 space-y-6 min-h-full bg-gradient-to-b from-[#12051a] to-[#1a0927] text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center shadow-md"
            style={{ backgroundColor: "#1e0b29", border: "1px solid #6A0DAD90", boxShadow: "0 0 18px #6A0DAD50" }}
          >
            <Shield className="w-6 h-6" style={{ color: "#6A0DAD" }} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Roles</h1>
            <p className="text-sm text-slate-400">
              Manage role tiers and permissions
            </p>
          </div>
        </div>
        <button
          onClick={fetchRoles}
          className="px-4 py-2 bg-[#14071d] hover:bg-[#1e0b29] border border-[#2a0c3f] text-white rounded-xl flex items-center gap-2 transition-all hover:border-[#6A0DAD]"
        >
          <Info className="w-4 h-4 text-slate-200" />
          Refresh
        </button>
      </div>

      {(error || !adminRolesAvailable) && (
        <div className="px-4 py-3 rounded-lg border border-red-500/50 bg-red-900/30 text-sm text-red-100">
          {error || "Backend /admin/roles is not available. Viewing roles is read-only until that endpoint is added."}
        </div>
      )}

      {/* Tier cheat sheet */}
      <div className="grid md:grid-cols-3 gap-4">
        {TIER_INFO.map((tier) => (
          <div
            key={tier.tier}
            className="rounded-xl border border-[#2a0c3f] bg-[#14071d] p-4 shadow-md"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-100">
                {tier.label}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#0d0413] border border-[#2a0c3f] text-slate-300">
                {tier.tier}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{tier.summary}</p>
          </div>
        ))}
      </div>

      {/* Create role */}
      <div
        className="rounded-xl border border-[#2a0c3f] bg-[#14071d] p-4 shadow-md"
      >
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-purple-300" />
          Create Role
        </h3>
        <form className="grid md:grid-cols-3 gap-3" onSubmit={handleCreate}>
          <div className="md:col-span-1">
            <label className="block text-sm text-slate-300 mb-1">Role Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[#0d0413] border border-[#2a0c3f] text-white focus:border-purple-600 outline-none"
              placeholder="e.g. Event Manager"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm text-slate-300 mb-1">Tier</label>
            <select
              value={form.tier}
              onChange={(e) => setForm({ ...form, tier: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[#0d0413] border border-[#2a0c3f] text-white focus:border-purple-600 outline-none"
            >
              {TIER_INFO.map((t) => (
                <option key={t.tier} value={t.tier}>
                  {t.tier}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm text-slate-300 mb-1">Color (hex)</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={safeColor(form.color)}
                onChange={(e) => setForm({ ...form, color: safeColor(e.target.value) })}
                className="w-12 h-10 rounded-lg border border-[#2a0c3f] bg-[#0d0413] p-1"
              />
              <input
                value={form.color}
                onChange={(e) => {
                  const v = e.target.value;
                  if (isValidHex(v) || v === "" || v === "#") {
                    setForm({ ...form, color: v });
                  }
                }}
                className="flex-1 px-3 py-2 rounded-lg bg-[#0d0413] border border-[#2a0c3f] text-white focus:border-purple-600 outline-none"
                placeholder="#6A0DAD"
              />
            </div>
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm text-slate-300 mb-1">Permissions</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPermsCreate((v) => !v)}
                className="w-full px-3 py-2 rounded-lg bg-[#0d0413] border border-[#2a0c3f] text-left text-slate-200 focus:border-purple-600 outline-none"
              >
                {form.permissions.length
                  ? `${form.permissions.length} selected`
                  : "Select permissions"}
              </button>
              {showPermsCreate && (
                <div className="absolute z-10 mt-2 w-full max-h-48 overflow-y-auto rounded-lg border border-[#2a0c3f] bg-[#0d0413] px-3 py-2 space-y-1 shadow-xl">
                  {(Array.isArray(availablePermissions) ? availablePermissions : []).length === 0 && (
                    <div className="text-xs text-slate-500">No permissions loaded</div>
                  )}
                  {(Array.isArray(availablePermissions) ? availablePermissions : []).map((perm) => {
                    const checked = form.permissions.includes(perm);
                    return (
                      <label key={perm} className="flex items-center gap-2 text-xs text-slate-200">
                        <input
                          type="checkbox"
                          className="accent-purple-500"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setForm({ ...form, permissions: [...form.permissions, perm] });
                            } else {
                              setForm({
                                ...form,
                                permissions: form.permissions.filter((p) => p !== perm),
                              });
                            }
                          }}
                        />
                        {perm}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-gradient-to-r from-[#6A0DAD] to-[#8b5cf6] rounded-lg font-semibold text-sm shadow-lg shadow-purple-900/50 hover:from-[#7b1ec9] hover:to-[#9c6dff] disabled:opacity-60"
            >
              {saving ? "Saving..." : "Add Role"}
            </button>
          </div>
        </form>
      </div>

      {/* Roles list */}
      <div
        className="rounded-xl border border-[#2a0c3f] bg-[#14071d] p-4 shadow-md"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-300" />
            Existing Roles
          </h3>
          <span className="text-xs text-slate-400">
            {roles.length} roles
          </span>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-slate-300 text-sm py-6">
            <div className="w-6 h-6 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            Loading roles...
          </div>
        ) : (
          <div className="space-y-3">
            {sortedRoles.map((role, idx) => (
              <div
                key={`${role.id || role.name || "role"}-${idx}`}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-3 py-3 rounded-lg border border-[#2a0c3f] bg-[#0d0413]"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                {renderBadge(role.name, role.color)}
                    <span className="text-xs text-slate-300 px-2 py-0.5 rounded bg-slate-800/70 border border-slate-700">
                      {getTierLabel(role.tier)}
                    </span>
                    {role.color && (
                      <span
                        className="w-4 h-4 inline-block rounded-full border border-slate-600"
                        style={{ backgroundColor: role.color }}
                        title={role.color}
                      />
                    )}
                  </div>
                  <div className="text-xs text-slate-400">
                    {role.permissions?.length
                      ? `${role.permissions.length} permission(s)`
                      : "No permissions listed"}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEdit(role)}
                    className="px-3 py-1 rounded-lg bg-[#1b1024] border border-[#2a0c3f] text-slate-200 hover:border-purple-600 transition-colors flex items-center gap-1 text-sm"
                  >
                    <Edit className="w-4 h-4" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(role.id)}
                    className="px-3 py-1 rounded-lg bg-[#240912] border border-red-700/60 text-red-100 hover:border-red-500 transition-colors flex items-center gap-1 text-sm"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editingRole && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#14071d] border border-[#2a0c3f] rounded-2xl p-5 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold flex items-center gap-2">
                <Edit className="w-5 h-5 text-purple-300" />
                Edit Role
              </h4>
              <button
                onClick={() => setEditingRole(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-slate-300 mb-1">Role Name</label>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#0d0413] border border-[#2a0c3f] text-white focus:border-purple-600 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Tier</label>
                <select
                  value={editForm.tier}
                  onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#0d0413] border border-[#2a0c3f] text-white focus:border-purple-600 outline-none"
                >
                  {TIER_INFO.map((t) => (
                    <option key={t.tier} value={t.tier}>
                      {t.tier}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Permissions</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowPermsEdit((v) => !v)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0d0413] border border-[#2a0c3f] text-left text-slate-200 focus:border-purple-600 outline-none"
                  >
                    {editForm.permissions.length
                      ? `${editForm.permissions.length} selected`
                      : "Select permissions"}
                  </button>
                  {showPermsEdit && (
                    <div className="absolute z-20 mt-2 w-full max-h-48 overflow-y-auto rounded-lg border border-[#2a0c3f] bg-[#0d0413] px-3 py-2 space-y-1 shadow-xl">
                      {(Array.isArray(availablePermissions) ? availablePermissions : []).length === 0 && (
                        <div className="text-xs text-slate-500">No permissions loaded</div>
                      )}
                      {(Array.isArray(availablePermissions) ? availablePermissions : []).map((perm) => {
                        const checked = editForm.permissions.includes(perm);
                        return (
                          <label key={perm} className="flex items-center gap-2 text-xs text-slate-200">
                            <input
                              type="checkbox"
                              className="accent-purple-500"
                              checked={checked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditForm({ ...editForm, permissions: [...editForm.permissions, perm] });
                                } else {
                                  setEditForm({
                                    ...editForm,
                                    permissions: editForm.permissions.filter((p) => p !== perm),
                                  });
                                }
                              }}
                            />
                            {perm}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Color (hex)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={safeColor(editForm.color)}
                    onChange={(e) => setEditForm({ ...editForm, color: safeColor(e.target.value) })}
                    className="w-12 h-10 rounded-lg border border-[#2a0c3f] bg-[#0d0413] p-1"
                  />
                  <input
                    value={editForm.color}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (isValidHex(v) || v === "" || v === "#") {
                        setEditForm({ ...editForm, color: v });
                      }
                    }}
                    className="flex-1 px-3 py-2 rounded-lg bg-[#0d0413] border border-[#2a0c3f] text-white focus:border-purple-600 outline-none"
                    placeholder="#6A0DAD"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={handleUpdate}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => setEditingRole(null)}
                className="flex-1 px-4 py-2 bg-[#0d0413] border border-[#2a0c3f] text-white rounded-xl font-medium transition-colors hover:border-purple-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
