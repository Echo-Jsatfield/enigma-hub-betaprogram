import React from "react";
import { useSettings } from "../../context/SettingsContext.jsx";
import holidayLogo from "../../assets/logo-wreath.png";

/**
 * Wraps icons/logos so holiday variants can be swapped in without
 * changing callers. Provide a defaultSrc to render when holiday mode
 * is disabled.
 */
export default function HolidayIcon({
  defaultSrc,
  holidaySrc = holidayLogo,
  alt = "",
  className = "",
  size = "",
}) {
  const { holidayMode } = useSettings();
  const src = holidayMode ? holidaySrc : defaultSrc;

  if (!src) return null;
  const sizeClasses = size ? size : "";
  return <img src={src} alt={alt} className={`${sizeClasses} ${className}`.trim()} />;
}
