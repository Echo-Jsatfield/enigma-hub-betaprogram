// src/renderer/index.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";  // ← ADD THIS
import "./styles/index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <AuthProvider>  {/* ← WRAP APP WITH THIS */}
    <App />
  </AuthProvider>
);