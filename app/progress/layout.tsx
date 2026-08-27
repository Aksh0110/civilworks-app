'use client';

import AppShell from '@/components/AppShell';

export default function ProgressLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <main className="content">{children}</main>
    </AppShell>
  );
}
