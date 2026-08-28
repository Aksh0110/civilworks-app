'use client';

import React, { useState, useEffect } from 'react';
import { UserRole } from '@/lib/models/User';

interface ProjectOption {
  _id: string;
  name: string;
  code: string;
  location?: string;
}

interface UserModalProps {
  isOpen: boolean;
  userToEdit?: any | null;
  projects: ProjectOption[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function UserModal({
  isOpen,
  userToEdit,
  projects,
  onClose,
  onSuccess
}: UserModalProps) {
  const isEditing = Boolean(userToEdit);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('SUPERVISOR');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [assignedProjectIds, setAssignedProjectIds] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userToEdit) {
      setName(userToEdit.name || '');
      setEmail(userToEdit.email || '');
      setPassword('');
      setRole(userToEdit.role || 'SUPERVISOR');
      setStatus(userToEdit.status || 'ACTIVE');
      setAssignedProjectIds(
        Array.isArray(userToEdit.assignedProjectIds)
          ? userToEdit.assignedProjectIds.map((id: any) => (id._id ? id._id.toString() : id.toString()))
          : []
      );
    } else {
      setName('');
      setEmail('');
      setPassword('');
      setRole('SUPERVISOR');
      setStatus('ACTIVE');
      setAssignedProjectIds([]);
    }
    setError('');
  }, [userToEdit, isOpen]);

  if (!isOpen) return null;

  const handleToggleProject = (projId: string) => {
    if (assignedProjectIds.includes(projId)) {
      setAssignedProjectIds(assignedProjectIds.filter((id) => id !== projId));
    } else {
      setAssignedProjectIds([...assignedProjectIds, projId]);
    }
  };

  const handleSelectAllProjects = () => {
    if (assignedProjectIds.length === projects.length) {
      setAssignedProjectIds([]);
    } else {
      setAssignedProjectIds(projects.map((p) => p._id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Name and Email are required.');
      return;
    }
    if (!isEditing && !password.trim()) {
      setError('Password is required when creating a new user.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const url = isEditing ? `/api/admin/users/${userToEdit._id}` : '/api/admin/users';
      const method = isEditing ? 'PUT' : 'POST';

      const payload: any = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        status,
        assignedProjectIds
      };

      if (password.trim()) {
        payload.password = password.trim();
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Operation failed.');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{isEditing ? '✏️' : '👤'}</span>
            <h2 className="text-base font-extrabold text-slate-900">
              {isEditing ? `Edit User: ${userToEdit.name}` : 'Create Supervised User Account'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#087F3E]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ramesh@civilworks.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#087F3E]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                {isEditing ? 'Password (leave blank to keep unchanged)' : 'Password *'}
              </label>
              <input
                type="password"
                required={!isEditing}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isEditing ? '••••••••' : 'Set login password'}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#087F3E]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">System Role *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#087F3E]"
              >
                <option value="SUPERVISOR">Site Supervisor</option>
                <option value="WORKER_MANAGER">Worker Manager</option>
                <option value="ADMIN">System Administrator</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">Account Status</label>
            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="ACTIVE"
                  checked={status === 'ACTIVE'}
                  onChange={() => setStatus('ACTIVE')}
                  className="accent-[#087F3E]"
                />
                <span className="text-emerald-700 font-bold">Active Account</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="INACTIVE"
                  checked={status === 'INACTIVE'}
                  onChange={() => setStatus('INACTIVE')}
                  className="accent-red-600"
                />
                <span className="text-red-600 font-bold">Deactivated / Suspended</span>
              </label>
            </div>
          </div>

          {/* Assigned Projects Selector */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>🏗️</span> Assign Authorized Project Sites:
              </label>
              <button
                type="button"
                onClick={handleSelectAllProjects}
                className="text-[11px] font-extrabold text-[#087F3E] hover:underline"
              >
                {assignedProjectIds.length === projects.length ? 'Deselect All' : 'Select All Sites'}
              </button>
            </div>

            {role === 'ADMIN' ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold">
                ℹ️ System Administrators have full access to all construction project sites.
              </div>
            ) : projects.length === 0 ? (
              <div className="text-xs text-slate-400 p-3 bg-slate-50 rounded-xl text-center">
                No active project sites available yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
                {projects.map((p) => {
                  const isChecked = assignedProjectIds.includes(p._id);
                  return (
                    <label
                      key={p._id}
                      className={`p-2.5 rounded-xl border text-xs flex items-center gap-2.5 cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-[#EAF7EF] border-[#bce6cb] text-[#056B34] font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleProject(p._id)}
                        className="accent-[#087F3E] rounded"
                      />
                      <div className="truncate">
                        <span className="block font-bold">{p.name}</span>
                        <span className="text-[10px] text-slate-500 font-normal">Code: {p.code}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-[#087F3E] hover:bg-[#056B34] text-white text-xs font-extrabold rounded-xl transition-colors shadow flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span> Saving...
                </>
              ) : isEditing ? (
                'Save Changes'
              ) : (
                'Create User Account'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
