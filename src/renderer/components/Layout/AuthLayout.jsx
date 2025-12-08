// src/renderer/components/Layout/AuthLayout.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import TitleBar from "../Common/TitleBar";
import Icon from "../../../assets/icon.ico";
import HolidayIcon from "../../../components/Holiday/HolidayIcon.jsx";
import HolidayLogo from "../../../assets/logo-wreath.png";
import HeroBg from "../../../assets/christmas-bg.svg";

export default function AuthLayout() {
  const { setAuthMode, login, error, setError, loading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const errorMessage = localError || error;
  const showErrorState = Boolean(errorMessage);

  useEffect(() => {
    setUsername("");
    setPassword("");
    setLocalError("");
    setSuccessMessage("");
    setError(null);
  }, [setError]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (busy || loading) return;
    setBusy(true);

    setLocalError("");
    setSuccessMessage("");
    setError(null);

    if (!username || !password) {
      setLocalError("Please enter both username and password");
      setBusy(false);
      return;
    }

    console.log("[Auth] Attempting login...");
    const result = await login(username, password);

    if (result.success) {
      setSuccessMessage("Login successful! Redirecting...");
    } else {
      setLocalError(
        result.message || result.error || "Invalid username or password."
      );
      setPassword("");
    }

    setBusy(false);
  };

  return (
    <div className="auth-shell h-screen w-screen flex flex-col overflow-hidden bg-[#0b0c1a]">
      <TitleBar />

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDE - Hero */}
        <div
          className="auth-hero hidden lg:flex lg:w-1/2 relative overflow-hidden"
          style={{
            backgroundImage: `url(${HeroBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="auth-hero-overlay absolute inset-0 bg-gradient-to-br from-[#2a0e4a] via-[#1b1024] to-[#12051a]" />
          <div className="absolute top-16 left-12 w-96 h-96 bg-[#6A0DAD]/25 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-14 right-16 w-80 h-80 bg-[#f8cc00]/15 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          />

          <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="mb-8 flex flex-col items-center"
            >
              <HolidayIcon
                defaultSrc={Icon}
                holidaySrc={HolidayLogo}
                alt="Enigma Hub"
                className="w-28 h-28 mb-6 drop-shadow-x1 mx-auto"
              />
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-[#6A0DAD] to-[#f8cc00] bg-clip-text text-transparent">
                ENIGMA HUB
              </h1>
              <p className="text-xl text-gray-400">
                The Ultimate VTC Management Platform
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="space-y-4 text-left"
            >
              <div className="flex items-center gap-3 text-gray-300">
                <span className="text-2xl">⚡</span>
                <span>Real-time telemetry tracking</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <span className="text-2xl">📦</span>
                <span>Advanced job management</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <span className="text-2xl">🚚</span>
                <span>VTC hub integration</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <span className="text-2xl">🏆</span>
                <span>Competitive leaderboards</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* RIGHT SIDE - Login Form */}
        <div className="auth-panel w-full lg:w-1/2 flex items-center justify-center bg-[#16162a] p-8 relative">
          <div className="lg:hidden absolute inset-0 bg-gradient-to-br from-[#2a1357]/20 to-transparent" />

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md relative z-10"
          >
            {/* Logo for mobile */}
            <div className="lg:hidden text-center mb-8">
              <HolidayIcon
                defaultSrc={Icon}
                holidaySrc={HolidayLogo}
                alt="Enigma Hub"
                className="mx-auto w-16 h-16 mb-4 drop-shadow-xl"
              />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#6A0DAD] to-[#f8cc00] bg-clip-text text-transparent">
                ENIGMA HUB
              </h1>
            </div>

            <h2 className="text-3xl font-bold text-white mb-2">
              Sign in to Enigma Hub
            </h2>
            <p className="text-gray-400 mb-8">
              Welcome back! Please enter your details.
            </p>

            {showErrorState && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm"
              >
                {errorMessage}
              </motion.div>
            )}

            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg text-sm"
              >
                {successMessage}
              </motion.div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading || busy}
                  autoComplete="username"
                  aria-invalid={showErrorState}
                  className={`w-full bg-[#0b0c1a] border ${
                    showErrorState ? "border-red-500/70" : "border-[#2d1b5c]"
                  } text-white rounded-lg px-4 py-3 focus:outline-none transition disabled:opacity-50 ${
                    showErrorState
                      ? "focus:border-red-400 focus:ring-1 focus:ring-red-400/50"
                      : "focus:border-[#a855f7]"
                  }`}
                  placeholder="Enter your username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading || busy}
                  autoComplete="current-password"
                  aria-invalid={showErrorState}
                  className={`w-full bg-[#0b0c1a] border ${
                    showErrorState ? "border-red-500/70" : "border-[#2d1b5c]"
                  } text-white rounded-lg px-4 py-3 focus:outline-none transition disabled:opacity-50 ${
                    showErrorState
                      ? "focus:border-red-400 focus:ring-1 focus:ring-red-400/50"
                      : "focus:border-[#a855f7]"
                  }`}
                  placeholder="Enter your password"
                />
                {showErrorState && (
                  <p className="mt-2 text-sm text-red-400">
                    {errorMessage || "Invalid username or password."}
                  </p>
                )}
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading || busy}
                className="auth-btn w-full bg-gradient-to-r from-[#6A0DAD] to-[#f8cc00] text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-[#6A0DAD]/50"
              >
                {loading || busy ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </motion.button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-400">
                Don't have an account?{" "}
                <button
                  onClick={() => !(loading || busy) && setAuthMode("register")}
                  disabled={loading || busy}
                  className="text-[#f8cc00] hover:text-[#ffdb4d] font-medium transition disabled:opacity-50"
                >
                  Register here
                </button>
              </p>
            </div>

            <div className="mt-12 text-center text-sm text-gray-500 space-y-2">
              <p>Privacy Policy &amp; Terms and Conditions</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
