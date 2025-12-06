// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect, useRef } from "react";
import api from "../services/api";
import { io } from "socket.io-client";

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
  
  const isCheckingAuth = useRef(false);
  const lastAuthCheck = useRef(0);
  const AUTH_CHECK_COOLDOWN = 5000;

  useEffect(() => {
    checkAuth();
  }, []);

  // WebSocket with reconnection limits - FIXED
  useEffect(() => {
    let socket;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;
    
    if (user && user.id) {
      const wsUrl = import.meta.env.VITE_WS_URL;
      
      // Check if WS URL is configured
      if (!wsUrl) {
        console.warn("⚠️ VITE_WS_URL not configured, skipping WebSocket connection");
        return;
      }

      socket = io(wsUrl, {
        auth: {
          token: localStorage.getItem("token"),
        },
        reconnection: true,
        reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
      });

      socket.on("connect", () => {
        console.log("🔌 WebSocket connected for user:", user.username);
        reconnectAttempts = 0; // Reset counter on success
      });

      socket.on("user:roles_updated", (data) => {
        console.log("🔄 Received user:roles_updated event:", data);
        if (data.userId === user.id) {
          setUser((prevUser) => ({
            ...prevUser,
            roles: data.roles,
          }));
          console.log("✅ User roles updated in AuthContext.");
        }
      });

      socket.on("disconnect", (reason) => {
        console.log("🔌 WebSocket disconnected:", reason);
      });

      socket.on("connect_error", (err) => {
        reconnectAttempts++;
        
        // Only log first 3 attempts to reduce spam
        if (reconnectAttempts <= 3) {
          console.warn(`⚠️ WebSocket error (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}):`, err.message);
        }
        
        // Stop trying after max attempts
        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
          console.error("❌ WebSocket failed after max attempts. Real-time updates disabled.");
          socket.close();
        }
      });

      socket.on("reconnect_failed", () => {
        console.error("❌ WebSocket reconnection failed. Real-time updates disabled.");
      });
    }

    return () => {
      if (socket) {
        console.log("🔌 Disconnecting WebSocket for cleanup.");
        socket.disconnect();
      }
    };
  }, [user]);

  const checkAuth = async () => {
    if (isCheckingAuth.current) {
      console.log("⏭️ Auth check already in progress, skipping");
      return;
    }

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
      
      if (error.response?.status === 429) {
        console.warn("⚠️ Rate limited during auth check. Will retry on next login attempt.");
      } else if (error.response?.status === 401) {
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

      lastAuthCheck.current = Date.now();

      return { success: true };
    } catch (error) {
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