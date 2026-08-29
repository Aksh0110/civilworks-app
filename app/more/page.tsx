'use client';

import AppShell from '@/components/AppShell';
import Link from 'next/link';
import { isFeatureEnabled } from '@/lib/config/features';
import { useAuth } from '@/lib/context/AuthContext';

const modules = [
  { key: 'reports', icon: '📊', title: 'Reports', desc: 'Master & cost summaries', href: '/reports' },
  { key: 'documents', icon: '📂', title: 'Documents', desc: 'Drawings, bills & files', href: '/documents' },
  { key: 'payments', icon: '💳', title: 'Payments', desc: 'Pay workers & vendors', href: '/payments' },
  { key: 'vendors', icon: '🏬', title: 'Vendors', desc: 'Profiles, bills & ledger', href: '/vendors' },
  { key: 'materials', icon: '📦', title: 'Materials', desc: 'Inward, issue & stock', href: '/materials' },
  { key: 'progress', icon: '📋', title: 'Daily Progress', desc: 'Work log & site diary', href: '/progress' },
  { key: 'expenses', icon: '💸', title: 'Expenses', desc: 'Log operational costs', href: '/expenses' },
  { key: 'workers', icon: '👷', title: 'Workers', desc: 'Database & daily rates', href: '/workers' },
  { key: 'projects', icon: '🏗️', title: 'Projects', desc: 'Site projects & setup', href: '/projects' }
];

export default function MorePage() {
  const { isAdmin } = useAuth();
  const visibleModules = modules.filter((m) => m.key === 'projects' || isFeatureEnabled(m.key as any));

  return (
    <AppShell>
      <main className="content">
        <div className="flex items-center justify-between mb-2">
          <h1 className="page-title text-base font-extrabold text-slate-900">Operations & Modules</h1>
          <span className="text-[11px] font-bold text-[#087F3E] bg-[#EAF7EF] px-2 py-0.5 rounded-full">
            {visibleModules.length + (isAdmin ? 1 : 0)} Modules
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {isAdmin && (
            <Link
              href="/admin/users"
              className="col-span-2 sm:col-span-3 bg-[#EAF7EF] border border-[#bce6cb] p-2.5 rounded-xl flex items-center gap-2.5 hover:bg-[#d8f3e1] transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#056B34] flex items-center justify-center text-lg shrink-0">
                👥
              </div>
              <div className="min-w-0 flex-1">
                <strong className="text-xs font-bold text-[#056B34] block truncate">User Management Portal</strong>
                <span className="text-[10px] text-[#056B34] block truncate">Supervise users, roles & assigned site permissions</span>
              </div>
            </Link>
          )}

          {visibleModules.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="bg-white border border-slate-200 p-2.5 rounded-xl hover:border-[#087F3E] transition-colors flex items-center gap-2.5 shadow-2xs"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center text-base shrink-0">
                {item.icon}
              </div>
              <div className="min-w-0 flex-1">
                <strong className="text-xs font-bold text-slate-900 block truncate">{item.title}</strong>
                <span className="text-[10px] text-slate-500 block truncate">{item.desc}</span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </AppShell>
  );
}
