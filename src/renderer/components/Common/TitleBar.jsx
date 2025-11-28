// src/components/Common/TitleBar.jsx
import React from "react";

export default function TitleBar({ showLogo = true }) {
  const handleMinimize = () => {
    console.log("MINIMIZE CLICKED!");
    if (window.electronAPI?.minimizeWindow) {
      window.electronAPI.minimizeWindow();
    } else {
      console.error("electronAPI.minimizeWindow not available");
    }
  };

  const handleClose = () => {
    console.log("CLOSE CLICKED!");
    if (window.electronAPI?.closeWindow) {
      window.electronAPI.closeWindow();
    } else {
      console.error("electronAPI.closeWindow not available");
    }
  };

  return (
    <div
      className="h-8 flex items-center justify-between px-4 select-none shadow-lg border-b"
      style={{
        WebkitAppRegion: "drag",
        background: "#0b0c1a", // match auth panel background
        borderColor: "#2d1b5c",
        backdropFilter: "blur(8px)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.45)"
      }}
    >
      {/* Left side - Logo */}
      <div className="flex items-center gap-2">
        {showLogo && (
          <span
            className="font-bold text-sm tracking-wide"
            style={{
              color: "#f8cc00",                // your gold accent
              textShadow: "0 0 6px rgba(248, 204, 0, 0.4)"
            }}
          >
            ENIGMA HUB
          </span>
        )}
      </div>

      {/* Window Controls */}
      <div
        className="flex gap-3"
        style={{ WebkitAppRegion: "no-drag" }}
      >
        {/* Minimize */}
        <div
          onClick={handleMinimize}
          className="w-4 h-4 rounded-full cursor-pointer transition-all"
          title="Minimize"
          style={{
            WebkitAppRegion: "no-drag",
            backgroundColor: "#6A0DAD",          // brand purple
            border: "1px solid #9e4ce6",         // lighter purple ring
            boxShadow: "0 0 6px rgba(106, 13, 173, 0.5)"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#8d24ff"; // lighter purple hover
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#6A0DAD";
          }}
        />

        {/* Close */}
        <div
          onClick={handleClose}
          className="w-4 h-4 rounded-full cursor-pointer transition-all"
          title="Close"
          style={{
            WebkitAppRegion: "no-drag",
            backgroundColor: "#e43445",
            border: "1px solid #ff6b7a",
            boxShadow: "0 0 6px rgba(255, 60, 60, 0.5)"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#ff4a59";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#e43445";
          }}
        />
      </div>
    </div>
  );
}
