'use client';

import AppShell from '@/components/AppShell';
import Link from 'next/link';
import { isFeatureEnabled } from '@/lib/config/features';
import { useAuth } from '@/lib/context/AuthContext';

const modules = [
  { key: 'reports', icon: '📊', title: 'Reports & Analytics', desc: 'Statements, muster registers & cost summaries', href: '/reports' },
  { key: 'documents', icon: '📂', title: 'Documents Hub', desc: 'Centralized site drawings, bills & attachments', href: '/documents' },
  { key: 'payments', icon: '💳', title: 'Payments & Receipts', desc: 'Pay workers & vendors via cash/UPI', href: '/payments' },
  { key: 'vendors', icon: '🏬', title: 'Vendor Management', desc: 'Vendor profiles, bills & ledgers', href: '/vendors' },
  { key: 'materials', icon: '📦', title: 'Materials & Stock', desc: 'Receive, issue & track site inventory', href: '/materials' },
  { key: 'progress', icon: '📋', title: 'Daily Work Progress', desc: 'Record work completed & site diary', href: '/progress' },
  { key: 'expenses', icon: '💸', title: 'Expenses & Bills', desc: 'Log site operational expenditures', href: '/expenses' },
  { key: 'workers', icon: '👷', title: 'Workers', desc: 'Worker database & rates', href: '/workers' },
  { key: 'projects', icon: '🏗️', title: 'Projects', desc: 'Site projects & locations', href: '/projects' }
];

export default function MorePage() {
  const { isAdmin } = useAuth();
  const visibleModules = modules.filter((m) => m.key === 'projects' || isFeatureEnabled(m.key as any));

  return (
    <AppShell>
      <main className="content">
        <h1 className="page-title">Operations & Modules</h1>
        <p className="subtle" style={{ marginBottom: '16px' }}>
          Access all site management workflows, reports, and document repositories.
        </p>

        <div className="grid">
          {isAdmin && (
            <>
              <Link
                href="/admin/users"
                className="card text-decoration-none border-2 border-[#087F3E] bg-[#EAF7EF]"
                style={{ display: 'flex', gap: '14px', alignItems: 'center', color: 'inherit', textDecoration: 'none' }}
              >
                <div style={{ fontSize: '28px' }}>👥</div>
                <div>
                  <strong className="text-[#056B34]">User Management Portal</strong>
                  <div className="subtle text-[#056B34]">Supervise users, roles & assigned site permissions</div>
                </div>
              </Link>

              <Link
                href="/admin/audit"
                className="card text-decoration-none border-2 border-purple-500 bg-purple-50"
                style={{ display: 'flex', gap: '14px', alignItems: 'center', color: 'inherit', textDecoration: 'none' }}
              >
                <div style={{ fontSize: '28px' }}>📋</div>
                <div>
                  <strong className="text-purple-900">Activity Audit & Supervision</strong>
                  <div className="subtle text-purple-700">Monitor all supervised user actions & audit trails</div>
                </div>
              </Link>
            </>
          )}

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
        </div>
      </main>
    </AppShell>
  );
}
