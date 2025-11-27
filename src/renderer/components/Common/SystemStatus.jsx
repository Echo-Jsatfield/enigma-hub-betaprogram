import React, { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

export default function SystemStatus() {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(`${API_URL}/../health`);
        setStatus(res.ok ? "online" : "offline");
      } catch {
        setStatus("offline");
      }
    };
    check();
    const id = setInterval(check, 10000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{
      background: "#0b0b0b", borderRadius: "8px", padding: "10px",
      color: "#ccc", width: "200px"
    }}>
      <div style={{ color: status === "online" ? "#00eaff" : "#ff4e4e" }}>
        ● {status === "online" ? "System Online" : "System Offline"}
      </div>
    </div>
  );
}