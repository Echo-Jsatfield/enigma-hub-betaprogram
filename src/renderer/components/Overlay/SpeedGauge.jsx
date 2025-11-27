// src/renderer/components/Overlay/SpeedGauge.jsx
import React from "react";
import { Gauge } from "lucide-react";

export default function SpeedGauge({ speed, gear, rpm }) {
  const speedKmh = Math.round(speed);
  const maxSpeed = 140;
  const speedPercent = Math.min((speedKmh / maxSpeed) * 100, 100);

  const rpmPercent = Math.min((rpm / 3000) * 100, 100);

  const getSpeedColor = () => {
    if (speedKmh < 50) return 'from-green-500 to-emerald-400';
    if (speedKmh < 90) return 'from-yellow-500 to-amber-400';
    return 'from-red-500 to-orange-400';
  };

  return (
    <div className="bg-black/30 rounded-xl p-4 border border-purple-500/10">
      
      {/* Speed Display */}
      <div className="text-center mb-4">
        <div className="text-6xl font-bold text-white tabular-nums leading-none">
          {speedKmh}
        </div>
        <div className="text-sm text-gray-400 mt-1">km/h</div>
      </div>

      {/* Speed Bar */}
      <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden mb-4">
        <div 
          className={`h-full bg-gradient-to-r ${getSpeedColor()} transition-all duration-100`}
          style={{ width: `${speedPercent}%` }}
        />
      </div>

      {/* Gear & RPM */}
      <div className="grid grid-cols-2 gap-3">
        
        {/* Gear */}
        <div className="bg-black/40 rounded-lg p-3 border border-purple-500/10">
          <div className="text-xs text-gray-400 mb-1">Gear</div>
          <div className="text-2xl font-bold text-white tabular-nums">
            {gear === 0 ? 'N' : gear < 0 ? 'R' : gear}
          </div>
        </div>

        {/* RPM */}
        <div className="bg-black/40 rounded-lg p-3 border border-purple-500/10">
          <div className="text-xs text-gray-400 mb-1">RPM</div>
          <div className="text-lg font-bold text-white tabular-nums">
            {Math.round(rpm)}
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1 mt-2 overflow-hidden">
            <div 
              className={`h-full transition-all duration-100 ${
                rpmPercent > 80 ? 'bg-red-500' : rpmPercent > 60 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${rpmPercent}%` }}
            />
          </div>
        </div>

      </div>
    </div>
  );
}