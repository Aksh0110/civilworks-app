'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useProject } from '@/lib/context/ProjectContext';

export default function ProjectCommandCenterPage() {
  const params = useParams();
  const projectId = params?.id as string;
  const { setActiveProjectId } = useProject();

  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!projectId) return;
    loadOverview();
  }, [projectId]);

  const loadOverview = () => {
    setLoading(true);
    fetch(`/api/projects/${projectId}/overview`)
      .then((r) => r.json())
      .then((d) => {
        if (d.data) {
          setOverview(d.data);
          setActiveProjectId(projectId);
        } else {
          setError(d.message || 'Failed to load project overview');
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-xs text-slate-500 max-w-4xl mx-auto">
        Loading Command Center Overview...
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="bg-white border border-slate-200 p-8 rounded-2xl text-center space-y-4 max-w-4xl mx-auto shadow-sm">
        <div className="text-3xl">⚠️</div>
        <h3 className="text-base font-bold text-slate-900">{error || 'Project not found'}</h3>
        <Link href="/projects" className="inline-block px-4 py-2 bg-[#087F3E] text-white text-xs font-bold rounded-xl">
          ← Back to Project Directory
        </Link>
      </div>
    );
  }

  const { project, labour, materials, payments, expenses, progress, siteHealth, alerts, recentActivity } = overview;

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      {/* Top Banner & Quick Actions */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏗️</span>
              <h1 className="text-2xl font-extrabold text-slate-900">{project.name}</h1>
              <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-[#EAF7EF] text-[#056B34] border border-[#bce6cb]">
                {project.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Code: <span className="text-slate-800 font-bold">{project.code}</span>
              {project.location ? ` • Location: ${project.location}` : ''}
              {project.siteContact ? ` • Contact: ${project.siteContact}` : ''}
            </p>
          </div>

          <Link
            href="/projects"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl shrink-0 self-start sm:self-auto"
          >
            Switch Project ▾
          </Link>
        </div>

        {/* Primary Command Actions Grid */}
        <div className="grid grid-cols-5 gap-2 pt-2 border-t border-slate-100">
          <Link
            href="/attendance"
            className="p-3 bg-[#EAF7EF] hover:bg-[#d5edd9] text-[#056B34] rounded-xl text-center flex flex-col items-center gap-1 transition-colors"
          >
            <span className="text-xl">👷</span>
            <span className="text-[11px] font-extrabold">Attendance</span>
          </Link>

          <Link
            href="/materials"
            className="p-3 bg-[#EAF7EF] hover:bg-[#d5edd9] text-[#056B34] rounded-xl text-center flex flex-col items-center gap-1 transition-colors"
          >
            <span className="text-xl">📦</span>
            <span className="text-[11px] font-extrabold">Material</span>
          </Link>

          <Link
            href="/expenses/add"
            className="p-3 bg-[#EAF7EF] hover:bg-[#d5edd9] text-[#056B34] rounded-xl text-center flex flex-col items-center gap-1 transition-colors"
          >
            <span className="text-xl">💸</span>
            <span className="text-[11px] font-extrabold">Expense</span>
          </Link>

          <Link
            href="/progress/update"
            className="p-3 bg-[#EAF7EF] hover:bg-[#d5edd9] text-[#056B34] rounded-xl text-center flex flex-col items-center gap-1 transition-colors"
          >
            <span className="text-xl">📋</span>
            <span className="text-[11px] font-extrabold">Work Update</span>
          </Link>

          <Link
            href="/payments"
            className="p-3 bg-[#087F3E] hover:bg-[#056B34] text-white rounded-xl text-center flex flex-col items-center gap-1 transition-colors shadow"
          >
            <span className="text-xl">💳</span>
            <span className="text-[11px] font-black">Payment</span>
          </Link>
        </div>
      </div>

      {/* Operational Alerts Engine */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alt: any) => (
            <div
              key={alt.id}
              className={`p-4 rounded-xl border flex items-start gap-3 shadow-sm ${
                alt.type === 'ALERT'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : alt.type === 'WARNING'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-blue-50 border-blue-200 text-blue-900'
              }`}
            >
              <span className="text-lg">
                {alt.type === 'ALERT' ? '🚨' : alt.type === 'WARNING' ? '⚠️' : 'ℹ️'}
              </span>
              <div>
                <h4 className="text-xs font-extrabold uppercase">{alt.title}</h4>
                <p className="text-xs mt-0.5 font-medium">{alt.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Site Health Dashboard Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <span className="text-xs text-slate-500 block font-semibold">Labour Health</span>
          <span
            className={`text-base font-black mt-1 block ${
              siteHealth.labour === 'Good' ? 'text-[#087F3E]' : 'text-amber-600'
            }`}
          >
            {siteHealth.labour}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">
            {labour.presentCount} Present · {labour.absentCount} Absent
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <span className="text-xs text-slate-500 block font-semibold">Materials Health</span>
          <span
            className={`text-base font-black mt-1 block ${
              siteHealth.materials === 'Good' ? 'text-[#087F3E]' : 'text-red-600'
            }`}
          >
            {siteHealth.materials}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">
            {materials.lowStockCount > 0 ? `${materials.lowStockCount} items low` : 'All stock good'}
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <span className="text-xs text-slate-500 block font-semibold">Payments Health</span>
          <span
            className={`text-base font-black mt-1 block ${
              siteHealth.payments === 'Good' ? 'text-[#087F3E]' : 'text-amber-600'
            }`}
          >
            {siteHealth.payments}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">
            ₹{payments.totalDue.toLocaleString('en-IN')} total due
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <span className="text-xs text-slate-500 block font-semibold">Progress Health</span>
          <span
            className={`text-base font-black mt-1 block ${
              siteHealth.progress === 'On Track' ? 'text-[#087F3E]' : 'text-amber-600'
            }`}
          >
            {siteHealth.progress}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">
            {progress.completedCount} Done · {progress.openIssuesCount} Issues
          </span>
        </div>
      </div>

      {/* Feature Summaries Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Labour Summary Card */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>👷</span> Today Labour Status
            </h3>
            <Link href="/attendance" className="text-xs font-bold text-[#087F3E]">
              Register →
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center pt-2">
            <div className="bg-[#EAF7EF] p-2.5 rounded-xl border border-[#bce6cb]">
              <span className="text-[10px] text-[#056B34] block font-bold">PRESENT</span>
              <span className="text-lg font-black text-[#056B34]">{labour.presentCount}</span>
            </div>
            <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200">
              <span className="text-[10px] text-amber-700 block font-bold">HALF DAY</span>
              <span className="text-lg font-black text-amber-700">{labour.halfDayCount}</span>
            </div>
            <div className="bg-red-50 p-2.5 rounded-xl border border-red-200">
              <span className="text-[10px] text-red-700 block font-bold">ABSENT</span>
              <span className="text-lg font-black text-red-700">{labour.absentCount}</span>
            </div>
          </div>
        </div>

        {/* Expenses Summary Card */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>💸</span> Site Expenses
            </h3>
            <Link href="/expenses" className="text-xs font-bold text-[#087F3E]">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center pt-2">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 block font-bold">TODAY</span>
              <span className="text-base font-black text-slate-900">₹{expenses.todayExpenses.toLocaleString('en-IN')}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 block font-bold">THIS MONTH</span>
              <span className="text-base font-black text-slate-900">₹{expenses.monthExpenses.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Log */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <span>📋</span> Recent Site Activity Log
        </h3>
        {recentActivity.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">No activity recorded today.</div>
        ) : (
          <div className="space-y-2">
            {recentActivity.map((act: any) => (
              <div key={act.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{act.icon}</span>
                  <div>
                    <span className="font-bold text-slate-900 block">{act.title}</span>
                    <span className="text-slate-500 text-[11px]">{act.subtitle}</span>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 font-semibold shrink-0">
                  {new Date(act.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
