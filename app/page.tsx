'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import Link from 'next/link';
import { useProject } from '@/lib/context/ProjectContext';
import { useModules } from '@/lib/context/ModuleContext';
import { IProjectModules } from '@/lib/models/Project';

export default function HomePage() {
  const { activeProject } = useProject();
  const { isModuleEnabled } = useModules();

  const [summary, setSummary] = useState<any>(null);
  const [workerCount, setWorkerCount] = useState(0);
  const [materialMetrics, setMaterialMetrics] = useState<{ lowStockCount: number; outOfStockCount: number; totalAttentionCount: number } | null>(null);
  const [expenseSummary, setExpenseSummary] = useState<{ todayTotal: number; monthTotal: number; projectTotal: number } | null>(null);
  const [todayProgress, setTodayProgress] = useState<any>(null);
  const [paymentSummary, setPaymentSummary] = useState<any>(null);

  useEffect(() => {
    if (!activeProject?._id) return;
    const today = new Date().toISOString().slice(0, 10);

    if (isModuleEnabled('attendance')) {
      fetch(`/api/attendance/summary?projectId=${activeProject._id}&date=${today}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.data) setSummary(data.data);
        })
        .catch(console.error);
    }

    if (isModuleEnabled('workers')) {
      fetch(`/api/workers?projectId=${activeProject._id}&status=ACTIVE`)
        .then((res) => res.json())
        .then((data) => {
          if (data.data) setWorkerCount(data.data.length);
        })
        .catch(console.error);
    }

    if (isModuleEnabled('materials')) {
      fetch(`/api/materials/stock?projectId=${activeProject._id}&metricsOnly=true`)
        .then((res) => res.json())
        .then((data) => {
          if (data.data) setMaterialMetrics(data.data);
        })
        .catch(console.error);
    }

    if (isModuleEnabled('expenses')) {
      fetch(`/api/expenses/summary?projectId=${activeProject._id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.data) setExpenseSummary(data.data);
        })
        .catch(console.error);
    }

    if (isModuleEnabled('progress')) {
      fetch(`/api/progress?projectId=${activeProject._id}&date=${today}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.data) setTodayProgress(data.data);
        })
        .catch(console.error);
    }

    if (isModuleEnabled('payments')) {
      fetch(`/api/payments/summary?projectId=${activeProject._id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.data) setPaymentSummary(data.data);
        })
        .catch(console.error);
    }
  }, [activeProject?._id, isModuleEnabled]);

  const allQuickActions: { key: keyof IProjectModules | 'projects'; icon: string; label: string; href: string }[] = [
    { key: 'payments', icon: '💳', label: 'Payment', href: '/payments' },
    { key: 'attendance', icon: '✓', label: 'Attendance', href: '/attendance' },
    { key: 'materials', icon: '📦', label: 'Material', href: '/materials' },
    { key: 'progress', icon: '📋', label: 'Daily Progress', href: '/progress' },
    { key: 'expenses', icon: '💸', label: 'Expenses', href: '/expenses' },
    { key: 'workers', icon: '👷', label: 'Workers', href: '/workers' },
    { key: 'vendors', icon: '🏬', label: 'Vendors', href: '/vendors' },
    { key: 'documents', icon: '📂', label: 'Documents', href: '/documents' },
    { key: 'reports', icon: '📊', label: 'Reports', href: '/reports' },
    { key: 'projects', icon: '🏗️', label: 'Projects', href: '/projects' }
  ];

  const quick = allQuickActions.filter((action) => action.key === 'projects' || isModuleEnabled(action.key));

  const completedToday = todayProgress?.workItems?.filter((i: any) => i.status === 'COMPLETED').length || 0;
  const inProgressToday = todayProgress?.workItems?.filter((i: any) => i.status === 'IN_PROGRESS').length || 0;

  return (
    <AppShell>
      <main className="content pb-20">
        <div className="flex items-center justify-between">
          <div className="greeting">Site Dashboard 👋</div>
          <Link
            href="/settings/modules"
            className="text-xs font-extrabold text-[#087F3E] bg-[#EAF7EF] border border-[#bce6cb] px-3 py-1.5 rounded-xl hover:bg-[#d5f0df] transition-colors"
          >
            ⚙️ Control Panel
          </Link>
        </div>
        <div className="subtle" style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
          {activeProject ? `${activeProject.name} (${activeProject.code})` : 'Select a project site'}
        </div>

        {/* Stats Grid */}
        <section className="grid stats">
          {isModuleEnabled('attendance') && (
            <div className="card">
              <div className="subtle font-semibold">Present Today</div>
              <div className="stat-value text-emerald-400 font-extrabold">
                {summary ? `${summary.presentCount || 0} / ${workerCount}` : `0 / ${workerCount}`}
              </div>
            </div>
          )}

          {isModuleEnabled('progress') && (
            <div className="card">
              <div className="subtle font-semibold">Today's Progress</div>
              <div className="stat-value text-amber-400 font-extrabold">
                {todayProgress ? `${completedToday} Done · ${inProgressToday} In Prog` : 'No Update Yet'}
              </div>
            </div>
          )}

          {isModuleEnabled('expenses') && (
            <div className="card">
              <div className="subtle font-semibold">Today's Expenses</div>
              <div className="stat-value text-amber-400 font-extrabold">
                ₹{(expenseSummary?.todayTotal || 0).toLocaleString('en-IN')}
              </div>
            </div>
          )}

          {isModuleEnabled('materials') && (
            <div className="card">
              <div className="subtle font-semibold">Stock Attention Needed</div>
              <div className="stat-value text-amber-400 font-extrabold">
                {materialMetrics?.totalAttentionCount || 0} Items
              </div>
            </div>
          )}
        </section>

        {/* Quick Actions */}
        {quick.length > 0 && (
          <>
            <div className="section-title">Quick Actions</div>
            <section className="grid quick-actions">
              {quick.map((item) => (
                <Link className="action" href={item.href} key={item.label}>
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </section>
          </>
        )}

        {/* Enabled Operations List */}
        <div className="section-title">Operations & Modules</div>
        <section className="list space-y-3">
          {isModuleEnabled('progress') && (
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
          )}

          {isModuleEnabled('attendance') && (
            <div className="list-item flex items-center justify-between">
              <div>
                <strong>Daily Attendance Register</strong>
                <div className="subtle">Operational for {activeProject?.name || 'current site'}</div>
              </div>
              <Link href="/attendance" className="btn btn-secondary btn-sm">
                Open Register
              </Link>
            </div>
          )}

          {isModuleEnabled('materials') && (
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
          )}

          {isModuleEnabled('expenses') && (
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
          )}

          {isModuleEnabled('vendors') && (
            <div className="list-item flex items-center justify-between">
              <div>
                <strong>Vendor Management & Directory</strong>
                <div className="subtle">Vendor directory, bills, contacts & ledgers</div>
              </div>
              <Link href="/vendors" className="btn btn-secondary btn-sm">
                Open Vendors
              </Link>
            </div>
          )}
        </section>
      </main>
    </AppShell>
  );
}
