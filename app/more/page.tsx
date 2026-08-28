'use client';

import AppShell from '@/components/AppShell';
import Link from 'next/link';
import { useModules } from '@/lib/context/ModuleContext';
import { IProjectModules } from '@/lib/models/Project';

interface ModuleCardDef {
  key: keyof IProjectModules | 'projects';
  icon: string;
  title: string;
  desc: string;
  href: string;
}

const ALL_MODULES: ModuleCardDef[] = [
  { key: 'reports', icon: '📊', title: 'Reports & Analytics', desc: 'Statements, muster registers & cost summaries', href: '/reports' },
  { key: 'documents', icon: '📂', title: 'Documents Hub', desc: 'Centralized site drawings, bills & attachments', href: '/documents' },
  { key: 'payments', icon: '💳', title: 'Payments & Receipts', desc: 'Pay workers & vendors via cash/UPI', href: '/payments' },
  { key: 'vendors', icon: '🏬', title: 'Vendor Management', desc: 'Vendor profiles, bills & ledgers', href: '/vendors' },
  { key: 'materials', icon: '📦', title: 'Materials & Stock', desc: 'Receive, issue & track site inventory', href: '/materials' },
  { key: 'progress', icon: '📋', title: 'Daily Work Progress', desc: 'Record work completed & site diary', href: '/progress' },
  { key: 'expenses', icon: '💸', title: 'Expenses & Bills', desc: 'Log site operational expenditures', href: '/expenses' },
  { key: 'workers', icon: '👷', title: 'Workers', desc: 'Worker database & rates', href: '/workers' },
  { key: 'attendance', icon: '📋', title: 'Attendance Register', desc: 'Daily attendance & wage calculation', href: '/attendance' },
  { key: 'projects', icon: '🏗️', title: 'Projects', desc: 'Site projects & locations', href: '/projects' }
];

export default function MorePage() {
  const { isModuleEnabled } = useModules();

  const visibleModules = ALL_MODULES.filter((m) => {
    if (m.key === 'projects') return true;
    return isModuleEnabled(m.key);
  });

  return (
    <AppShell>
      <main className="content pb-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="page-title">Operations & Modules</h1>
            <p className="subtle">
              Access enabled site management workflows, reports, and repositories.
            </p>
          </div>

          <Link
            href="/settings/modules"
            className="px-4 py-2.5 bg-[#087F3E] hover:bg-[#056B34] text-white text-xs font-extrabold rounded-xl shadow transition-colors flex items-center gap-2 self-start sm:self-auto"
          >
            <span>⚙️</span> Module Control Panel
          </Link>
        </div>

        <div className="grid">
          {visibleModules.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="card text-decoration-none"
              style={{ display: 'flex', gap: '14px', alignItems: 'center', color: 'inherit', textDecoration: 'none' }}
            >
              <div style={{ fontSize: '28px' }}>{item.icon}</div>
              <div>
                <strong>{item.title}</strong>
                <div className="subtle">{item.desc}</div>
              </div>
            </Link>
          ))}

          <Link
            href="/settings/modules"
            className="card text-decoration-none"
            style={{
              display: 'flex',
              gap: '14px',
              alignItems: 'center',
              color: '#056B34',
              backgroundColor: '#EAF7EF',
              borderColor: '#bce6cb',
              textDecoration: 'none'
            }}
          >
            <div style={{ fontSize: '28px' }}>⚙️</div>
            <div>
              <strong>Module Control Panel</strong>
              <div className="subtle" style={{ color: '#087F3E' }}>Enable or disable app feature modules</div>
            </div>
          </Link>
        </div>
      </main>
    </AppShell>
  );
}
