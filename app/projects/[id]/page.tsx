'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { useProject } from '@/lib/context/ProjectContext';

export default function ProjectCommandCenterPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;
  const { setActiveProjectId } = useProject();

  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    setActiveProjectId(projectId);
    loadOverview();
  }, [projectId]);

  const loadOverview = () => {
    setLoading(true);
    fetch(`/api/projects/${projectId}/overview`)
      .then((r) => r.json())
      .then((d) => {
        if (d.data) setOverview(d.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  if (loading || !overview) {
    return (
      <AppShell>
        <main className="content py-12 text-center text-xs text-stone-500 max-w-4xl mx-auto">
          Loading project command center...
        </main>
      </AppShell>
    );
  }

  const { project, labour, materials, payments, expenses, progress, siteHealth, alerts, recentActivity } = overview;

  return (
    <AppShell>
      <main className="content space-y-6 pb-24 max-w-4xl mx-auto">
        {/* Top Command Center Header */}
        <div className="bg-stone-900 border border-stone-800 p-6 rounded-2xl space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏗️</span>
                <h1 className="text-2xl font-black text-stone-100">{project.name}</h1>
                <span className="text-xs text-amber-400 font-mono">({project.code})</span>
              </div>
              <p className="text-xs text-stone-400 mt-1">
                📍 {project.location || 'Site Location Not Specified'} • Start: {new Date(project.startDate).toLocaleDateString('en-IN')}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase ${
                  project.status === 'ACTIVE'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : project.status === 'ON_HOLD'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-stone-500/20 text-stone-300 border border-stone-500/30'
                }`}
              >
                {project.status.replace('_', ' ')}
              </span>

              <Link
                href="/projects"
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold rounded-xl"
              >
                Switch Project
              </Link>
            </div>
          </div>

          {/* Primary Quick Actions Row */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-3 border-t border-stone-800/80">
            <Link
              href="/attendance"
              className="p-3 bg-stone-950 hover:bg-amber-500 hover:text-stone-950 border border-stone-800 text-stone-200 font-extrabold text-xs rounded-xl transition-all text-center flex flex-col items-center gap-1 group"
            >
              <span className="text-xl">👷</span>
              <span>Attendance</span>
            </Link>

            <Link
              href="/materials"
              className="p-3 bg-stone-950 hover:bg-amber-500 hover:text-stone-950 border border-stone-800 text-stone-200 font-extrabold text-xs rounded-xl transition-all text-center flex flex-col items-center gap-1 group"
            >
              <span className="text-xl">📦</span>
              <span>Material</span>
            </Link>

            <Link
              href="/expenses"
              className="p-3 bg-stone-950 hover:bg-amber-500 hover:text-stone-950 border border-stone-800 text-stone-200 font-extrabold text-xs rounded-xl transition-all text-center flex flex-col items-center gap-1 group"
            >
              <span className="text-xl">💸</span>
              <span>Expense</span>
            </Link>

            <Link
              href="/progress/update"
              className="p-3 bg-stone-950 hover:bg-amber-500 hover:text-stone-950 border border-stone-800 text-stone-200 font-extrabold text-xs rounded-xl transition-all text-center flex flex-col items-center gap-1 group"
            >
              <span className="text-xl">📋</span>
              <span>Work Update</span>
            </Link>

            <Link
              href="/payments"
              className="p-3 bg-stone-950 hover:bg-amber-500 hover:text-stone-950 border border-stone-800 text-stone-200 font-extrabold text-xs rounded-xl transition-all text-center flex flex-col items-center gap-1 group col-span-2 sm:col-span-1"
            >
              <span className="text-xl">💳</span>
              <span>Payment</span>
            </Link>
          </div>
        </div>

        {/* Operational Alerts Banner */}
        {alerts && alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((alt: any) => (
              <div
                key={alt.id}
                className={`p-4 rounded-xl border flex items-start justify-between gap-3 text-xs ${
                  alt.type === 'ALERT'
                    ? 'bg-red-950/80 border-red-800 text-red-200'
                    : alt.type === 'WARNING'
                    ? 'bg-amber-950/80 border-amber-800 text-amber-200'
                    : 'bg-blue-950/80 border-blue-800 text-blue-200'
                }`}
              >
                <div>
                  <div className="font-extrabold text-sm flex items-center gap-1.5">
                    <span>{alt.type === 'ALERT' ? '🚨' : alt.type === 'WARNING' ? '⚠️' : 'ℹ️'}</span>
                    <span>{alt.title}</span>
                  </div>
                  <p className="mt-1 opacity-90">{alt.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Site Health Summary */}
        <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-400">Site Health Dashboard</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-stone-950 rounded-xl border border-stone-800">
              <span className="text-stone-400 block font-semibold">Labour Health</span>
              <span
                className={`text-sm font-black mt-1 block ${
                  siteHealth.labour === 'Good' ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {siteHealth.labour === 'Good' ? '✓ Good' : '⚠️ Attention'}
              </span>
            </div>

            <div className="p-3 bg-stone-950 rounded-xl border border-stone-800">
              <span className="text-stone-400 block font-semibold">Materials Health</span>
              <span
                className={`text-sm font-black mt-1 block ${
                  siteHealth.materials === 'Good' ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {siteHealth.materials === 'Good' ? '✓ Good' : '⚠️ Low Stock'}
              </span>
            </div>

            <div className="p-3 bg-stone-950 rounded-xl border border-stone-800">
              <span className="text-stone-400 block font-semibold">Payments Health</span>
              <span
                className={`text-sm font-black mt-1 block ${
                  siteHealth.payments === 'Good' ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {siteHealth.payments === 'Good' ? '✓ Settled' : '⚠️ Due Balance'}
              </span>
            </div>

            <div className="p-3 bg-stone-950 rounded-xl border border-stone-800">
              <span className="text-stone-400 block font-semibold">Work Progress</span>
              <span
                className={`text-sm font-black mt-1 block ${
                  siteHealth.progress === 'On Track' ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {siteHealth.progress === 'On Track' ? '✓ On Track' : '⚠️ Open Issues'}
              </span>
            </div>
          </div>
        </div>

        {/* Today's Overview Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-stone-900 border border-stone-800 p-4 rounded-2xl">
            <span className="text-xs text-stone-400 block font-semibold">Workers Present</span>
            <span className="text-2xl font-black text-amber-400 mt-1 block">{labour.presentCount}</span>
            <span className="text-[10px] text-stone-500 mt-1 block">Cost: ₹{labour.todayCost.toLocaleString('en-IN')}</span>
          </div>

          <div className="bg-stone-900 border border-stone-800 p-4 rounded-2xl">
            <span className="text-xs text-stone-400 block font-semibold">Today Expenses</span>
            <span className="text-2xl font-black text-stone-100 mt-1 block">₹{expenses.todayExpenses.toLocaleString('en-IN')}</span>
            <span className="text-[10px] text-stone-500 mt-1 block">Month: ₹{expenses.monthExpenses.toLocaleString('en-IN')}</span>
          </div>

          <div className="bg-stone-900 border border-stone-800 p-4 rounded-2xl">
            <span className="text-xs text-stone-400 block font-semibold">Total Payments Due</span>
            <span className={`text-2xl font-black mt-1 block ${payments.totalDue > 0 ? 'text-amber-400' : 'text-stone-300'}`}>
              ₹{payments.totalDue.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-stone-500 mt-1 block">Labour + Vendor</span>
          </div>

          <div className="bg-stone-900 border border-stone-800 p-4 rounded-2xl">
            <span className="text-xs text-stone-400 block font-semibold">Low Stock Items</span>
            <span className={`text-2xl font-black mt-1 block ${materials.lowStockCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {materials.lowStockCount}
            </span>
            <span className="text-[10px] text-stone-500 mt-1 block">Total Items: {materials.totalItems}</span>
          </div>
        </div>

        {/* Detailed Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Section 1: Work Progress */}
          <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-100 flex items-center gap-2">
                <span>📋</span> Work Progress Today
              </h3>
              <Link href="/progress" className="text-xs font-bold text-amber-400 hover:underline">
                View Diary →
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-3 bg-stone-950 rounded-xl border border-stone-800">
                <span className="text-emerald-400 font-black text-lg block">{progress.completedCount}</span>
                <span className="text-stone-400 text-[10px]">Completed</span>
              </div>
              <div className="p-3 bg-stone-950 rounded-xl border border-stone-800">
                <span className="text-amber-400 font-black text-lg block">{progress.inProgressCount}</span>
                <span className="text-stone-400 text-[10px]">In Progress</span>
              </div>
              <div className="p-3 bg-stone-950 rounded-xl border border-stone-800">
                <span className="text-red-400 font-black text-lg block">{progress.openIssuesCount}</span>
                <span className="text-stone-400 text-[10px]">Open Issues</span>
              </div>
            </div>

            {progress.workItems.length > 0 && (
              <div className="space-y-2 pt-2">
                {progress.workItems.slice(0, 3).map((w: any) => (
                  <div key={w._id} className="p-3 bg-stone-950 rounded-xl border border-stone-800 text-xs flex justify-between">
                    <span className="font-bold text-stone-200">{w.workTypeName}</span>
                    <span className={`font-bold text-[10px] px-2 py-0.5 rounded-full ${w.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                      {w.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Labour Attendance */}
          <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-100 flex items-center gap-2">
                <span>👷</span> Labour Attendance Today
              </h3>
              <Link href="/attendance" className="text-xs font-bold text-amber-400 hover:underline">
                Mark Attendance →
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-3 bg-stone-950 rounded-xl border border-stone-800">
                <span className="text-emerald-400 font-black text-lg block">{labour.presentCount}</span>
                <span className="text-stone-400 text-[10px]">Present</span>
              </div>
              <div className="p-3 bg-stone-950 rounded-xl border border-stone-800">
                <span className="text-amber-400 font-black text-lg block">{labour.halfDayCount}</span>
                <span className="text-stone-400 text-[10px]">Half Day</span>
              </div>
              <div className="p-3 bg-stone-950 rounded-xl border border-stone-800">
                <span className="text-stone-400 font-black text-lg block">{labour.absentCount}</span>
                <span className="text-stone-400 text-[10px]">Absent</span>
              </div>
            </div>

            <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 text-xs flex justify-between items-center">
              <span className="text-stone-400">Estimated Today Labour Wage:</span>
              <span className="font-extrabold text-amber-400 text-sm">₹{labour.todayCost.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Section 3: Material Stock */}
          <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-100 flex items-center gap-2">
                <span>📦</span> Material Stock Alert
              </h3>
              <Link href="/materials/receive" className="text-xs font-bold text-amber-400 hover:underline">
                Receive Material →
              </Link>
            </div>

            {materials.lowStockItems.length === 0 ? (
              <div className="p-4 bg-emerald-950/30 border border-emerald-800/40 rounded-xl text-xs text-emerald-300 font-medium">
                ✓ All material stock levels are sufficient.
              </div>
            ) : (
              <div className="space-y-2">
                {materials.lowStockItems.map((m: any) => (
                  <div key={m._id} className="p-3 bg-stone-950 rounded-xl border border-red-900/60 text-xs flex justify-between items-center">
                    <div>
                      <span className="font-bold text-stone-100">{m.materialName}</span>
                      <span className="text-[10px] text-stone-400 block">Min: {m.minStockLevel} {m.unit}</span>
                    </div>
                    <span className="font-black text-red-400">
                      {m.availableQuantity} {m.unit} (Low)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 4: Payments & Due Balances */}
          <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-100 flex items-center gap-2">
                <span>💳</span> Financial Due Balances
              </h3>
              <Link href="/payments" className="text-xs font-bold text-amber-400 hover:underline">
                Pay Ledger →
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 space-y-1">
                <span className="text-stone-400 block">Labour Wage Due</span>
                <span className="font-black text-amber-400 text-base">₹{payments.totalLabourDue.toLocaleString('en-IN')}</span>
              </div>
              <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 space-y-1">
                <span className="text-stone-400 block">Vendor Outstanding</span>
                <span className="font-black text-amber-400 text-base">₹{payments.totalVendorDue.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Recent Site Activity Feed */}
        <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-stone-100 flex items-center gap-2">
            <span>⚡</span> Recent Site Activity Log
          </h3>

          {recentActivity.length === 0 ? (
            <div className="text-center py-6 text-xs text-stone-500">No activity logged today yet.</div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((act: any) => (
                <div key={act.id} className="p-3 bg-stone-950 rounded-xl border border-stone-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{act.icon}</span>
                    <div>
                      <span className="font-bold text-stone-100 block capitalize">{act.title}</span>
                      <span className="text-[11px] text-stone-400">{act.subtitle}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-stone-500">
                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </AppShell>
  );
}
