'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useProject } from '@/lib/context/ProjectContext';
import { isFeatureEnabled } from '@/lib/config/features';

interface ProgressHistoryItem {
  _id: string;
  date: string;
  totalWorkItems: number;
  completedCount: number;
  inProgressCount: number;
  pendingCount: number;
  issueCount: number;
  photoCount: number;
  workforceCount: number;
  labourCost: number;
  weather?: string;
}

export default function DailyProgressHubPage() {
  const { activeProject } = useProject();
  const [history, setHistory] = useState<ProgressHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeProject?._id) return;
    loadHistory();
  }, [activeProject?._id]);

  const loadHistory = () => {
    if (!activeProject?._id) return;
    setLoading(true);
    fetch(`/api/progress/history?projectId=${activeProject._id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.data) setHistory(d.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayRecord = history.find(
    (h) => new Date(h.date).toISOString().slice(0, 10) === todayStr
  );

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📋</span>
            <h1 className="text-xl font-bold text-slate-900">Daily Progress & Site Logs</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Structured daily work updates & site diary for{' '}
            <span className="text-[#087F3E] font-semibold">{activeProject?.name || 'Selected Site'}</span>.
          </p>
        </div>

        <Link
          href="/progress/update"
          className="px-5 h-12 bg-[#087F3E] hover:bg-[#056B34] text-white text-xs font-bold rounded-xl transition-colors shadow flex items-center justify-center gap-2 shrink-0"
        >
          <span>✏️</span> Work Update
        </Link>
      </div>

      {/* Today's Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <span className="text-xs text-slate-500 block font-semibold">Today's Work Items</span>
          <span className="text-lg font-black text-amber-600 mt-1 block">
            {todayRecord ? `${todayRecord.totalWorkItems} Items` : '0 Items'}
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <span className="text-xs text-slate-500 block font-semibold">Completed Today</span>
          <span className="text-lg font-black text-[#087F3E] mt-1 block">
            {todayRecord ? `${todayRecord.completedCount} Done` : '0 Done'}
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <span className="text-xs text-slate-500 block font-semibold">Active Issues</span>
          <span className="text-lg font-black text-slate-900 mt-1 block">
            {todayRecord ? `${todayRecord.issueCount} Issues` : '0 Issues'}
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <span className="text-xs text-slate-500 block font-semibold">Site Photos</span>
          <span className="text-lg font-black text-slate-900 mt-1 block">
            {todayRecord ? `${todayRecord.photoCount} Photos` : '0 Photos'}
          </span>
        </div>
      </div>

      {/* Section Title */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#087F3E]">Daily Site Logs History</h2>
        <span className="text-xs text-slate-500">{history.length} Daily Reports</span>
      </div>

      {/* History Feed */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 text-sm">Loading daily site logs...</div>
      ) : history.length === 0 ? (
        <div className="bg-white border border-slate-200 p-8 rounded-2xl text-center space-y-3 shadow-sm">
          <span className="text-3xl">📝</span>
          <h3 className="text-base font-bold text-slate-900">No Daily Reports Found</h3>
          <p className="text-xs text-slate-500">Click "Work Update" to record today's site work progress.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((rec) => {
            const formattedDate = new Date(rec.date).toLocaleDateString('en-IN', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            });

            const dateIso = new Date(rec.date).toISOString().slice(0, 10);

            return (
              <Link
                key={rec._id}
                href={`/progress/report?date=${dateIso}`}
                className="group bg-white border border-slate-200 hover:border-[#087F3E] p-5 rounded-2xl transition-all duration-200 block space-y-3 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[#087F3E] text-sm">📅</span>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#087F3E] transition-colors">
                      {formattedDate}
                    </h3>
                  </div>

                  <span className="text-xs text-[#087F3E] font-bold group-hover:translate-x-1 transition-transform">
                    View Report →
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 font-bold">
                    📦 {rec.totalWorkItems} Work Items
                  </span>

                  <span className="px-2.5 py-1 rounded-lg bg-[#EAF7EF] border border-[#bce6cb] text-[#056B34] font-bold">
                    ✓ {rec.completedCount} Completed
                  </span>

                  {rec.inProgressCount > 0 && (
                    <span className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-bold">
                      ⏳ {rec.inProgressCount} In Progress
                    </span>
                  )}

                  {rec.pendingCount > 0 && (
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-bold">
                      ⏸️ {rec.pendingCount} Pending
                    </span>
                  )}

                  {rec.issueCount > 0 && (
                    <span className="px-2.5 py-1 rounded-lg bg-red-50 border border-red-200 text-red-700 font-bold">
                      ⚠️ {rec.issueCount} Issues
                    </span>
                  )}

                  {rec.photoCount > 0 && (
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 font-bold">
                      📷 {rec.photoCount} Photos
                    </span>
                  )}
                </div>

                {isFeatureEnabled('workers') && rec.workforceCount > 0 && (
                  <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex items-center gap-3">
                    <span>👷 Workforce: {rec.workforceCount} workers present</span>
                    {rec.labourCost > 0 && <span>· Labour Cost: ₹{rec.labourCost.toLocaleString('en-IN')}</span>}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
