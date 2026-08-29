'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/lib/context/AuthContext';
import UserModal from '@/components/UserModal';
import UserActivityModal from '@/components/UserActivityModal';

interface ManagedUser {
  _id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'SUPERVISOR' | 'WORKER_MANAGER';
  assignedProjectIds: string[];
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
}

interface ProjectOption {
  _id: string;
  name: string;
  code: string;
  location?: string;
}

export default function AdminUserManagementPage() {
  const { user: currentUser, isAdmin, loading: authLoading } = useAuth();

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<ManagedUser | null>(null);

  // User Activity Modal State
  const [selectedActivityUser, setSelectedActivityUser] = useState<ManagedUser | null>(null);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const loadData = () => {
    setLoading(true);
    fetch('/api/admin/users')
      .then((r) => r.json())
      .then((d) => {
        if (d.data) {
          setUsers(d.data.users || []);
          setProjects(d.data.projects || []);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggleStatus = async (u: ManagedUser) => {
    const newStatus = u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetch(`/api/admin/users/${u._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update user status');

      showToast(`User "${u.name}" is now ${newStatus}`);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to change status');
    }
  };

  if (authLoading) {
    return (
      <AppShell>
        <div className="text-center py-20 text-xs text-slate-500 max-w-4xl mx-auto">
          Verifying security privileges...
        </div>
      </AppShell>
    );
  }

  if (!isAdmin) {
    return (
      <AppShell>
        <div className="max-w-xl mx-auto my-12 p-8 bg-white border border-slate-200 rounded-3xl shadow-sm text-center space-y-4">
          <div className="text-4xl">🔒</div>
          <h2 className="text-lg font-black text-slate-900">Access Restricted</h2>
          <p className="text-xs text-slate-500">
            User Management is accessible exclusively by System Administrators. Please contact your admin for access privileges.
          </p>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 bg-[#087F3E] text-[#ffffff] text-xs font-extrabold rounded-xl"
          >
            ← Return to Site Dashboard
          </Link>
        </div>
      </AppShell>
    );
  }

  const filteredUsers = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const activeCount = users.filter((u) => u.status === 'ACTIVE').length;
  const inactiveCount = users.filter((u) => u.status === 'INACTIVE').length;

  return (
    <AppShell>
      <div className="space-y-3 pb-20 max-w-4xl mx-auto">
        {/* Toast Banner */}
        {toast && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#087F3E] text-white px-4 py-2 rounded-xl shadow-lg font-bold text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top">
            ✅ {toast}
          </div>
        )}

        {/* Top Banner Header */}
        <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-2xs flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg">👥</span>
              <h1 className="text-xs sm:text-base font-extrabold text-slate-900 truncate">User Management Portal</h1>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">
              Supervise user accounts, permissions, and site access.
            </p>
          </div>

          <button
            onClick={() => {
              setUserToEdit(null);
              setIsModalOpen(true);
            }}
            className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-[#087F3E] hover:bg-[#056B34] text-white text-[10px] sm:text-[11px] font-bold rounded-lg transition-colors shadow-2xs flex items-center justify-center gap-1 shrink-0"
          >
            <span>+</span> Create User
          </button>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white border border-slate-200 p-2.5 rounded-xl shadow-2xs text-center">
            <span className="text-[10px] sm:text-[11px] text-slate-500 font-semibold block truncate">Total Users</span>
            <span className="text-sm sm:text-base font-black text-slate-900 mt-0.5 block">{users.length}</span>
          </div>

          <div className="bg-white border border-slate-200 p-2.5 rounded-xl shadow-2xs text-center">
            <span className="text-[10px] sm:text-[11px] text-slate-500 font-semibold block truncate">Active</span>
            <span className="text-sm sm:text-base font-black text-[#087F3E] mt-0.5 block">{activeCount}</span>
          </div>

          <div className="bg-white border border-slate-200 p-2.5 rounded-xl shadow-2xs text-center">
            <span className="text-[10px] sm:text-[11px] text-slate-500 font-semibold block truncate">Deactivated</span>
            <span className="text-sm sm:text-base font-black text-red-600 mt-0.5 block">{inactiveCount}</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white border border-slate-200 p-2 rounded-xl shadow-2xs">
          <input
            type="text"
            placeholder="Search user by name or email address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#087F3E]"
          />
        </div>

        {/* User Directory List */}
        {loading ? (
          <div className="text-center py-8 text-xs text-slate-500">Loading supervised users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white border border-slate-200 p-6 rounded-xl text-center space-y-2 shadow-2xs">
            <div className="text-2xl">👤</div>
            <h3 className="text-xs font-extrabold text-slate-900">No users found</h3>
            <p className="text-[11px] text-slate-500">Create a user account to grant access to site supervisors.</p>
            <button
              onClick={() => {
                setUserToEdit(null);
                setIsModalOpen(true);
              }}
              className="inline-block px-3 py-1.5 bg-[#087F3E] text-white text-xs font-bold rounded-lg"
            >
              + Create User
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
            {filteredUsers.map((u) => {
              const assignedCount = u.assignedProjectIds?.length || 0;
              const initials = u.name
                ? u.name
                    .split(' ')
                    .filter(Boolean)
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()
                : 'U';

              return (
                <div
                  key={u._id}
                  className="bg-white border border-slate-200 p-2.5 rounded-xl shadow-2xs flex items-center justify-between gap-2 hover:border-slate-300 transition-colors"
                >
                  {/* Left: User Avatar & Info */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* User Avatar Circle */}
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                        u.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : 'bg-[#EAF7EF] text-[#056B34] border border-[#bce6cb]'
                      }`}
                    >
                      {initials}
                    </div>

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-extrabold text-slate-900 truncate">{u.name}</span>
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.2 rounded-full border ${
                            u.role === 'ADMIN'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : u.role === 'SUPERVISOR'
                              ? 'bg-emerald-50 text-[#056B34] border-[#bce6cb]'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          {u.role}
                        </span>

                        {u.status === 'INACTIVE' && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-red-100 text-red-800">
                            INACTIVE
                          </span>
                        )}
                      </div>

                      <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                        <span className="truncate">{u.email}</span>
                        <span>•</span>
                        <span className="font-semibold text-slate-700 shrink-0">
                          {u.role === 'ADMIN'
                            ? 'All Sites'
                            : assignedCount === 0
                            ? 'No Sites'
                            : `${assignedCount} Sites`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Quick Action Buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setSelectedActivityUser(u)}
                      className="px-2 py-1 bg-[#EAF7EF] hover:bg-[#d5edd9] text-[#056B34] border border-[#bce6cb] text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1"
                      title="View user activity logs"
                    >
                      <span>📜</span> <span className="hidden sm:inline">Activity</span>
                    </button>

                    <button
                      onClick={() => {
                        setUserToEdit(u);
                        setIsModalOpen(true);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-100"
                      title="Edit User"
                    >
                      ✏️
                    </button>

                    <button
                      onClick={() => handleToggleStatus(u)}
                      disabled={currentUser?._id === u._id}
                      className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-colors border ${
                        u.status === 'ACTIVE'
                          ? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200 disabled:opacity-30'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                      }`}
                      title={currentUser?._id === u._id ? 'Cannot deactivate your own account' : ''}
                    >
                      {u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* User Edit / Create Modal */}
        <UserModal
          isOpen={isModalOpen}
          userToEdit={userToEdit}
          projects={projects}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            showToast(userToEdit ? 'User updated successfully' : 'Supervised user account created');
            loadData();
          }}
        />

        {/* User Activity & Profile Modal */}
        <UserActivityModal
          isOpen={Boolean(selectedActivityUser)}
          userId={selectedActivityUser?._id || null}
          userName={selectedActivityUser?.name || ''}
          userEmail={selectedActivityUser?.email || ''}
          onClose={() => setSelectedActivityUser(null)}
        />
      </div>
    </AppShell>
  );
}
