import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Public asset path (place the file in public/assets/audio/)
const soundSrc = "/assets/audio/enigmaachievementsound.mp3";

export default function AchievementPopup({ achievement }) {
  useEffect(() => {
    if (!achievement) return;
    try {
      const audio = new Audio(soundSrc);
      audio.volume = 0.6;
      audio.play().catch((err) => {
        console.warn("[Achievements] Audio blocked or missing:", err?.message);
      });
    } catch (err) {
      console.warn("[Achievements] Audio init failed:", err?.message);
    }
  }, [achievement]);

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed bottom-5 right-5 z-[999999]"
        >
          <div className="w-72 rounded-xl border border-[#6A0DAD] bg-gradient-to-r from-[#2a0e4a] via-[#1b1024] to-[#c4172e] text-white shadow-2xl shadow-black/60 p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-black/30 border border-white/10 flex items-center justify-center text-xl">
                {achievement.icon || "🏅"}
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-amber-200">
                  Achievement Unlocked
                </p>
                <p className="text-sm font-semibold">{achievement.name}</p>
              </div>
            </div>
            <p className="text-xs text-slate-200/90 mt-2 line-clamp-2">
              {achievement.description || "Achievement unlocked!"}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
