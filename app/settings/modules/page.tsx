'use client';

import React, { useState } from 'react';
import AppShell from '@/components/AppShell';
import { useModules } from '@/lib/context/ModuleContext';
import { useProject } from '@/lib/context/ProjectContext';
import { IProjectModules } from '@/lib/models/Project';

interface ModuleItemConfig {
  key: keyof IProjectModules;
  title: string;
  icon: string;
  description: string;
}

const MODULE_DEFINITIONS: ModuleItemConfig[] = [
  { key: 'workers', title: 'Workers Database', icon: '👷', description: 'Worker registry, daily rates, categories, and profiles' },
  { key: 'attendance', title: 'Attendance Register', icon: '📋', description: 'Daily worker attendance, wage calculation, and muster log' },
  { key: 'materials', title: 'Materials & Inventory', icon: '📦', description: 'Material master, inward receipts, outward issue, and stock balances' },
  { key: 'expenses', title: 'Expenses & Categories', icon: '💸', description: 'Site operational expenditures, petty cash, and expense categories' },
  { key: 'vendors', title: 'Vendor Management', icon: '🏬', description: 'Vendor directory, vendor bills, contacts, and transaction ledgers' },
  { key: 'progress', title: 'Daily Work Progress (DPR)', icon: '🏗️', description: 'Site progress logs, work types, site issues, and daily reports' },
  { key: 'payments', title: 'Payments & Receipts', icon: '💳', description: 'Worker wage payouts, vendor bill settlements, and advances' },
  { key: 'documents', title: 'Documents Hub', icon: '📂', description: 'Site drawings, agreement attachments, vouchers, and file repository' },
  { key: 'reports', title: 'Reports & Analytics', icon: '📊', description: 'Muster registers, site expense analytics, and financial summaries' }
];

export default function ModuleControlPanelPage() {
  const { activeProject } = useProject();
  const { enabledModules, updateModules } = useModules();
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleToggle = async (key: keyof IProjectModules) => {
    if (!activeProject?._id) return;
    const nextState = !enabledModules[key];
    try {
      setSavingKey(key);
      setStatusMsg(null);
      await updateModules({ [key]: nextState });
      setStatusMsg({
        type: 'success',
        text: `Module "${MODULE_DEFINITIONS.find((m) => m.key === key)?.title}" is now ${nextState ? 'ENABLED' : 'DISABLED'}.`
      });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to update module state' });
    } finally {
      setSavingKey(null);
    }
  };

  const enabledCount = MODULE_DEFINITIONS.filter((m) => enabledModules[m.key]).length;

  return (
    <AppShell>
      <main className="content max-w-4xl mx-auto space-y-6 pb-20">
        {/* Banner Header */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚙️</span>
              <h1 className="text-xl font-bold text-slate-900">Module Control Panel</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Enable or disable feature modules for <span className="font-bold text-[#087F3E]">{activeProject?.name || 'Active Site'}</span>. Disabled modules leave no traces in navigation or dashboards.
            </p>
          </div>

          <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center shrink-0">
            <span className="text-xs font-bold text-slate-500 uppercase block">Active Modules</span>
            <span className="text-lg font-black text-[#087F3E]">
              {enabledCount} / {MODULE_DEFINITIONS.length}
            </span>
          </div>
        </div>

        {statusMsg && (
          <div
            className={`p-4 rounded-xl text-xs font-bold border flex items-center justify-between gap-2 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            <span>{statusMsg.text}</span>
            <button onClick={() => setStatusMsg(null)} className="text-slate-400 font-bold hover:text-slate-600">
              ✕
            </button>
          </div>
        )}

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MODULE_DEFINITIONS.map((mod) => {
            const isEnabled = enabledModules[mod.key];
            const isSaving = savingKey === mod.key;

            return (
              <div
                key={mod.key}
                className={`p-5 rounded-2xl border transition-all shadow-sm flex items-start justify-between gap-4 ${
                  isEnabled
                    ? 'bg-white border-slate-200 hover:border-[#087F3E]'
                    : 'bg-slate-50 border-slate-200 opacity-75'
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{mod.icon}</span>
                    <h3 className="text-sm font-extrabold text-slate-900">{mod.title}</h3>
                  </div>
                  <p className="text-xs text-slate-500 leading-normal">{mod.description}</p>
                  <div className="pt-1">
                    <span
                      className={`inline-block text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border ${
                        isEnabled
                          ? 'bg-[#EAF7EF] text-[#056B34] border-[#bce6cb]'
                          : 'bg-slate-200 text-slate-600 border-slate-300'
                      }`}
                    >
                      {isEnabled ? '● Active' : '○ Disabled'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleToggle(mod.key)}
                  disabled={isSaving}
                  className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isEnabled ? 'bg-[#087F3E]' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      isEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </main>
    </AppShell>
  );
}
