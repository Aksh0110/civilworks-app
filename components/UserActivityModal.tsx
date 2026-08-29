'use client';

import React, { useState, useEffect } from 'react';

interface UserActivityModalProps {
  isOpen: boolean;
  userId: string | null;
  userName: string;
  userEmail: string;
  onClose: () => void;
}

export default function UserActivityModal({
  isOpen,
  userId,
  userName,
  userEmail,
  onClose
}: UserActivityModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'FINANCIAL' | 'PROGRESS_STOCK' | 'LOGINS'>('ALL');

  useEffect(() => {
    if (isOpen && userId) {
      setLoading(true);
      fetch(`/api/admin/users/${userId}/activities`)
        .then((r) => r.json())
        .then((d) => {
          if (d.data) {
            setData(d.data);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setData(null);
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const user = data?.user || { name: userName, email: userEmail, role: 'SUPERVISOR', status: 'ACTIVE' };
  const metrics = data?.metrics || { totalActions: 0, expenseCount: 0, totalExpensesAmount: 0, progressUpdateCount: 0, lastLoginTime: null };
  const activities: any[] = data?.activities || [];

  const filteredActivities = activities.filter((act) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'FINANCIAL') return act.action.includes('EXPENSE') || act.action.includes('PAYMENT');
    if (activeTab === 'PROGRESS_STOCK') return act.action.includes('WORK') || act.action.includes('STOCK') || act.action.includes('MATERIAL');
    if (activeTab === 'LOGINS') return act.action.includes('LOGIN');
    return true;
  });

  const getRelativeTime = (timestampStr: string) => {
    const date = new Date(timestampStr);
    const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getActivityCardDetails = (act: any) => {
    const m = act.metadata || {};
    switch (act.action) {
      case 'EXPENSE_CREATED':
        return {
          icon: '💸',
          title: `Logged Site Expense: ${m.categoryName || 'Expense'} (₹${Number(m.amount || 0).toLocaleString('en-IN')})`,
          subtitle: `${act.projectName} • ${m.remark ? 'Remark: ' + m.remark : 'Recorded via mobile portal'}`,
          bg: 'bg-amber-50 border-amber-200 text-amber-900'
        };
      case 'PAYMENT_CREATED':
        return {
          icon: '💳',
          title: `Recorded Payment of ₹${Number(m.amount || 0).toLocaleString('en-IN')}`,
          subtitle: `${act.projectName} • Paid to ${m.payeeName || m.payeeType || 'Payee'} via ${m.paymentMethod || 'Cash'}`,
          bg: 'bg-blue-50 border-blue-200 text-blue-900'
        };
      case 'PAYMENT_VOIDED':
        return {
          icon: '🚫',
          title: `Voided Payment (₹${Number(m.amount || 0).toLocaleString('en-IN')})`,
          subtitle: `Reason: ${m.reason || 'Transaction voided by user'}`,
          bg: 'bg-red-50 border-red-200 text-red-900'
        };
      case 'MATERIAL_STOCK_UPDATED':
      case 'MATERIAL_RECEIVED':
        return {
          icon: '📦',
          title: `Material Stock Update: ${m.materialName || 'Material Item'}`,
          subtitle: `${act.projectName} • ${m.quantity ? `Quantity: ${m.quantity}` : 'Stock ledger modified'}`,
          bg: 'bg-purple-50 border-purple-200 text-purple-900'
        };
      case 'WORK_PROGRESS_UPDATED':
        return {
          icon: '📋',
          title: `Updated Work Progress & Site Log`,
          subtitle: `${act.projectName} • Daily progress entry recorded`,
          bg: 'bg-[#EAF7EF] border-[#bce6cb] text-[#056B34]'
        };
      case 'USER_LOGIN_SUCCESS':
        return {
          icon: '🔑',
          title: `Signed In to Site Portal`,
          subtitle: `Authenticated securely via email (${user.role})`,
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-900'
        };
      case 'USER_CREATED':
        return {
          icon: '👤',
          title: `Created User Account: ${m.name || 'User'}`,
          subtitle: `Email: ${m.email || ''} • Assigned as ${m.role || 'Supervisor'}`,
          bg: 'bg-indigo-50 border-indigo-200 text-indigo-900'
        };
      case 'USER_UPDATED':
        return {
          icon: '✏️',
          title: `Updated Account Details for ${m.name || 'User'}`,
          subtitle: `Status: ${m.status || 'Active'}`,
          bg: 'bg-slate-100 border-slate-200 text-slate-900'
        };
      default:
        return {
          icon: '⚡',
          title: `${act.action.replace(/_/g, ' ')}`,
          subtitle: `${act.projectName || 'Site'} • Entity: ${act.entity}`,
          bg: 'bg-slate-100 border-slate-200 text-slate-900'
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-xl w-full p-3.5 space-y-2.5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 shrink-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-[#EAF7EF] text-[#056B34] border border-[#bce6cb] flex items-center justify-center font-black text-xs shrink-0">
              {userName ? userName.slice(0, 2).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-xs font-extrabold text-slate-900 truncate">{user.name}</h2>
                <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-emerald-50 text-[#056B34] border border-[#bce6cb]">
                  {user.role}
                </span>
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${user.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                  {user.status}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                {user.email} • Activity Log & Work History
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1 rounded-md shrink-0 ml-2"
          >
            ✕
          </button>
        </div>

        {/* Authorized Construction Sites */}
        <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg text-[10px] flex items-center gap-1.5 flex-wrap shrink-0">
          <span className="font-bold text-slate-700">Authorized Sites:</span>
          {user.role === 'ADMIN' ? (
            <span className="font-bold px-1.5 py-0.2 rounded bg-purple-50 text-purple-800 border border-purple-200">
              🌐 All Sites (Global Admin)
            </span>
          ) : data?.assignedProjects?.length > 0 ? (
            data.assignedProjects.map((p: any) => (
              <span key={p._id} className="font-bold px-1.5 py-0.2 rounded bg-white text-slate-800 border border-slate-200">
                🏗️ {p.name} ({p.code})
              </span>
            ))
          ) : (
            <span className="font-bold text-slate-400">No sites assigned</span>
          )}
        </div>

        {/* Activity Summary Metrics */}
        <div className="grid grid-cols-3 gap-2 shrink-0">
          <div className="bg-white border border-slate-200 p-2 rounded-lg text-center shadow-2xs">
            <span className="text-[10px] text-slate-500 font-semibold block truncate">Total Actions</span>
            <span className="text-xs font-black text-slate-900 mt-0.5 block">{metrics.totalActions}</span>
          </div>

          <div className="bg-white border border-slate-200 p-2 rounded-lg text-center shadow-2xs">
            <span className="text-[10px] text-slate-500 font-semibold block truncate">Expenses</span>
            <span className="text-xs font-black text-[#087F3E] mt-0.5 block">
              ₹{Number(metrics.totalExpensesAmount || 0).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-white border border-slate-200 p-2 rounded-lg text-center shadow-2xs">
            <span className="text-[10px] text-slate-500 font-semibold block truncate">Last Sign-In</span>
            <span className="text-[10px] font-black text-slate-800 mt-0.5 block truncate">
              {metrics.lastLoginTime ? getRelativeTime(metrics.lastLoginTime) : 'Never'}
            </span>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex bg-slate-100 p-0.5 rounded-lg gap-1 border border-slate-200 shrink-0 text-[10px]">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-2 py-1 rounded-md font-bold transition-colors ${
              activeTab === 'ALL' ? 'bg-[#087F3E] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({activities.length})
          </button>
          <button
            onClick={() => setActiveTab('FINANCIAL')}
            className={`px-2 py-1 rounded-md font-bold transition-colors ${
              activeTab === 'FINANCIAL' ? 'bg-[#087F3E] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            💸 Financial
          </button>
          <button
            onClick={() => setActiveTab('PROGRESS_STOCK')}
            className={`px-2 py-1 rounded-md font-bold transition-colors ${
              activeTab === 'PROGRESS_STOCK' ? 'bg-[#087F3E] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📋 Progress
          </button>
          <button
            onClick={() => setActiveTab('LOGINS')}
            className={`px-2 py-1 rounded-md font-bold transition-colors ${
              activeTab === 'LOGINS' ? 'bg-[#087F3E] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🔑 Logins
          </button>
        </div>

        {/* Easy Activity Feed List */}
        <div className="overflow-y-auto flex-1 space-y-1.5 pr-1">
          {loading ? (
            <div className="text-center py-6 text-xs text-slate-500">Loading user activity log...</div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-6 space-y-1 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-xl">📋</div>
            <div className="text-xs font-bold text-slate-800">No activity logs recorded yet</div>
            <div className="text-[11px] text-slate-500">Actions performed by {user.name} will appear here.</div>
          </div>
          ) : (
            <div className="space-y-1.5">
              {filteredActivities.map((act) => {
                const card = getActivityCardDetails(act);
                return (
                  <div
                    key={act._id}
                    className={`p-2 rounded-xl border ${card.bg} flex items-center justify-between gap-2 shadow-2xs`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-sm shrink-0">{card.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-extrabold truncate">{card.title}</div>
                        <div className="text-[10px] opacity-80 font-medium truncate">{card.subtitle}</div>
                      </div>
                    </div>

                    <span className="text-[9px] font-bold opacity-75 shrink-0">
                      {getRelativeTime(act.timestamp)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-1.5 border-t border-slate-100 shrink-0">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors"
          >
            Close View
          </button>
        </div>
      </div>
    </div>
  );
}
