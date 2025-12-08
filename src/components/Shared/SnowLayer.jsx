import React from "react";
import Snowfall from "react-snowfall";
import { useSettings } from "../../context/SettingsContext.jsx";

export default function SnowLayer() {
  const { holidayMode } = useSettings();

  if (!holidayMode) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999]">
      <Snowfall snowflakeCount={20} />
    </div>
  );
}
