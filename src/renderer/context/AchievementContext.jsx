import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import api from "../services/api";
import { useAuth } from "./AuthContext";
import AchievementPopup from "../components/Achievements/AchievementPopup";
import AchievementReminder from "../components/Notifications/AchievementReminder";
import AchievementGallery from "../components/Achievements/AchievementGallery";

const AchievementContext = createContext();
const REMINDER_KEY = "achievement.reminder.hidden";

export const useAchievements = () => {
  const ctx = useContext(AchievementContext);
  if (!ctx) throw new Error("useAchievements must be used within AchievementProvider");
  return ctx;
};

export function AchievementProvider({ children }) {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(false);

  const [popupQueue, setPopupQueue] = useState([]);
  const [currentPopup, setCurrentPopup] = useState(null);
  const [showReminder, setShowReminder] = useState(false);
  const [devPanelOpen, setDevPanelOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState(null);

  const reminderHidden = useMemo(
    () => localStorage.getItem(REMINDER_KEY) === "true",
    []
  );

  const sendOverlayToast = (achievement) => {
    if (!achievement) return;
    try {
      window.electronAPI?.achievementToast?.(achievement);
    } catch (err) {
      console.warn("[Achievements] Overlay toast failed:", err?.message);
    }
  };

  // Fetch achievements when user changes
  useEffect(() => {
    if (!user) {
      setAchievements([]);
      return;
    }
    fetchAchievements();
  }, [user]);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const res = await api.get("/achievements/me");
      const list = res.data?.achievements || [];
      setAchievements(list);
    } catch (err) {
      console.error("[Achievements] Failed to fetch:", err);
    } finally {
      setLoading(false);
    }
  };

  // Queue popups for new unlocks
  const enqueuePopup = (unlockedList) => {
    const newlyUnlocked = unlockedList.filter((a) => a.unlocked && !achievements.find((x) => x.key === a.key && x.unlocked));
    if (newlyUnlocked.length) {
      setPopupQueue((q) => [...q, ...newlyUnlocked]);
      newlyUnlocked.forEach(sendOverlayToast);
    }
    setAchievements(unlockedList);
  };

  // handle queue processing
  useEffect(() => {
    if (!currentPopup && popupQueue.length > 0) {
      const [next, ...rest] = popupQueue;
      setCurrentPopup(next);
      setPopupQueue(rest);
      const timer = setTimeout(() => {
        setCurrentPopup(null);
        if (!reminderHidden) setShowReminder(true);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [currentPopup, popupQueue, reminderHidden]);

  const unlockAchievement = async (key) => {
    if (!key) return;
    try {
      const res = await api.post("/achievements/unlock", { key });
      const list = res.data?.achievements || [];
      enqueuePopup(list);
      return list;
    } catch (err) {
      console.error("[Achievements] Unlock failed:", err);
      throw err;
    }
  };

  const devUnlock = async (key) => {
    try {
      const res = await api.post("/achievements/test", { key });
      const list = res.data?.achievements || [];
      // Always enqueue the selected achievement for test unlocks (even if already unlocked)
      const target = list.find((a) => a.key === key);
      if (target) {
        setPopupQueue((q) => [...q, target]);
        sendOverlayToast(target);
      }
      enqueuePopup(list);
    } catch (err) {
      console.error("[Achievements] Dev unlock failed:", err);
    }
  };

  const devClear = async () => {
    try {
      const res = await api.post("/achievements/test/clear");
      const list = res.data?.achievements || [];
      setAchievements(list);
      setPopupQueue([]);
      setCurrentPopup(null);
    } catch (err) {
      console.error("[Achievements] Dev clear failed:", err);
    }
  };

  // Hotkey: CTRL + SHIFT + T to toggle dev panel
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key?.toUpperCase() === "T") {
        setDevPanelOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const hideReminder = () => {
    setShowReminder(false);
    localStorage.setItem(REMINDER_KEY, "true");
  };

  const value = {
    achievements,
    loading,
    fetchAchievements,
    unlockAchievement,
    devUnlock,
    devClear,
    devPanelOpen,
    setDevPanelOpen,
    openGallery: () => setGalleryOpen(true),
    closeGallery: () => {
      setGalleryOpen(false);
      setSelectedAchievement(null);
    },
  };

  return (
    <AchievementContext.Provider value={value}>
      {children}

      {/* Popups */}
      <AchievementPopup achievement={currentPopup} />
      <AchievementReminder
        open={showReminder && !reminderHidden}
        onClose={() => setShowReminder(false)}
        onHide={hideReminder}
      />

      <AchievementGallery
        achievements={achievements}
        open={galleryOpen}
        onClose={() => {
          setGalleryOpen(false);
          setSelectedAchievement(null);
        }}
        onSelect={setSelectedAchievement}
        selected={selectedAchievement}
      />

      {/* Dev panel */}
      {devPanelOpen && (
        <AchievementDevPanel
          achievements={achievements}
          onUnlock={devUnlock}
          onClose={() => setDevPanelOpen(false)}
        />
      )}
    </AchievementContext.Provider>
  );
}

function AchievementDevPanel({ achievements, onUnlock, onClose }) {
  const [selected, setSelected] = useState("");
  const ctx = useAchievements();

  return (
    <div className="fixed bottom-4 left-4 z-[99999] w-72 rounded-xl border border-slate-700/70 bg-[#0b0c1a]/95 shadow-2xl shadow-black/60 backdrop-blur-md text-slate-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold">Achievement Test</div>
        <button
          onClick={onClose}
          className="text-xs text-slate-400 hover:text-white"
        >
          Close
        </button>
      </div>
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="w-full bg-[#120b1f] border border-slate-700 rounded-lg px-3 py-2 text-sm mb-3"
      >
        <option value="">Select achievement</option>
        {achievements.map((a) => (
          <option key={a.key} value={a.key}>
            {a.name || a.key}
          </option>
        ))}
      </select>
      <button
        onClick={() => selected && onUnlock(selected)}
        className="w-full py-2 rounded-lg bg-gradient-to-r from-[#6A0DAD] to-[#f8cc00] text-sm font-semibold text-white shadow"
      >
        Unlock Achievement (Test)
      </button>
      <button
        onClick={() => ctx.devClear()}
        className="mt-2 w-full py-2 rounded-lg bg-red-600/90 hover:bg-red-600 text-sm font-semibold text-white shadow"
      >
        Clear All (Test)
      </button>
      <p className="text-[11px] text-slate-400 mt-2">
        Hotkey: CTRL + SHIFT + T
      </p>
    </div>
  );
}
