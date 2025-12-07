import React, { createContext, useState, useContext, useEffect, useRef } from "react";
import api from "../services/api";
import { io } from "socket.io-client";
import { writeAuthToken } from "../../utils/saveToken";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

// Telemetry helpers
const notifyTelemetryLogin = (userData) => {
  if (window.electronAPI?.telemetryUserLogin) {
    window.electronAPI.telemetryUserLogin(userData);
    console.log("Telemetry notified of login:", userData.username);
  }
};

const notifyTelemetryLogout = () => {
  if (window.electronAPI?.telemetryUserLogout) {
    window.electronAPI.telemetryUserLogout();
    console.log("Telemetry notified of logout");
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authMode, setAuthMode] = useState("login");

  const isCheckingAuth = useRef(false);
  const lastAuthCheck = useRef(0);
  const AUTH_CHECK_COOLDOWN = 5000;

  // Store permissions + tier
  const [permissions, setPermissions] = useState([]);
  const [tier, setTier] = useState("TIER_0");

  useEffect(() => {
    checkAuth();
  }, []);

  // ============================
  // WebSocket
  // ============================
  useEffect(() => {
    let socket;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;

    if (user && user.id) {
      const wsUrl = import.meta.env.VITE_WS_URL;

      if (!wsUrl) {
        console.warn("VITE_WS_URL not configured, skipping WebSocket");
        return;
      }

      socket = io(wsUrl, {
        auth: { token: localStorage.getItem("token") },
        reconnection: true,
        reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
      });

      socket.on("connect", () => {
        console.log("WebSocket connected for user:", user.username);
        reconnectAttempts = 0;
      });

      socket.on("user:roles_updated", async (data) => {
        console.log("user:roles_updated:", data);
        if (data.userId === user.id) {
          await reloadPermissions();
          await refreshUserProfile();
        }
      });

      socket.on("disconnect", (reason) => {
        console.log("WebSocket disconnected:", reason);
      });

      socket.on("connect_error", (err) => {
        reconnectAttempts++;
        if (reconnectAttempts <= 3)
          console.warn(`WebSocket error (${reconnectAttempts}/5):`, err.message);

        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
          console.error("WebSocket failed after max attempts.");
          socket.close();
        }
      });

      socket.on("reconnect_failed", () => {
        console.error("WebSocket reconnection failed. Disabled.");
      });
    }

    return () => {
      if (socket) {
        console.log("Cleaning up WebSocket.");
        socket.disconnect();
      }
    };
  }, [user]);

  // ============================================
  // PROFILE + PERMISSIONS
  // ============================================
  const refreshUserProfile = async () => {
    try {
      const res = await api.get("/auth/profile");
      setUser(res.data);
    } catch (err) {
      console.warn("Failed to refresh profile:", err);
    }
  };

  const reloadPermissions = async () => {
    try {
      const res = await api.get("/roles/me/permissions");
      setPermissions(res.data.permissions || []);
      setTier(res.data.tier || "TIER_0");
      console.log("Permissions synced:", res.data);
      await refreshUserProfile();
    } catch (err) {
      console.warn("Failed to load permissions:", err);
      setPermissions([]);
      setTier("TIER_0");
    }
  };

  // ============================================
  // CHECK AUTH
  // ============================================
  const checkAuth = async () => {
    if (isCheckingAuth.current) return console.log("Auth check already running");

    const now = Date.now();
    if (now - lastAuthCheck.current < AUTH_CHECK_COOLDOWN) {
      setLoading(false);
      return;
    }

    isCheckingAuth.current = true;
    lastAuthCheck.current = now;

    try {
      const token = localStorage.getItem("token");
      const refreshToken = localStorage.getItem("refreshToken");
      const sessionToken = localStorage.getItem("sessionToken");

      if (token && refreshToken) {
        const response = await api.get("/auth/profile");
        const profile = response.data;

        setUser(profile);

        notifyTelemetryLogin({
          ...profile,
          token: sessionToken || token,
        });

        await reloadPermissions();
      }
    } catch (error) {
      console.error("Auth check failed:", error);

      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("sessionToken");
      }
    } finally {
      setLoading(false);
      isCheckingAuth.current = false;
    }
  };

  // ============================================
  // LOGIN
  // ============================================
  const login = async (username, password) => {
    if (isCheckingAuth.current) return { success: false, message: "Please wait..." };

    try {
      setLoading(true);
      setError(null);
      isCheckingAuth.current = true;

      const response = await api.post("/auth/login", { username, password });
      const { token, refreshToken, sessionToken, user: userData } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("sessionToken", sessionToken);

      setUser(userData);
      notifyTelemetryLogin({ ...userData, token: sessionToken });

      // Persist auth token for the telemetry DLL (Electron IPC preferred)
      try {
        const finalToken = sessionToken || token;
        if (window?.electronAPI?.saveToken) {
          window.electronAPI.saveToken(finalToken);
          console.log("Telemetry token saved via IPC");
        } else if (window?.process?.versions?.electron) {
          // Legacy fallback
          await writeAuthToken(finalToken, userData);
        } else {
          console.warn("Skipping telemetry token file write (non-Electron context)");
        }
      } catch (err) {
        console.warn("Failed to write telemetry auth token file:", err.message);
      }

      lastAuthCheck.current = Date.now();

      await reloadPermissions();

      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.error || "Login failed";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
      isCheckingAuth.current = false;
    }
  };

  const register = async (username, password, inviteCode) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post("/auth/register", {
        username,
        password,
        inviteCode,
      });

      return {
        success: true,
        message: response.data.message,
        requiresApproval: response.data.requiresApproval || true,
      };
    } catch (error) {
      const msg = error.response?.data?.message || "Registration failed";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("sessionToken");
    setUser(null);
    setPermissions([]);
    setTier("TIER_0");
    setError(null);

    notifyTelemetryLogout();

    isCheckingAuth.current = false;
    lastAuthCheck.current = 0;
  };

  const updateUser = (userData) => setUser(userData);

  // ============================================
  // ROLE HELPERS
  // ============================================
  const hasRole = (role) => user?.roles?.includes(role);
  const hasAnyRole = (roles) => roles.some((r) => user?.roles?.includes(r));
  const hasAllRoles = (roles) => roles.every((r) => user?.roles?.includes(r));

  const isAdmin = () => hasRole("admin");
  const isStaff = () => hasAnyRole(["admin", "staff"]);
  const isDriver = () => hasRole("driver");

  // ============================================
  // PERMISSION HELPERS
  // ============================================
  const hasPermission = (perm) => {
    if (!permissions) return false;
    if (permissions.includes("*")) return true;
    return permissions.includes(perm);
  };

  const hasAnyPermission = (perms) =>
    permissions.includes("*") || perms.some((p) => permissions.includes(p));

  const hasAllPermissions = (perms) =>
    permissions.includes("*") || perms.every((p) => permissions.includes(p));

  const hasTier = (min) => {
    const num = parseInt(tier.replace("TIER_", ""));
    return num >= min;
  };

  const getRolesString = () => {
    if (!user?.roles?.length) return "No Role";
    return user.roles.map((r) => r.charAt(0).toUpperCase() + r.slice(1)).join(", ");
  };

  // ============================================
  // FINAL CONTEXT VALUE
  // ============================================
  const value = {
    user,
    loading,
    error,
    setError,
    authMode,
    setAuthMode,
    login,
    register,
    logout,
    updateUser,
    checkAuth,

    // Roles
    hasRole,
    hasAnyRole,
    hasAllRoles,
    isAdmin,
    isStaff,
    isDriver,
    getRolesString,

    // Permissions
    permissions,
    tier,
    reloadPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasTier,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
