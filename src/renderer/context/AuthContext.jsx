// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect, useRef } from "react";
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
  
  // 🔥 CRITICAL FIX: Prevent multiple simultaneous auth checks
  const isCheckingAuth = useRef(false);
  const lastAuthCheck = useRef(0);
  const AUTH_CHECK_COOLDOWN = 5000; // 5 seconds between checks

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    // 🔥 Prevent concurrent checks
    if (isCheckingAuth.current) {
      console.log("⏭️ Auth check already in progress, skipping");
      return;
    }

    // 🔥 Rate limit checks (5 second cooldown)
    const now = Date.now();
    if (now - lastAuthCheck.current < AUTH_CHECK_COOLDOWN) {
      console.log("⏭️ Auth check on cooldown, skipping");
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
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      
      // 🔥 Handle 429 specifically
      if (error.response?.status === 429) {
        console.warn("⚠️ Rate limited during auth check. Will retry on next login attempt.");
        // Don't clear tokens on rate limit
      } else if (error.response?.status === 401) {
        // Only clear on actual auth failure
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("sessionToken");
      }
    } finally {
      setLoading(false);
      isCheckingAuth.current = false;
    }
  };

  const login = async (username, password) => {
          console.log('[AuthContext] Entering login function');
          // 🔥 Prevent concurrent login attempts
          if (isCheckingAuth.current) {
            return { success: false, message: "Please wait..." };
          }

    try {
      setLoading(true);
      setError(null);
      isCheckingAuth.current = true;

      const response = await api.post("/auth/login", { username, password });
      const { token, refreshToken, sessionToken, user: userData } = response.data;

            console.log('[AuthContext] Login API call successful');
            console.log('🔥 LOGIN RESPONSE:', response.data);
      console.log('🔥 User data:', userData);
      console.log('🔥 User roles:', userData.roles);

      localStorage.setItem("token", token);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("sessionToken", sessionToken);

      setUser(userData);

      notifyTelemetryLogin({
              ...userData,
              token: sessionToken,
            });

            console.log('[AuthContext] Checking for electronAPI.sendAuthToken');
            // Send auth token to main process for Socket.IO
            console.log('[Auth Debug] window.electronAPI in AuthContext:', window.electronAPI);
      if (window.electronAPI?.sendAuthToken) {
        window.electronAPI.sendAuthToken(token);
      }

      // Update last check time to prevent immediate re-check
      lastAuthCheck.current = Date.now();

      return { success: true };
    } catch (error) {
      // 🔥 Handle 429 with helpful message
      if (error.response?.status === 429) {
        const errorMessage = "Too many login attempts. Please wait a moment and try again.";
        setError(errorMessage);
        return { success: false, message: errorMessage };
      }
      
      const errorMessage = error.response?.data?.error || "Login failed";
      setError(errorMessage);
      return { success: false, message: errorMessage };
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
    localStorage.removeItem("sessionToken");
    setUser(null);
    setError(null);
    notifyTelemetryLogout();
    
    // Reset auth check refs
    isCheckingAuth.current = false;
    lastAuthCheck.current = 0;
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