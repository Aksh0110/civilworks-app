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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#EAF7EF] text-2xl flex items-center justify-center font-bold text-[#056B34]">
              👤
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900">{user.name}</h2>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-[#056B34] border border-[#bce6cb]">
                  {user.role}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${user.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                  {user.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {user.email} • Activity Log & Work History
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-base font-bold p-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Assigned Project Site Tags */}
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl space-y-1.5 text-xs">
          <span className="font-bold text-slate-700 block">Authorized Construction Sites:</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {user.role === 'ADMIN' ? (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-purple-50 text-purple-800 border border-purple-200">
                🌐 All Construction Sites (Global Admin)
              </span>
            ) : data?.assignedProjects?.length > 0 ? (
              data.assignedProjects.map((p: any) => (
                <span key={p._id} className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-white text-slate-800 border border-slate-200">
                  🏗️ {p.name} ({p.code})
                </span>
              ))
            ) : (
              <span className="text-[11px] font-bold text-slate-400">No project sites assigned</span>
            )}
          </div>
        </div>

        {/* Activity Summary Metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-slate-200 p-3 rounded-2xl text-center">
            <span className="text-[10px] text-slate-500 font-bold block">Total Actions Logged</span>
            <span className="text-base font-black text-slate-900 mt-0.5 block">{metrics.totalActions}</span>
          </div>

          <div className="bg-white border border-slate-200 p-3 rounded-2xl text-center">
            <span className="text-[10px] text-slate-500 font-bold block">Expenses Logged</span>
            <span className="text-base font-black text-[#087F3E] mt-0.5 block">
              ₹{Number(metrics.totalExpensesAmount || 0).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-white border border-slate-200 p-3 rounded-2xl text-center">
            <span className="text-[10px] text-slate-500 font-bold block">Last Sign-In</span>
            <span className="text-xs font-black text-slate-800 mt-1 block">
              {metrics.lastLoginTime ? getRelativeTime(metrics.lastLoginTime) : 'Never'}
            </span>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${
              activeTab === 'ALL' ? 'bg-[#087F3E] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Activities ({activities.length})
          </button>
          <button
            onClick={() => setActiveTab('FINANCIAL')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${
              activeTab === 'FINANCIAL' ? 'bg-[#087F3E] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            💸 Expenses & Payments
          </button>
          <button
            onClick={() => setActiveTab('PROGRESS_STOCK')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${
              activeTab === 'PROGRESS_STOCK' ? 'bg-[#087F3E] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            📋 Progress & Stock
          </button>
          <button
            onClick={() => setActiveTab('LOGINS')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${
              activeTab === 'LOGINS' ? 'bg-[#087F3E] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            🔑 Logins
          </button>
        </div>

        {/* Easy Activity Feed List */}
        {loading ? (
          <div className="text-center py-10 text-xs text-slate-500">Loading user activity log...</div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-10 space-y-1.5 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="text-2xl">📋</div>
            <div className="text-xs font-bold text-slate-800">No activity logs recorded yet</div>
            <div className="text-[11px] text-slate-500">Actions performed by {user.name} will appear here.</div>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {filteredActivities.map((act) => {
              const card = getActivityCardDetails(act);
              return (
                <div
                  key={act._id}
                  className={`p-3.5 rounded-2xl border ${card.bg} flex items-start justify-between gap-3 shadow-xs`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="text-lg shrink-0 mt-0.5">{card.icon}</span>
                    <div className="space-y-0.5">
                      <div className="text-xs font-black">{card.title}</div>
                      <div className="text-[11px] opacity-80 font-medium">{card.subtitle}</div>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold opacity-75 shrink-0">
                    {getRelativeTime(act.timestamp)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 text-white text-xs font-extrabold rounded-xl"
          >
            Close User View
          </button>
        </div>
      </div>
    </div>
  );
}
