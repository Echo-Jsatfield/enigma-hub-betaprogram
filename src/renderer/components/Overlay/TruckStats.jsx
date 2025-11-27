// src/renderer/components/Overlay/TruckStats.jsx
import React from "react";
import { Fuel, Wrench, Clock } from "lucide-react";

export default function TruckStats({ fuel, fuelCapacity, damage, gameTime }) {
  const fuelPercent = (fuel / fuelCapacity) * 100;
  const damagePercent = damage * 100;

  return (
    <div className="bg-black/30 rounded-xl p-4 border border-purple-500/10">
      <h3 className="text-white text-sm font-semibold mb-3">Truck Status</h3>
      
      <div className="space-y-3">
        
        {/* Fuel */}
        <div className="flex items-center gap-3">
          <Fuel className="w-4 h-4 text-blue-400" />
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-300">Fuel</span>
              <span className="text-white font-medium">{Math.round(fuelPercent)}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-300"
                style={{ width: `${fuelPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Damage */}
        <div className="flex items-center gap-3">
          <Wrench className="w-4 h-4 text-red-400" />
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-300">Damage</span>
              <span className="text-white font-medium">{damagePercent.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-red-500 to-orange-400 transition-all duration-300"
                style={{ width: `${damagePercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Game Time */}
        <div className="flex items-center gap-3">
          <Clock className="w-4 h-4 text-purple-400" />
          <div className="flex-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-300">Game Time</span>
              <span className="text-white font-medium">{gameTime}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}