import AppShell from '@/components/AppShell';

const upcomingModules = [
  { icon: '📦', title: 'Materials & Stock', desc: 'Receive, issue & track site inventory' },
  { icon: '₹', title: 'Expenses & Bills', desc: 'Log site expenditures & vouchers' },
  { icon: '📋', title: 'Daily Work Progress', desc: 'Record work completed & site photos' },
  { icon: '💳', title: 'Payments & Receipts', desc: 'Pay workers & vendors via cash/UPI' },
  { icon: '🏬', title: 'Vendor Management', desc: 'Vendor profiles, bills & ledgers' },
  { icon: '📊', title: 'Reports & Export', desc: 'Daily registers & cost summaries' }
];

export default function MorePage() {
  return (
    <AppShell>
      <main className="content">
        <h1 className="page-title">Advanced Workflows</h1>
        <p className="subtle" style={{ marginBottom: '16px' }}>
          Workflows 02–06 will unlock in subsequent development milestones.
        </p>

        <div className="grid">
          {upcomingModules.map((item) => (
            <div key={item.title} className="card" style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
              <div style={{ fontSize: '28px' }}>{item.icon}</div>
              <div>
                <strong>{item.title}</strong>
                <div className="subtle">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </AppShell>
  );
}
