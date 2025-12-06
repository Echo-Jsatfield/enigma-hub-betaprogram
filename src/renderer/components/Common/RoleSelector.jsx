// ============================================
// E-HUB FRONTEND - ROLE SELECTOR COMPONENT
// src/renderer/components/Common/RoleSelector.jsx
// ============================================

import React, { useState, useEffect } from 'react';
import { Check, X, Shield, Search } from 'lucide-react';
import api from '../../services/api';
import RoleBadge from './RoleBadge';

/**
 * Multi-role selector with tier restrictions
 * Only shows roles that the current user can assign
 * 
 * @param {string[]} selectedRoles - Currently selected roles
 * @param {Function} onChange - Callback when roles change
 * @param {boolean} disabled - Disable selector
 */
export default function RoleSelector({ selectedRoles = [], onChange, disabled = false }) {
  const [availableRoles, setAvailableRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetchAssignableRoles();
  }, []);

  const fetchAssignableRoles = async () => {
    try {
      const response = await api.get('/roles/assignable');
      setAvailableRoles(response.data.roles);
    } catch (error) {
      console.error('Failed to fetch assignable roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRole = (roleName) => {
    if (disabled) return;

    let newRoles;
    if (selectedRoles.includes(roleName)) {
      // Remove role
      newRoles = selectedRoles.filter(r => r !== roleName);
      
      // Ensure at least 'driver' role remains
      if (newRoles.length === 0) {
        newRoles = ['driver'];
      }
    } else {
      // Add role
      newRoles = [...selectedRoles, roleName];
    }

    onChange(newRoles);
  };

  const filteredRoles = availableRoles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedRoles = filteredRoles.reduce((acc, role) => {
    const tier = role.tier || 'TIER_0';
    if (!acc[tier]) acc[tier] = [];
    acc[tier].push(role);
    return acc;
  }, {});

  const tierOrder = ['TIER_6', 'TIER_5', 'TIER_4', 'TIER_3', 'TIER_2', 'TIER_1', 'TIER_0'];

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-400">
        <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        Loading roles...
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Selected Roles Display */}
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedRoles.length > 0 ? (
          selectedRoles.map((role, index) => (
            <div key={`${role}-${index}`} className="relative group">
              <RoleBadge role={role} size="sm" />
              {!disabled && (
                <button
                  onClick={() => handleToggleRole(role)}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove role"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              )}
            </div>
          ))
        ) : (
          <span className="text-sm text-gray-400">No roles selected</span>
        )}
      </div>

      {/* Role Picker Button */}
      {!disabled && (
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="w-full px-4 py-2 bg-[#0d0413] border border-[#2a0c3f] rounded-xl text-sm text-white hover:border-purple-600 transition-colors flex items-center justify-between"
        >
          <span>Select Roles</span>
          <Shield className="w-4 h-4 text-purple-400" />
        </button>
      )}

      {/* Dropdown */}
      {showDropdown && !disabled && (
        <div className="relative">
          <div className="absolute z-50 w-full mt-1 bg-[#11061a] border border-[#2a0c3f] rounded-xl shadow-xl max-h-96 overflow-hidden">
            {/* Search */}
            <div className="p-3 border-b border-[#2a0c3f]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search roles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#0d0413] border border-[#2a0c3f] rounded-lg text-sm text-white focus:border-purple-600 outline-none"
                />
              </div>
            </div>

            {/* Roles List */}
            <div className="overflow-y-auto max-h-80">
              {tierOrder.map(tier => {
                const rolesInTier = groupedRoles[tier];
                if (!rolesInTier || rolesInTier.length === 0) return null;

                const tierNames = {
                  'TIER_6': 'Owner',
                  'TIER_5': 'Executive',
                  'TIER_4': 'Director',
                  'TIER_3': 'Manager',
                  'TIER_2': 'Staff',
                  'TIER_1': 'Trial',
                  'TIER_0': 'Basic',
                };

                return (
                  <div key={tier} className="border-b border-[#2a0c3f] last:border-0">
                    <div className="px-3 py-2 bg-[#0d0413] text-xs font-semibold text-purple-300 flex items-center gap-2">
                      <Shield className="w-3 h-3" />
                      {tierNames[tier]} ({tier})
                    </div>
                    {rolesInTier.map(role => {
                      const isSelected = selectedRoles.includes(role.name);
                      return (
                        <button
                          key={role.name}
                          onClick={() => handleToggleRole(role.name)}
                          className={`w-full px-4 py-2 text-left text-sm flex items-center justify-between hover:bg-[#1a0927] transition-colors ${
                            isSelected ? 'bg-purple-900/30' : ''
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded border-2 flex items-center justify-center"
                              style={{
                                borderColor: role.color || '#6A0DAD',
                                backgroundColor: isSelected ? (role.color || '#6A0DAD') : 'transparent',
                              }}
                            >
                              {isSelected && <Check className="w-2 h-2 text-white" />}
                            </div>
                            <span style={{ color: role.color || '#ffffff' }}>
                              {role.name}
                            </span>
                          </span>
                          <span className="text-xs text-gray-400">
                            {role.permissions.length} permissions
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Close Button */}
            <div className="p-2 border-t border-[#2a0c3f]">
              <button
                onClick={() => setShowDropdown(false)}
                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}