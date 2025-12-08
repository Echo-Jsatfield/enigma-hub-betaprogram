// src/renderer/index.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { SettingsProvider } from "../context/SettingsContext.jsx";
import ThemeProvider from "../context/ThemeProvider.jsx";
import { AchievementProvider } from "./context/AchievementContext.jsx";
import "./styles/index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <SettingsProvider>
    <ThemeProvider>
      <AuthProvider>
        <AchievementProvider>
          <App />
        </AchievementProvider>
      </AuthProvider>
    </ThemeProvider>
  </SettingsProvider>
);
