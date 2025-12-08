import { useSettings } from "../context/SettingsContext.jsx";

export function useHolidayMode() {
  const { holidayMode, setHolidayMode, toggleHolidayMode } = useSettings();
  return { holidayMode, setHolidayMode, toggleHolidayMode };
}
