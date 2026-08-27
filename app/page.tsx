'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { useProject } from '@/lib/context/ProjectContext';
import Link from 'next/link';

export default function HomePage() {
  const { activeProject } = useProject();
  const [summary, setSummary] = useState<any>(null);
  const [workerCount, setWorkerCount] = useState(0);
  const [materialMetrics, setMaterialMetrics] = useState<{ lowStockCount: number; outOfStockCount: number; totalAttentionCount: number } | null>(null);
  const [expenseSummary, setExpenseSummary] = useState<{ todayTotal: number; monthTotal: number; projectTotal: number } | null>(null);
  const [todayProgress, setTodayProgress] = useState<any>(null);

  useEffect(() => {
    if (!activeProject?._id) return;
    const today = new Date().toISOString().slice(0, 10);

    fetch(`/api/attendance/summary?projectId=${activeProject._id}&date=${today}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setSummary(data.data);
      })
      .catch(console.error);

    fetch(`/api/workers?projectId=${activeProject._id}&status=ACTIVE`)
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setWorkerCount(data.data.length);
      })
      .catch(console.error);

    fetch(`/api/materials/stock?projectId=${activeProject._id}&metricsOnly=true`)
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setMaterialMetrics(data.data);
      })
      .catch(console.error);

    fetch(`/api/expenses/summary?projectId=${activeProject._id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setExpenseSummary(data.data);
      })
      .catch(console.error);

    fetch(`/api/progress?projectId=${activeProject._id}&date=${today}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setTodayProgress(data.data);
      })
      .catch(console.error);
  }, [activeProject?._id]);

  const quick = [
    { icon: '✓', label: 'Attendance', href: '/attendance', active: true },
    { icon: '📦', label: 'Material', href: '/materials', active: true },
    { icon: '📋', label: 'Daily Progress', href: '/progress', active: true },
    { icon: '💸', label: 'Expenses', href: '/expenses', active: true },
    { icon: '👷', label: 'Workers', href: '/workers', active: true },
    { icon: '🏗️', label: 'Projects', href: '/projects', active: true }
  ];

  const completedToday = todayProgress?.workItems?.filter((i: any) => i.status === 'COMPLETED').length || 0;
  const inProgressToday = todayProgress?.workItems?.filter((i: any) => i.status === 'IN_PROGRESS').length || 0;

  return (
    <AppShell>
      <main className="content">
        <div className="greeting">Site Dashboard 👋</div>
        <div className="subtle" style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
          {activeProject ? `${activeProject.name} (${activeProject.code})` : 'Select a project site'}
        </div>

        <section className="grid stats">
          <div className="card">
            <div className="subtle font-semibold">Present Today</div>
            <div className="stat-value text-emerald-400 font-extrabold">
              {summary ? `${summary.presentCount || 0} / ${workerCount}` : `0 / ${workerCount}`}
            </div>
          </div>
          <div className="card">
            <div className="subtle font-semibold">Today's Progress</div>
            <div className="stat-value text-amber-400 font-extrabold">
              {todayProgress ? `${completedToday} Done · ${inProgressToday} In Prog` : 'No Update Yet'}
            </div>
          </div>
          <div className="card">
            <div className="subtle font-semibold">Today's Expenses</div>
            <div className="stat-value text-amber-400 font-extrabold">
              ₹{(expenseSummary?.todayTotal || 0).toLocaleString('en-IN')}
            </div>
          </div>
          <div className="card">
            <div className="subtle font-semibold">Stock Attention Needed</div>
            <div className="stat-value text-amber-400 font-extrabold">
              {materialMetrics?.totalAttentionCount || 0} Items
            </div>
          </div>
        </section>

        <div className="section-title">Quick Actions</div>
        <section className="grid quick-actions">
          {quick.map((item) => (
            <Link
              className={`action ${!item.active ? 'disabled' : ''}`}
              href={item.href}
              key={item.label}
            >
              <span>{item.icon}</span>
              {item.label}
              {!item.active && <div className="subtle-tag">Upcoming</div>}
            </Link>
          ))}
        </section>

        <div className="section-title">Operations & Modules</div>
        <section className="list space-y-3">
          <div className="list-item flex items-center justify-between">
            <div>
              <strong>Daily Progress & Site Diary</strong>
              <div className="subtle">
                {todayProgress
                  ? `Today: ${todayProgress.workItems?.length || 0} work items, ${todayProgress.issues?.length || 0} issues`
                  : 'Record structured work items, locations, quantities, issues & photos'}
              </div>
            </div>
            <Link href="/progress/update" className="btn btn-secondary btn-sm">
              Work Update
            </Link>
          </div>

          <div className="list-item flex items-center justify-between">
            <div>
              <strong>Daily Attendance Register</strong>
              <div className="subtle">Operational for {activeProject?.name || 'current site'}</div>
            </div>
            <Link href="/attendance" className="btn btn-secondary btn-sm">
              Open Register
            </Link>
          </div>

          <div className="list-item flex items-center justify-between">
            <div>
              <strong>Material Inward & Issue Register</strong>
              <div className="subtle">
                {materialMetrics?.totalAttentionCount
                  ? `⚠️ ${materialMetrics.totalAttentionCount} materials low or out of stock`
                  : 'Track site deliveries, material issue, & live stock'}
              </div>
            </div>
            <Link href="/materials" className="btn btn-secondary btn-sm">
              Manage Material
            </Link>
          </div>

          <div className="list-item flex items-center justify-between">
            <div>
              <strong>Site Operational Expenses</strong>
              <div className="subtle">
                {expenseSummary
                  ? `This Month: ₹${(expenseSummary.monthTotal || 0).toLocaleString('en-IN')}`
                  : 'Track fuel, transport, tools, food & utilities'}
              </div>
            </div>
            <Link href="/expenses" className="btn btn-secondary btn-sm">
              Manage Expenses
            </Link>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
