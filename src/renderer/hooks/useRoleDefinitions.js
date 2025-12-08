// src/renderer/hooks/useRoleDefinitions.js
import { useEffect, useState } from "react";
import api from "../services/api";

/**
 * Fetches role definitions (name, tier, color, permissions) from the backend.
 * Returns { roles, loading, error, refresh }.
 */
export function useRoleDefinitions() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchRoles = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/roles");
      setRoles(res.data?.roles || res.data || []);
    } catch (err) {
      console.error("Failed to fetch role definitions:", err);
      setError(err.response?.data?.error || "Failed to load roles");
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  return { roles, loading, error, refresh: fetchRoles };
}
