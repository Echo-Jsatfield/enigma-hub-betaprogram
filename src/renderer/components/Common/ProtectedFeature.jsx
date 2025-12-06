// ============================================
// E-HUB FRONTEND - PROTECTED FEATURE COMPONENT
// src/renderer/components/Common/ProtectedFeature.jsx
// ============================================

import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';

/**
 * Component that conditionally renders children based on permissions
 * 
 * Usage:
 * <ProtectedFeature permission="users.delete">
 *   <button>Delete User</button>
 * </ProtectedFeature>
 * 
 * <ProtectedFeature anyPermission={['users.edit', 'users.delete']}>
 *   <button>Manage User</button>
 * </ProtectedFeature>
 * 
 * <ProtectedFeature tier={3}>
 *   <AdminPanel />
 * </ProtectedFeature>
 */
export default function ProtectedFeature({ 
  children, 
  permission, 
  anyPermission, 
  allPermissions,
  tier,
  fallback = null 
}) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, hasTier, loading } = usePermissions();

  // Don't render anything while loading
  if (loading) {
    return fallback;
  }

  // Check single permission
  if (permission && !hasPermission(permission)) {
    return fallback;
  }

  // Check any of multiple permissions
  if (anyPermission && !hasAnyPermission(anyPermission)) {
    return fallback;
  }

  // Check all permissions
  if (allPermissions && !hasAllPermissions(allPermissions)) {
    return fallback;
  }

  // Check tier level
  if (tier !== undefined && !hasTier(tier)) {
    return fallback;
  }

  // User has required permissions
  return <>{children}</>;
}