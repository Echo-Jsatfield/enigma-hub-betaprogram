// ============================================
// E-HUB FRONTEND - PERMISSIONS HOOK
// src/renderer/hooks/usePermissions.js
// ============================================

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

/**
 * Hook for checking user permissions
 * Fetches permissions from backend and provides helper functions
 */
export function usePermissions() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState([]);
  const [tier, setTier] = useState('TIER_0');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPermissions();
    } else {
      setPermissions([]);
      setTier('TIER_0');
      setLoading(false);
    }
  }, [user]);

  const fetchPermissions = async () => {
    try {
      const response = await api.get('/roles/me/permissions');
      setPermissions(response.data.permissions);
      setTier(response.data.tier);
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
      setPermissions([]);
      setTier('TIER_0');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if user has a specific permission
   * @param {string} permission - Permission to check
   * @returns {boolean}
   */
  const hasPermission = (permission) => {
    if (!user) return false;
    if (permissions.includes('*')) return true; // Admin wildcard
    return permissions.includes(permission);
  };

  /**
   * Check if user has ANY of the specified permissions
   * @param {string[]} permissionArray - Array of permissions
   * @returns {boolean}
   */
  const hasAnyPermission = (permissionArray) => {
    if (!user) return false;
    if (permissions.includes('*')) return true;
    return permissionArray.some(perm => permissions.includes(perm));
  };

  /**
   * Check if user has ALL of the specified permissions
   * @param {string[]} permissionArray - Array of permissions
   * @returns {boolean}
   */
  const hasAllPermissions = (permissionArray) => {
    if (!user) return false;
    if (permissions.includes('*')) return true;
    return permissionArray.every(perm => permissions.includes(perm));
  };

  /**
   * Get tier number (0-6)
   * @returns {number}
   */
  const getTierNumber = () => {
    return parseInt(tier.split('_')[1] || '0');
  };

  /**
   * Check if user has minimum tier level
   * @param {number} minTier - Minimum tier (0-6)
   * @returns {boolean}
   */
  const hasTier = (minTier) => {
    return getTierNumber() >= minTier;
  };

  return {
    permissions,
    tier,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getTierNumber,
    hasTier,
    refetch: fetchPermissions,
  };
}