'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/lib/context/AuthContext';

interface AuditEntry {
  _id: string;
  user: string;
  action: string;
  entity: string;
  entityId?: string;
  projectId?: string;
  projectName?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface ProjectFilterOption {
  _id: string;
  name: string;
  code: string;
}

interface UserFilterOption {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export default function AdminAuditMonitoringPage() {
  const { user: currentUser, isAdmin, loading: authLoading } = useAuth();

  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [projects, setProjects] = useState<ProjectFilterOption[]>([]);
  const [users, setUsers] = useState<UserFilterOption[]>([]);

  const [selectedUser, setSelectedUser] = useState('ALL');
  const [selectedProject, setSelectedProject] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Inspector Modal state
  const [inspectingLog, setInspectingLog] = useState<AuditEntry | null>(null);

  useEffect(() => {
    if (isAdmin) {
      loadAuditFeed();
    }
  }, [isAdmin, selectedUser, selectedProject, selectedCategory]);

  const loadAuditFeed = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedUser !== 'ALL') params.set('user', selectedUser);
    if (selectedProject !== 'ALL') params.set('projectId', selectedProject);
    if (selectedCategory !== 'ALL') params.set('category', selectedCategory);

    fetch(`/api/admin/audit?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.data) {
          setLogs(d.data.logs || []);
          setStats(d.data.stats || null);
          setProjects(d.data.projects || []);
          setUsers(d.data.users || []);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
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
            Activity Monitoring is accessible exclusively by System Administrators.
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

  const formatActionPill = (action: string) => {
    if (action.includes('LOGIN')) return { icon: '🔑', label: 'User Auth', bg: 'bg-emerald-50 text-[#056B34] border-[#bce6cb]' };
    if (action.includes('EXPENSE')) return { icon: '💸', label: 'Expense Log', bg: 'bg-amber-50 text-amber-800 border-amber-200' };
    if (action.includes('PAYMENT')) return { icon: '💳', label: 'Payment', bg: 'bg-blue-50 text-blue-800 border-blue-200' };
    if (action.includes('WORK') || action.includes('PROGRESS')) return { icon: '📋', label: 'Site Progress', bg: 'bg-[#EAF7EF] text-[#056B34] border-[#bce6cb]' };
    if (action.includes('STOCK') || action.includes('MATERIAL')) return { icon: '📦', label: 'Material Stock', bg: 'bg-purple-50 text-purple-800 border-purple-200' };
    if (action.includes('USER')) return { icon: '👤', label: 'User Admin', bg: 'bg-indigo-50 text-indigo-800 border-indigo-200' };
    return { icon: '⚙️', label: 'Site System', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
  };

  const formatLogSummary = (log: AuditEntry) => {
    const m = log.metadata || {};
    switch (log.action) {
      case 'USER_LOGIN_SUCCESS':
        return `Signed in to Site Portal (${m.role || 'User'})`;
      case 'USER_CREATED':
        return `Created new user account "${m.name}" (${m.email}) as ${m.role}`;
      case 'USER_UPDATED':
        return `Updated user account settings for "${m.name}" (${m.email})`;
      case 'USER_DEACTIVATED':
        return `Deactivated / suspended user account "${m.name}" (${m.email})`;
      case 'EXPENSE_CREATED':
        return `Logged site expense: ${m.categoryName || 'Expense'} (₹${Number(m.amount || 0).toLocaleString('en-IN')})${m.remark ? ' - ' + m.remark : ''}`;
      case 'PAYMENT_CREATED':
        return `Recorded payment of ₹${Number(m.amount || 0).toLocaleString('en-IN')} to ${m.payeeName || m.payeeType || 'Payee'}`;
      case 'PAYMENT_VOIDED':
        return `Voided payment transaction (₹${Number(m.amount || 0).toLocaleString('en-IN')}) - ${m.reason || 'No reason specified'}`;
      case 'MATERIAL_STOCK_UPDATED':
      case 'MATERIAL_RECEIVED':
        return `Updated material stock for ${m.materialName || 'Material'}`;
      case 'WORK_PROGRESS_UPDATED':
        return `Recorded site progress updates for ${log.projectName || 'Site'}`;
      default:
        return `${log.action.replace(/_/g, ' ')} on ${log.entity} ${log.entityId ? `#${log.entityId}` : ''}`.trim();
    }
  };

  const getRelativeTime = (timestampStr: string) => {
    const date = new Date(timestampStr);
    const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <AppShell>
      <div className="space-y-6 pb-20 max-w-4xl mx-auto">
        {/* Banner Header */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">📋</span>
              <h1 className="text-2xl font-extrabold text-slate-900">User Activity Supervision</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Real-time audit log monitoring user activities, logins, site expenses, and administrative changes across all project sites.
            </p>
          </div>

          <Link
            href="/admin/users"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold rounded-xl transition-colors shrink-0 self-start sm:self-auto"
          >
            👥 Manage Supervised Users →
          </Link>
        </div>

        {/* KPI Metric Summary Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm text-center">
              <span className="text-xs text-slate-500 font-semibold block">Total Logged Actions</span>
              <span className="text-xl font-black text-slate-900 mt-1 block">{stats.totalActions}</span>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm text-center">
              <span className="text-xs text-slate-500 font-semibold block">Logins Today</span>
              <span className="text-xl font-black text-[#087F3E] mt-1 block">{stats.todayLogins}</span>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm text-center">
              <span className="text-xs text-slate-500 font-semibold block">Actions Today</span>
              <span className="text-xl font-black text-blue-700 mt-1 block">{stats.todayActions}</span>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm text-center">
              <span className="text-xs text-slate-500 font-semibold block">Unique Users Monitored</span>
              <span className="text-xl font-black text-purple-700 mt-1 block">{stats.activeMonitoredUsersCount}</span>
            </div>
          </div>
        )}

        {/* Multi-Criteria Filters Bar */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 block">Filter by User</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#087F3E]"
            >
              <option value="ALL">👤 All Monitored Users</option>
              {users.map((u) => (
                <option key={u._id} value={u.name}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 block">Filter by Site Project</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#087F3E]"
            >
              <option value="ALL">🏗️ All Project Sites</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 block">Filter by Action Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#087F3E]"
            >
              <option value="ALL">⚡ All Action Categories</option>
              <option value="LOGINS">🔑 User Sign-Ins & Auth</option>
              <option value="FINANCIAL">💸 Expenses & Payments</option>
              <option value="PROGRESS_STOCK">📋 Progress & Stock Updates</option>
              <option value="USER_ADMIN">👥 User Account Changes</option>
            </select>
          </div>
        </div>

        {/* Audit Log Activity Feed */}
        {loading ? (
          <div className="text-center py-12 text-xs text-slate-500">Fetching live supervision feed...</div>
        ) : logs.length === 0 ? (
          <div className="bg-white border border-slate-200 p-8 rounded-2xl text-center space-y-2 shadow-sm">
            <div className="text-3xl">🔍</div>
            <h3 className="text-sm font-bold text-slate-900">No activity logs found</h3>
            <p className="text-xs text-slate-500">Try adjusting your user, project, or category filters.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => {
              const pill = formatActionPill(log.action);
              const summaryText = formatLogSummary(log);

              return (
                <div
                  key={log._id}
                  className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm hover:border-slate-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-lg shrink-0 mt-0.5">
                      {pill.icon}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-slate-900">{log.user}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${pill.bg}`}>
                          {pill.label}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          🏗️ {log.projectName || 'General Site'}
                        </span>
                      </div>

                      <div className="text-xs font-bold text-slate-800">{summaryText}</div>

                      <div className="text-[10px] text-slate-400 font-medium flex items-center gap-2">
                        <span>🕒 {getRelativeTime(log.timestamp)}</span>
                        <span>•</span>
                        <span>Full: {new Date(log.timestamp).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setInspectingLog(log)}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-bold rounded-xl border border-slate-200 transition-colors shrink-0 self-start sm:self-auto"
                  >
                    🔍 Inspect Metadata
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Metadata Inspector Modal */}
        {inspectingLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🔍</span>
                  <h2 className="text-sm font-extrabold text-slate-900">Audit Action Inspector</h2>
                </div>
                <button
                  onClick={() => setInspectingLog(null)}
                  className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div><strong>Action:</strong> <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">{inspectingLog.action}</code></div>
                <div><strong>User:</strong> {inspectingLog.user}</div>
                <div><strong>Project Site:</strong> {inspectingLog.projectName}</div>
                <div><strong>Entity:</strong> {inspectingLog.entity} {inspectingLog.entityId ? `(#${inspectingLog.entityId})` : ''}</div>
                <div><strong>Timestamp:</strong> {new Date(inspectingLog.timestamp).toISOString()}</div>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 block">Raw Metadata Payload (JSON)</label>
                <pre className="bg-slate-900 text-emerald-400 p-4 rounded-2xl text-[11px] font-mono overflow-x-auto">
                  {JSON.stringify(inspectingLog.metadata || {}, null, 2)}
                </pre>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setInspectingLog(null)}
                  className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
                >
                  Close Inspector
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
