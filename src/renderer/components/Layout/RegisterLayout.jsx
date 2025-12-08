// src/renderer/components/Layout/RegisterLayout.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import TitleBar from "../Common/TitleBar";
import Icon from "../../../assets/icon.ico";
import HolidayIcon from "../../../components/Holiday/HolidayIcon.jsx";
import HolidayLogo from "../../../assets/logo-wreath.png";
import HeroBg from "../../../assets/christmas-bg.svg";

export default function RegisterLayout() {
  const { setAuthMode, register, error, setError, loading } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    inviteCode: "",
  });
  const [localError, setLocalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setLocalError("");
    setError(null);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLocalError("");
    setSuccessMessage("");
    setError(null);

    if (!formData.username || !formData.password || !formData.inviteCode) {
      setLocalError("Please fill in all required fields");
      return;
    }

    if (formData.username.length < 3) {
      setLocalError("Username must be at least 3 characters");
      return;
    }

    if (formData.password.length < 8) {
      setLocalError("Password must be at least 8 characters");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }

        console.log("[Auth] Attempting registration...");

    const result = await register(
      formData.username,
      formData.password,
      formData.inviteCode
    );

    if (result.success) {
      setSuccessMessage(
        result.requiresApproval
          ? "Registration successful! Please wait for admin approval before logging in."
          : "Registration successful! You can now login."
      );
      
      setFormData({
        username: "",
        password: "",
        confirmPassword: "",
        inviteCode: "",
      });

      setTimeout(() => {
        setAuthMode("login");
      }, 3000);
    } else {
      setLocalError(result.error || "Registration failed. Please try again.");
    }
  };

  return (
    <div className="auth-shell h-screen w-screen flex flex-col overflow-hidden bg-[#0b0c1a]">
      <TitleBar />

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDE - Truck Image Section */}
        <div
          className="auth-hero hidden lg:flex lg:w-1/2 relative overflow-hidden"
          style={{
            backgroundImage: `url(${HeroBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Gradient Background */}
          <div className="auth-hero-overlay absolute inset-0 bg-gradient-to-br from-[#2a0e4a] via-[#1b1024] to-[#12051a]" />
          
          {/* Animated Glows */}
          <div className="absolute top-16 left-12 w-96 h-96 bg-[#6A0DAD]/25 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-14 right-16 w-80 h-80 bg-[#f8cc00]/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          
          {/* Content */}
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
                className="w-28 h-28 mb-6 drop-shadow-xl mx-auto"
              />
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-[#6A0DAD] to-[#f8cc00] bg-clip-text text-transparent">
                ENIGMA HUB
              </h1>
              <p className="text-xl text-gray-400">
                Join the Ultimate VTC Platform
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="space-y-4 text-left"
            >
              <div className="flex items-center gap-3 text-gray-300">
                <span className="text-2xl">&#9889;</span>
                <span>Track your driving career</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <span className="text-2xl">&#128230;</span>
                <span>Join a virtual trucking company and community</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <span className="text-2xl">&#128666;</span>
                <span>Compete on leaderboards and events</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <span className="text-2xl">&#127942;</span>
                <span>Connect with drivers worldwide</span>
              </div>
            </motion.div>
          </div>
        </div>
        <div className="auth-panel w-full lg:w-1/2 flex items-center justify-center bg-[#16162a] p-8 relative overflow-y-auto">
          {/* Background glow for mobile */}
          <div className="lg:hidden absolute inset-0 bg-gradient-to-br from-[#2a1357]/20 to-transparent" />
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md relative z-10 py-8"
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
              Create your account
            </h2>
            <p className="text-gray-400 mb-8">
              Join Enigma Hub and start tracking your career
            </p>

            {/* Error Message */}
            {(localError || error) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm"
              >
                {localError || error}
              </motion.div>
            )}

            {/* Success Message */}
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg text-sm"
              >
                {successMessage}
              </motion.div>
            )}

            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Username <span className="text-[#fbbf24]">*</span>
                </label>
                <input
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Choose a username (3+ characters)"
                  className="w-full bg-[#0b0c1a] border border-[#2d1b5c] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#a855f7] transition disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password <span className="text-[#fbbf24]">*</span>
                </label>
                <input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Create a password (8+ characters)"
                  className="w-full bg-[#0b0c1a] border border-[#2d1b5c] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#a855f7] transition disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm Password <span className="text-[#fbbf24]">*</span>
                </label>
                <input
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Confirm your password"
                  className="w-full bg-[#0b0c1a] border border-[#2d1b5c] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#a855f7] transition disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Invite Code <span className="text-[#fbbf24]">*</span>
                </label>
                <input
                  name="inviteCode"
                  type="text"
                  value={formData.inviteCode}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Enter your invite code"
                  className="w-full bg-[#0b0c1a] border border-[#2d1b5c] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#a855f7] transition disabled:opacity-50"
                />
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-2">
                  <span>ℹ️</span>
                  <span>You need an invite code from an admin to register</span>
                </p>
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="auth-btn w-full bg-gradient-to-r from-[#6A0DAD] to-[#f8cc00] text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-[#6A0DAD]/50 mt-6"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating account...
                  </span>
                ) : (
                  "Create Account"
                )}
              </motion.button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-400">
                Already have an account?{" "}
                <button
                  onClick={() => !loading && setAuthMode("login")}
                  disabled={loading}
                  className="text-[#f8cc00] hover:text-[#ffdb4d] font-medium transition disabled:opacity-50"
                >
                  Sign in here
                </button>
              </p>
            </div>

            {/* Footer Links */}
            <div className="mt-8 text-center text-sm text-gray-500 space-y-2">
              <p>Privacy Policy · Terms and Conditions</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}






