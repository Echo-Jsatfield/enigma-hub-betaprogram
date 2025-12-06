// ============================================
// E-HUB FRONTEND - ROLE MANAGEMENT COMPONENT
// src/renderer/components/Admin/RoleManagement.jsx
// ============================================

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, Eye, Search, Filter } from 'lucide-react';
import api from '../../services/api';
import { usePermissions } from '../../hooks/usePermissions';
import RoleBadge, { TierBadge } from '../Common/RoleBadge';

export default function RoleManagement() {
  const { hasPermission } = usePermissions();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState('ALL');
  const [selectedRole, setSelectedRole] = useState(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await api.get('/roles');
      setRoles(response.data.roles);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRoles = roles.filter(role => {
    const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = filterTier === 'ALL' || role.tier === filterTier;
    return matchesSearch && matchesTier;
  });

  const tierStats = roles.reduce((acc, role) => {
    const tier = role.tier || 'TIER_0';
    acc[tier] = (acc[tier] || 0) + 1;
    return acc;
  }, {});

  if (!hasPermission('roles.view')) {
    return (
      <div className="p-6 text-center">
        <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-gray-400">You don't have permission to view roles.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 min-h-full bg-gradient-to-b from-[#12051a] to-[#1a0927]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center shadow-md"
            style={{
              backgroundColor: '#1e0b29',
              border: '1px solid #6A0DAD90',
              boxShadow: '0 0 18px #6A0DAD50',
            }}
          >
            <Shield className="w-6 h-6" style={{ color: '#6A0DAD' }} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Role Management
            </h1>
            <p className="text-sm text-slate-400">
              View roles, permissions, and tier structure
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4">
          <StatCard
            label="Total Roles"
            value={roles.length}
            icon={Shield}
            color="#6A0DAD"
          />
        </div>
      </div>

      {/* Tier Overview */}
      <div className="grid grid-cols-7 gap-3">
        {['TIER_6', 'TIER_5', 'TIER_4', 'TIER_3', 'TIER_2', 'TIER_1', 'TIER_0'].map(tier => (
          <TierCard
            key={tier}
            tier={tier}
            count={tierStats[tier] || 0}
            active={filterTier === tier}
            onClick={() => setFilterTier(filterTier === tier ? 'ALL' : tier)}
          />
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-[#14071d] border border-[#2a0c3f] rounded-xl text-white placeholder-gray-400 focus:border-purple-600 outline-none"
          />
        </div>
        <button
          onClick={() => setFilterTier('ALL')}
          className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
            filterTier === 'ALL'
              ? 'bg-purple-600 text-white'
              : 'bg-[#14071d] border border-[#2a0c3f] text-gray-300 hover:border-purple-600'
          }`}
        >
          <Filter className="w-4 h-4" />
          {filterTier === 'ALL' ? 'All Tiers' : `${filterTier} Only`}
        </button>
      </div>

      {/* Roles Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading roles...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRoles.map(role => (
            <RoleCard
              key={role.name}
              role={role}
              onClick={() => setSelectedRole(role)}
            />
          ))}
        </div>
      )}

      {filteredRoles.length === 0 && !loading && (
        <div className="text-center py-12">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">No roles found</p>
        </div>
      )}

      {/* Role Details Modal */}
      {selectedRole && (
        <RoleDetailsModal
          role={selectedRole}
          onClose={() => setSelectedRole(null)}
        />
      )}
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div
      className="px-4 py-3 rounded-xl flex items-center gap-3"
      style={{
        backgroundColor: '#14071d',
        border: '1px solid #2a0c3f',
      }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center"
        style={{
          backgroundColor: `${color}20`,
          border: `1px solid ${color}50`,
        }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <p className="text-sm text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

function TierCard({ tier, count, active, onClick }) {
  const tierNames = {
    'TIER_6': 'Owner',
    'TIER_5': 'Executive',
    'TIER_4': 'Director',
    'TIER_3': 'Manager',
    'TIER_2': 'Staff',
    'TIER_1': 'Trial',
    'TIER_0': 'Basic',
  };

  const tierColors = {
    'TIER_6': '#fbbf24',
    'TIER_5': '#ef4444',
    'TIER_4': '#14b8a6',
    'TIER_3': '#10b981',
    'TIER_2': '#6A0DAD',
    'TIER_1': '#3b82f6',
    'TIER_0': '#64748b',
  };

  const color = tierColors[tier];

  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-xl text-center transition-all ${
        active ? 'ring-2 ring-purple-500' : ''
      }`}
      style={{
        backgroundColor: active ? `${color}20` : '#14071d',
        border: `1px solid ${active ? color : '#2a0c3f'}`,
      }}
    >
      <div className="flex items-center justify-center gap-1 mb-1">
        <Shield className="w-3 h-3" style={{ color }} />
        <span className="text-xs font-semibold" style={{ color }}>
          {tierNames[tier]}
        </span>
      </div>
      <p className="text-2xl font-bold text-white">{count}</p>
    </button>
  );
}

function RoleCard({ role, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="p-4 rounded-xl text-left transition-all hover:shadow-lg"
      style={{
        backgroundColor: '#14071d',
        border: '1px solid #2a0c3f',
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <RoleBadge role={role.name} size="md" />
        <TierBadge tier={role.tier} />
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Shield className="w-4 h-4" />
          <span>{role.permissions.length} permissions</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-[#2a0c3f]">
        <button
          className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
        >
          <Eye className="w-4 h-4" />
          View Details
        </button>
      </div>
    </motion.button>
  );
}

function RoleDetailsModal({ role, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#14071d] border border-[#2a0c3f] rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <RoleBadge role={role.name} size="lg" />
            <TierBadge tier={role.tier} />
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-purple-300 mb-3">
              Permissions ({role.permissions.length})
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {role.permissions.map((permission, index) => (
                <div
                  key={index}
                  className="px-3 py-2 bg-[#0d0413] border border-[#2a0c3f] rounded-lg text-sm text-gray-300"
                >
                  {permission}
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}