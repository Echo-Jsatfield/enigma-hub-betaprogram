import React from "react";
import AchievementModal from "./AchievementModal";

export default function AchievementGallery({
  achievements = [],
  open,
  onClose,
  onSelect,
  selected,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[99990] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="relative bg-[#0d0b16] text-slate-100 rounded-2xl border border-slate-700/60 shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/60">
          <div>
            <p className="text-lg font-semibold">Achievements</p>
            <p className="text-xs text-slate-400">
              Unlocked achievements are highlighted. Hidden ones stay secret until earned.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-sm text-slate-300 hover:text-white px-3 py-1 rounded-lg bg-white/5"
          >
            Close
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 overflow-y-auto max-h-[70vh]">
          {achievements.map((a) => (
            <button
              key={a.key}
              onClick={() => onSelect(a)}
              className={`rounded-xl p-3 text-left border transition ${
                a.unlocked
                  ? "bg-gradient-to-br from-[#2a0e4a] to-[#c4172e] border-amber-400/60 text-white"
                  : "bg-[#120b1f] border-slate-700/60 text-slate-400"
              } hover:translate-y-[-2px] hover:shadow-lg`}
            >
              <div className="text-2xl mb-2">{a.icon || "🏅"}</div>
              <div className="text-sm font-semibold line-clamp-1">
                {a.name || "Hidden Achievement"}
              </div>
              <div className="text-xs text-slate-300 line-clamp-2">
                {a.description || "Unlock to reveal details"}
              </div>
            </button>
          ))}
        </div>
      </div>

      <AchievementModal achievement={selected} onClose={() => onSelect(null)} />
    </div>
  );
}
