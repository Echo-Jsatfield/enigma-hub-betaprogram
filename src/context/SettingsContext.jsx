import React, { createContext, useContext, useEffect, useState } from "react";

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [globalHolidayMode, setGlobalHolidayMode] = useState(false);
  const [localHolidayMode, setLocalHolidayMode] = useState(false);

  const holidayMode = globalHolidayMode || localHolidayMode;

  const value = {
    globalHolidayMode,
    localHolidayMode,
    holidayMode,
    setHolidayMode: (val) => setLocalHolidayMode(Boolean(val)),
    toggleHolidayMode: () => setLocalHolidayMode((prev) => !prev),
  };

  // Pull global holiday mode from backend; backend "true" forces it on
  useEffect(() => {
    let intervalId;

    const fetchTheme = async () => {
      try {
        const res = await fetch("/api/settings/theme");
        if (!res.ok) return;
        const data = await res.json();
        setGlobalHolidayMode(data.holidayMode === true);
      } catch (err) {
        console.error("Failed to fetch global theme:", err);
      }
    };

    fetchTheme();
    intervalId = setInterval(fetchTheme, 600000); // every 10 minutes

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return ctx;
}
