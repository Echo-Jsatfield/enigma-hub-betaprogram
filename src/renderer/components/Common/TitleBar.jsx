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
      className="h-8 bg-[#1b1024] border-b border-[#2c1e3a] flex items-center justify-between px-4 select-none"
      style={{ WebkitAppRegion: "drag" }}
    >
      {/* Left side - Logo */}
      <div className="flex items-center gap-2">
        {showLogo && (
          <span className="text-[#f8cc00] font-bold text-sm">ENIGMA HUB</span>
        )}
      </div>
      
      {/* Window Controls */}
      <div 
        className="flex gap-3"
        style={{ WebkitAppRegion: "no-drag" }}
      >
        <div
          onClick={handleMinimize}
          className="w-4 h-4 bg-purple-500 rounded-full cursor-pointer hover:bg-purple-400 transition-colors"
          style={{ WebkitAppRegion: "no-drag" }}
        />
        <div
          onClick={handleClose}
          className="w-4 h-4 bg-red-500 rounded-full cursor-pointer hover:bg-red-400 transition-colors"
          style={{ WebkitAppRegion: "no-drag" }}
        />
      </div>
    </div>
  );
}