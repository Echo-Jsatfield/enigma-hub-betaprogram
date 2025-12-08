import React from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function AchievementModal({ achievement, onClose }) {
  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[99992] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        >
          <div className="w-full max-w-md rounded-2xl bg-[#0d0b16] text-slate-100 border border-slate-700/60 shadow-2xl p-6 relative">
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-slate-400 hover:text-white text-sm"
            >
              Close
            </button>

            <div className="text-4xl mb-3">{achievement.icon || "🏅"}</div>
            <h3 className="text-xl font-semibold mb-1">
              {achievement.name || "Hidden Achievement"}
            </h3>
            <p className="text-sm text-slate-300 mb-3">
              {achievement.description || "Unlock to reveal details."}
            </p>

            <div className="text-xs text-slate-400 space-y-1">
              <div>
                <span className="font-semibold text-slate-200">Status:</span>{" "}
                {achievement.unlocked ? "Unlocked" : "Locked"}
              </div>
              {achievement.unlocked_at && (
                <div>
                  <span className="font-semibold text-slate-200">Unlocked At:</span>{" "}
                  {new Date(achievement.unlocked_at).toLocaleString()}
                </div>
              )}
              <div>
                <span className="font-semibold text-slate-200">Category:</span>{" "}
                {achievement.category || "N/A"}
              </div>
              <div>
                <span className="font-semibold text-slate-200">Type:</span>{" "}
                {achievement.type || "N/A"}
              </div>
              {!achievement.hidden && achievement.requirement && (
                <div>
                  <span className="font-semibold text-slate-200">Requirement:</span>{" "}
                  <code className="text-amber-200">
                    {JSON.stringify(achievement.requirement)}
                  </code>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
