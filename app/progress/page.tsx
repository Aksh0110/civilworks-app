'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useProject } from '@/lib/context/ProjectContext';

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
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-900 border border-stone-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📋</span>
            <h1 className="text-xl font-bold text-stone-100">Daily Progress & Site Logs</h1>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Structured daily work updates & site diary for{' '}
            <span className="text-amber-400 font-semibold">{activeProject?.name || 'Selected Site'}</span>.
          </p>
        </div>

        <Link
          href="/progress/update"
          className="px-5 h-12 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2 shrink-0"
        >
          <span>✏️</span> Work Update
        </Link>
      </div>

      {/* Today's Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl">
          <span className="text-xs text-stone-400 block font-medium">Today's Work Items</span>
          <span className="text-lg font-bold text-amber-400 mt-1 block">
            {todayRecord ? `${todayRecord.totalWorkItems} Items` : '0 Items'}
          </span>
        </div>

        <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl">
          <span className="text-xs text-stone-400 block font-medium">Completed Today</span>
          <span className="text-lg font-bold text-emerald-400 mt-1 block">
            {todayRecord ? `${todayRecord.completedCount} Done` : '0 Done'}
          </span>
        </div>

        <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl">
          <span className="text-xs text-stone-400 block font-medium">Active Issues</span>
          <span className="text-lg font-bold text-stone-100 mt-1 block">
            {todayRecord ? `${todayRecord.issueCount} Issues` : '0 Issues'}
          </span>
        </div>

        <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl">
          <span className="text-xs text-stone-400 block font-medium">Site Photos</span>
          <span className="text-lg font-bold text-stone-100 mt-1 block">
            {todayRecord ? `${todayRecord.photoCount} Photos` : '0 Photos'}
          </span>
        </div>
      </div>

      {/* Section Title */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400">Daily Site Logs History</h2>
        <span className="text-xs text-stone-500">{history.length} Daily Reports</span>
      </div>

      {/* History Feed */}
      {loading ? (
        <div className="py-12 text-center text-stone-500 text-sm">Loading daily site logs...</div>
      ) : history.length === 0 ? (
        <div className="bg-stone-900 border border-stone-800 p-8 rounded-2xl text-center space-y-3">
          <span className="text-3xl">📝</span>
          <h3 className="text-base font-bold text-stone-200">No Daily Reports Found</h3>
          <p className="text-xs text-stone-500">Click "Work Update" to record today's site work progress.</p>
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
                className="group bg-stone-900 border border-stone-800 hover:border-amber-500/50 p-5 rounded-2xl transition-all duration-200 block space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 text-sm">📅</span>
                    <h3 className="text-sm font-bold text-stone-100 group-hover:text-amber-400 transition-colors">
                      {formattedDate}
                    </h3>
                  </div>

                  <span className="text-xs text-stone-400 font-semibold group-hover:translate-x-1 transition-transform">
                    View Report →
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-stone-950 border border-stone-800 text-stone-200 font-semibold">
                    📦 {rec.totalWorkItems} Work Items
                  </span>

                  <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 font-semibold">
                    ✓ {rec.completedCount} Completed
                  </span>

                  {rec.inProgressCount > 0 && (
                    <span className="px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-800 text-amber-300 font-semibold">
                      ⏳ {rec.inProgressCount} In Progress
                    </span>
                  )}

                  {rec.pendingCount > 0 && (
                    <span className="px-2.5 py-1 rounded-lg bg-stone-800 border border-stone-700 text-stone-300 font-semibold">
                      ⏸️ {rec.pendingCount} Pending
                    </span>
                  )}

                  {rec.issueCount > 0 && (
                    <span className="px-2.5 py-1 rounded-lg bg-red-950/80 border border-red-800 text-red-300 font-semibold">
                      ⚠️ {rec.issueCount} Issues
                    </span>
                  )}

                  {rec.photoCount > 0 && (
                    <span className="px-2.5 py-1 rounded-lg bg-stone-950 border border-stone-800 text-stone-400 font-semibold">
                      📷 {rec.photoCount} Photos
                    </span>
                  )}
                </div>

                {rec.workforceCount > 0 && (
                  <div className="text-[11px] text-stone-500 pt-1 border-t border-stone-800/60 flex items-center gap-3">
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
