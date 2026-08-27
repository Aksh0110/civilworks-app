'use client';

import AppShell from '@/components/AppShell';

export default function PaymentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <main className="content">{children}</main>
    </AppShell>
  );
}
