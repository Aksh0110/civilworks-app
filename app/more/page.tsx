import AppShell from '@/components/AppShell';
import Link from 'next/link';

const modules = [
  { icon: '💳', title: 'Payments & Receipts', desc: 'Pay workers & vendors via cash/UPI', href: '/payments' },
  { icon: '🏬', title: 'Vendor Management', desc: 'Vendor profiles, bills & ledgers', href: '/vendors' },
  { icon: '📦', title: 'Materials & Stock', desc: 'Receive, issue & track site inventory', href: '/materials' },
  { icon: '📋', title: 'Daily Work Progress', desc: 'Record work completed & site diary', href: '/progress' },
  { icon: '💸', title: 'Expenses & Bills', desc: 'Log site operational expenditures', href: '/expenses' },
  { icon: '👷', title: 'Workers', desc: 'Worker database & rates', href: '/workers' },
  { icon: '🏗️', title: 'Projects', desc: 'Site projects & locations', href: '/projects' }
];

export default function MorePage() {
  return (
    <AppShell>
      <main className="content">
        <h1 className="page-title">Operations & Modules</h1>
        <p className="subtle" style={{ marginBottom: '16px' }}>
          Access all site management workflows and financial tools.
        </p>

        <div className="grid">
          {modules.map((item) => (
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
