// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

const notifyTelemetryLogin = (userData) => {
  if (window.electronAPI?.telemetryUserLogin) {
    window.electronAPI.telemetryUserLogin(userData);
    console.log("✅ Telemetry notified of login:", userData.username);
  }
};

const notifyTelemetryLogout = () => {
  if (window.electronAPI?.telemetryUserLogout) {
    window.electronAPI.telemetryUserLogout();
    console.log("✅ Telemetry notified of logout");
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authMode, setAuthMode] = useState("login");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("token");
      const refreshToken = localStorage.getItem("refreshToken");
      const sessionToken = localStorage.getItem("sessionToken");  // ✅ Get session token

      if (token && refreshToken) {
        const response = await api.get("/auth/profile");
        const profile = response.data;

        setUser(profile);

        // ✅ Use session token for telemetry (30 days vs 15 min)
        notifyTelemetryLogin({
          ...profile,
          token: sessionToken || token,  // Fallback to access token if no session token
        });
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post("/auth/login", { username, password });
      const { token, refreshToken, sessionToken, user: userData } = response.data;  // ✅ Extract sessionToken

      console.log('🔥 LOGIN RESPONSE:', response.data);
      console.log('🔥 User data:', userData);
      console.log('🔥 User roles:', userData.roles);
      console.log('🔥 Roles type:', typeof userData.roles);
      console.log('🔥 Is array?:', Array.isArray(userData.roles));

      localStorage.setItem("token", token);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("sessionToken", sessionToken);  // ✅ Store session token

      setUser(userData);

      console.log('🔥 User set in state:', userData);
      console.log('🔥 isAdmin() check:', userData.roles?.includes('admin'));

      // ✅ Use session token for telemetry (lasts 30 days, not 15 min)
      notifyTelemetryLogin({
        ...userData,
        token: sessionToken,
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Login failed";
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
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
      const errorMessage =
        error.response?.data?.message || "Registration failed";
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("sessionToken");  // ✅ Clear session token
    setUser(null);
    setError(null);
    notifyTelemetryLogout();
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  const hasRole = (role) => {
    if (!user || !user.roles) return false;
    return user.roles.includes(role);
  };

  const hasAnyRole = (roles) => {
    if (!user || !user.roles) return false;
    return user.roles.some((role) => roles.includes(role));
  };

  const hasAllRoles = (roles) => {
    if (!user || !user.roles) return false;
    return roles.every((role) => user.roles.includes(role));
  };

  const isAdmin = () => hasRole("admin");
  const isStaff = () => hasAnyRole(["admin", "staff"]);
  const isDriver = () => hasRole("driver");

  const getRolesString = () => {
    if (!user || !user.roles) {
      return "No Role";
    }
    
    // Ensure roles is an array
    const rolesArray = Array.isArray(user.roles) ? user.roles : [user.roles];
    
    if (rolesArray.length === 0) {
      return "No Role";
    }
    
    return rolesArray
      .map((role) => String(role).charAt(0).toUpperCase() + String(role).slice(1))
      .join(", ");
  };

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
    hasRole,
    hasAnyRole,
    hasAllRoles,
    isAdmin,
    isStaff,
    isDriver,
    getRolesString,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};