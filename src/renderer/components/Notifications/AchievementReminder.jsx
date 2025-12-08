import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function AchievementReminder({ open, onClose, onHide }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed top-4 right-4 z-[99997]"
        >
          <div className="w-80 rounded-xl border border-amber-400/60 bg-[#0b0c1a]/95 text-white shadow-lg shadow-black/50 p-4">
            <p className="text-sm font-semibold mb-1">
              You unlocked a new achievement!
            </p>
            <p className="text-xs text-slate-300 mb-3">
              Check your profile to view your latest unlocks.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-3 py-1 text-xs rounded-lg bg-white/10 hover:bg-white/20"
              >
                Dismiss
              </button>
              <button
                onClick={onHide}
                className="px-3 py-1 text-xs rounded-lg bg-amber-500 text-black font-semibold hover:bg-amber-400"
              >
                Don’t show again
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
