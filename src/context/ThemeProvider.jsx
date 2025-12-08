import React, { useEffect } from "react";
import { useSettings } from "./SettingsContext.jsx";
import SnowLayer from "../components/Shared/SnowLayer";
import "../theme";

export default function ThemeProvider({ children }) {
  const { holidayMode } = useSettings();

  useEffect(() => {
    const body = document.body;
    if (holidayMode) {
      body.classList.add("holiday");
    } else {
      body.classList.remove("holiday");
    }
  }, [holidayMode]);

  return (
    <>
      {children}
      <SnowLayer />
    </>
  );
}
