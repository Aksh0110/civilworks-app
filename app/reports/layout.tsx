'use client';

import AppShell from '@/components/AppShell';

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <main className="content print:p-0 print:m-0 print:bg-white print:text-black">
        {children}
      </main>
    </AppShell>
  );
}
