'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/lib/context/AuthContext';
import UserModal from '@/components/UserModal';

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
            className="inline-block px-5 py-2.5 bg-[#087F3E] text-white text-xs font-extrabold rounded-xl"
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
      <div className="space-y-6 pb-20 max-w-4xl mx-auto">
        {/* Toast Banner */}
        {toast && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#087F3E] text-white px-5 py-2.5 rounded-2xl shadow-xl font-bold text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top">
            ✅ {toast}
          </div>
        )}

        {/* Top Banner Header */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">👥</span>
              <h1 className="text-2xl font-extrabold text-slate-900">User Management Portal</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Supervise user accounts, assign role permissions, and control project site accessibility.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            <Link
              href="/admin/audit"
              className="px-4 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <span>📋</span> Activity Audit
            </Link>

            <button
              onClick={() => {
                setUserToEdit(null);
                setIsModalOpen(true);
              }}
              className="px-5 h-11 bg-[#087F3E] hover:bg-[#056B34] text-white text-xs font-extrabold rounded-xl transition-colors shadow flex items-center justify-center gap-2"
            >
              <span>+</span> Create Supervised User
            </button>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm text-center">
            <span className="text-xs text-slate-500 font-semibold block">Total Managed Users</span>
            <span className="text-xl font-black text-slate-900 mt-1 block">{users.length}</span>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm text-center">
            <span className="text-xs text-slate-500 font-semibold block">Active Accounts</span>
            <span className="text-xl font-black text-[#087F3E] mt-1 block">{activeCount}</span>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm text-center">
            <span className="text-xs text-slate-500 font-semibold block">Deactivated Users</span>
            <span className="text-xl font-black text-red-600 mt-1 block">{inactiveCount}</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <input
            type="text"
            placeholder="Search user by name or email address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#087F3E]"
          />
        </div>

        {/* User Directory List */}
        {loading ? (
          <div className="text-center py-12 text-xs text-slate-500">Loading supervised users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white border border-slate-200 p-8 rounded-2xl text-center space-y-3 shadow-sm">
            <div className="text-3xl">👤</div>
            <h3 className="text-sm font-bold text-slate-900">No users found</h3>
            <p className="text-xs text-slate-500">Create a user account to grant access to site supervisors.</p>
            <button
              onClick={() => {
                setUserToEdit(null);
                setIsModalOpen(true);
              }}
              className="inline-block px-4 py-2 bg-[#087F3E] text-white text-xs font-bold rounded-xl"
            >
              + Create Supervised User
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((u) => {
              const assignedCount = u.assignedProjectIds?.length || 0;

              return (
                <div
                  key={u._id}
                  className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-extrabold text-slate-900">{u.name}</span>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : u.role === 'SUPERVISOR'
                            ? 'bg-emerald-50 text-[#056B34] border-[#bce6cb]'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {u.role}
                      </span>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {u.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 font-medium">
                      Email: <span className="text-slate-800 font-bold">{u.email}</span>
                    </div>

                    {/* Assigned Project Site Tags */}
                    <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                      <span className="text-[11px] font-bold text-slate-600">Assigned Sites:</span>
                      {u.role === 'ADMIN' ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-[#056B34] border border-[#bce6cb]">
                          🌐 All Construction Sites
                        </span>
                      ) : assignedCount === 0 ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                          ⚠️ No Sites Assigned
                        </span>
                      ) : (
                        projects
                          .filter((p) => u.assignedProjectIds?.includes(p._id))
                          .map((p) => (
                            <span
                              key={p._id}
                              className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
                            >
                              🏗️ {p.name} ({p.code})
                            </span>
                          ))
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                    <button
                      onClick={() => {
                        setUserToEdit(u);
                        setIsModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                    >
                      ✏️ Edit
                    </button>

                    <button
                      onClick={() => handleToggleStatus(u)}
                      disabled={currentUser?._id === u._id}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors border ${
                        u.status === 'ACTIVE'
                          ? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200 disabled:opacity-30'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                      }`}
                      title={currentUser?._id === u._id ? 'You cannot deactivate your own admin account' : ''}
                    >
                      {u.status === 'ACTIVE' ? '🔒 Deactivate' : '🔓 Activate'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* User Modal */}
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
      </div>
    </AppShell>
  );
}
