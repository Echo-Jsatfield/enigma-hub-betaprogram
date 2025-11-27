// src/renderer/OverlayApp.jsx
import React, { useState, useEffect } from "react";
import TruckStats from "./components/Overlay/TruckStats";
import JobInfo from "./components/Overlay/JobInfo";
import SpeedGauge from "./components/Overlay/SpeedGauge";

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