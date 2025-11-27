// src/renderer/components/Overlay/JobInfo.jsx
import React from "react";
import { Package, MapPin, TrendingUp, Navigation } from "lucide-react";

export default function JobInfo({ jobData }) {
  const progress = jobData.distance > 0 
    ? ((jobData.distance - jobData.remainingDistance) / jobData.distance) * 100 
    : 0;

  return (
    <div className="bg-black/30 rounded-xl p-4 border border-purple-500/10">
      <h3 className="text-white text-sm font-semibold mb-3">Active Job</h3>
      
      <div className="space-y-3">
        
        {/* Cargo */}
        <div className="flex items-start gap-3">
          <Package className="w-4 h-4 text-purple-400 mt-0.5" />
          <div className="flex-1">
            <div className="text-xs text-gray-400">Cargo</div>
            <div className="text-sm text-white font-medium">{jobData.cargo || 'Unknown'}</div>
          </div>
        </div>

        {/* Route */}
        <div className="flex items-start gap-3">
          <MapPin className="w-4 h-4 text-green-400 mt-0.5" />
          <div className="flex-1">
            <div className="text-xs text-gray-400">Route</div>
            <div className="text-sm text-white font-medium">
              {jobData.pickup} → {jobData.delivery}
            </div>
          </div>
        </div>

        {/* Distance Progress */}
        <div className="flex items-start gap-3">
          <Navigation className="w-4 h-4 text-blue-400 mt-0.5" />
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">Distance</span>
              <span className="text-white font-medium">
                {Math.round(jobData.remainingDistance)} / {Math.round(jobData.distance)} km
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Income */}
        <div className="flex items-start gap-3">
          <TrendingUp className="w-4 h-4 text-yellow-400 mt-0.5" />
          <div className="flex-1">
            <div className="text-xs text-gray-400">Expected Income</div>
            <div className="text-sm text-white font-medium">
              ${jobData.income.toLocaleString()}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}