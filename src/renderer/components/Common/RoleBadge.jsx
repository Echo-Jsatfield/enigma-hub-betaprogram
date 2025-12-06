// ============================================
// E-HUB FRONTEND - ROLE BADGE COMPONENT
// src/renderer/components/Common/RoleBadge.jsx
// ============================================

import React from 'react';
import { Shield } from 'lucide-react';

// Role colors matching backend config
const ROLE_COLORS = {
  // Tier 0
  'driver': '#64748b',
  'External Staff': '#6b7280',
  'Retired Staff': '#9ca3af',
  'Skin Designer': '#8b5cf6',
  
  // Tier 1
  'Staff Trial': '#3b82f6',
  
  // Tier 2
  'Enigma Staff': '#6A0DAD',
  'staff': '#6A0DAD',
  'Media': '#ec4899',
  'Event Team': '#f59e0b',
  
  // Tier 3
  'Division Manager': '#10b981',
  'Event Manager': '#f59e0b',
  'Human Resources': '#06b6d4',
  'Human Resources Manager': '#06b6d4',
  
  // Tier 4
  'Divisional Director': '#14b8a6',
  'Director of Design & Media': '#ec4899',
  'Director of Events': '#f59e0b',
  'Director of Research & Development': '#8b5cf6',
  'Director of Human Resources': '#06b6d4',
  'Development Manager': '#8b5cf6',
  'Developer': '#8b5cf6',
  
  // Tier 5
  'Operator': '#ef4444',
  'General Manager': '#ef4444',
  'Operation Director': '#ef4444',
  'Vice President': '#dc2626',
  
  // Tier 6
  'CEO & Owner': '#fbbf24',
  'Founder': '#fbbf24',
  'Board Member': '#fbbf24',
  'admin': '#fbbf24',
};

const TIER_NAMES = {
  'TIER_0': 'Basic',
  'TIER_1': 'Trial',
  'TIER_2': 'Staff',
  'TIER_3': 'Manager',
  'TIER_4': 'Director',
  'TIER_5': 'Executive',
  'TIER_6': 'Owner',
};

/**
 * Display a role badge with color and optional tier indicator
 * 
 * @param {string} role - Role name
 * @param {string} tier - Tier (e.g., 'TIER_3')
 * @param {boolean} showTier - Show tier indicator
 * @param {string} size - 'sm', 'md', 'lg'
 */
export default function RoleBadge({ role, tier, showTier = false, size = 'md' }) {
  const color = ROLE_COLORS[role] || '#64748b';
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${sizeClasses[size]}`}
      style={{
        backgroundColor: `${color}20`,
        color: color,
        border: `1px solid ${color}50`,
      }}
      title={showTier && tier ? `${TIER_NAMES[tier]} (${tier})` : role}
    >
      {showTier && tier && (
        <Shield className="w-3 h-3" />
      )}
      {role}
    </span>
  );
}

/**
 * Display multiple role badges
 * 
 * @param {string[]} roles - Array of role names
 * @param {number} maxDisplay - Max roles to show before "+X more"
 * @param {string} size - Badge size
 */
export function RoleBadges({ roles, maxDisplay = 3, size = 'md' }) {
  if (!roles || roles.length === 0) {
    return <span className="text-gray-400 text-sm">No roles</span>;
  }

  const displayRoles = roles.slice(0, maxDisplay);
  const remainingCount = roles.length - maxDisplay;

  return (
    <div className="flex flex-wrap gap-1">
      {displayRoles.map((role, index) => (
        <RoleBadge key={`${role}-${index}`} role={role} size={size} />
      ))}
      {remainingCount > 0 && (
        <span className="text-xs text-gray-400 self-center px-2">
          +{remainingCount} more
        </span>
      )}
    </div>
  );
}

/**
 * Display tier badge
 * 
 * @param {string} tier - Tier (e.g., 'TIER_3')
 */
export function TierBadge({ tier }) {
  const tierNum = parseInt(tier?.split('_')[1] || '0');
  const tierName = TIER_NAMES[tier] || 'Unknown';
  
  const colors = [
    '#64748b', // TIER_0
    '#3b82f6', // TIER_1
    '#6A0DAD', // TIER_2
    '#10b981', // TIER_3
    '#14b8a6', // TIER_4
    '#ef4444', // TIER_5
    '#fbbf24', // TIER_6
  ];

  const color = colors[tierNum] || '#64748b';

  return (
    <span
      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold"
      style={{
        backgroundColor: `${color}20`,
        color: color,
        border: `1px solid ${color}50`,
      }}
      title={tier}
    >
      <Shield className="w-3 h-3" />
      {tierName}
    </span>
  );
}