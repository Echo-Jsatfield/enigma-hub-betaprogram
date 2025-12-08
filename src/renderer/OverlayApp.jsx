// src/renderer/OverlayApp.jsx
import React, { useState, useEffect } from "react";
import TruckStats from "./components/Overlay/TruckStats";
import JobInfo from "./components/Overlay/JobInfo";
import SpeedGauge from "./components/Overlay/SpeedGauge";

const achievementSound = "/assets/audio/enigmaachievementsound.mp3";

export default function OverlayApp() {
  const [telemetryData, setTelemetryData] = useState({
    speed: 0,
    gear: 0,
    rpm: 0,
    fuel: 0,
    fuelCapacity: 100,
    damage: 0,
    gameTime: "00:00",
    connected: false
  });

  const [jobData, setJobData] = useState({
    active: false,
    cargo: null,
    pickup: null,
    delivery: null,
    distance: 0,
    remainingDistance: 0,
    income: 0
  });

  const [minimized, setMinimized] = useState(false);
  const [achievementToast, setAchievementToast] = useState(null);

  useEffect(() => {
    if (window.electronOverlay) {
      window.electronOverlay.onTelemetryUpdate((data) => {
        setTelemetryData(prev => ({
          ...prev,
          ...data,
          connected: true
        }));
      });

      window.electronOverlay.onJobUpdate((data) => {
        setJobData(prev => ({
          ...prev,
          ...data
        }));
      });

      if (window.electronOverlay.onAchievementUnlock) {
        window.electronOverlay.onAchievementUnlock((data) => {
          setAchievementToast(data);

          try {
            const audio = new Audio(achievementSound);
            audio.volume = 0.65;
            audio.play().catch((err) => {
              console.warn("[Overlay] Achievement audio blocked:", err?.message);
            });
          } catch (err) {
            console.warn("[Overlay] Achievement audio init failed:", err?.message);
          }

          setTimeout(() => setAchievementToast(null), 4000);
        });
      }
    }

    const handleKeyDown = (e) => {
      if (e.key === 'm' && e.altKey) {
        e.preventDefault();
        setMinimized(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (minimized) {
    return (
      <div className="fixed top-4 right-4 bg-black/80 backdrop-blur-md rounded-lg p-3 border border-purple-500/30 cursor-pointer hover:bg-black/90 transition-all"
           onClick={() => setMinimized(false)}>
        <div className="text-white text-sm font-medium">
          E-HUB Overlay
        </div>
        <div className="text-gray-400 text-xs mt-1">
          Alt+M to expand
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-4 select-none">
      {achievementToast && (
        <div className="pointer-events-none fixed top-6 left-1/2 -translate-x-1/2 z-[99999] drop-shadow-xl">
          <div className="min-w-[320px] rounded-xl border border-[#6A0DAD] bg-gradient-to-r from-[#2a0e4a]/90 via-[#1b1024]/90 to-[#c4172e]/90 text-white shadow-2xl shadow-black/50 px-4 py-3 backdrop-blur-lg">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-lg bg-black/30 border border-white/10 flex items-center justify-center text-xl">
                {achievementToast.icon || "★"}
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-amber-200">
                  Achievement Unlocked
                </p>
                <p className="text-sm font-semibold leading-tight">
                  {achievementToast.name || achievementToast.key}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-200/90 mt-2 line-clamp-2">
              {achievementToast.description || "Achievement unlocked!"}
            </p>
          </div>
        </div>
      )}

      <div className="w-full h-full bg-black/40 backdrop-blur-lg rounded-2xl border border-purple-500/20 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 px-4 py-3 border-b border-purple-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-white font-semibold text-sm">E-HUB Telemetry</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMinimized(true)}
              className="text-gray-400 hover:text-white text-xs px-2 py-1 rounded hover:bg-white/10 transition-all"
            >
              Alt+M
            </button>
            <div className={`text-xs px-2 py-1 rounded ${telemetryData.connected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {telemetryData.connected ? 'Connected' : 'Disconnected'}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 h-[calc(100%-60px)] overflow-y-auto">
          
          {/* Speed Gauge */}
          <SpeedGauge 
            speed={telemetryData.speed} 
            gear={telemetryData.gear}
            rpm={telemetryData.rpm}
          />

          {/* Truck Stats */}
          <TruckStats 
            fuel={telemetryData.fuel}
            fuelCapacity={telemetryData.fuelCapacity}
            damage={telemetryData.damage}
            gameTime={telemetryData.gameTime}
          />

          {/* Job Info */}
          {jobData.active && (
            <JobInfo jobData={jobData} />
          )}

        </div>
      </div>
    </div>
  );
}
