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
    <div className="space-y-3 pb-20 max-w-4xl mx-auto">
      <div className="flex flex-row items-center justify-between gap-2 bg-white border border-slate-200 p-3 rounded-xl shadow-2xs">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg">📋</span>
            <h1 className="text-base font-extrabold text-slate-900">Daily Progress & Site Logs</h1>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Daily work updates & site diary for <span className="text-[#087F3E] font-semibold">{activeProject?.name || 'Selected Site'}</span>.
          </p>
        </div>

        <Link
          href="/progress/update"
          className="px-3 h-8 bg-[#087F3E] hover:bg-[#056B34] text-white text-[11px] font-bold rounded-lg transition-colors shadow-2xs flex items-center justify-center gap-1 shrink-0"
        >
          <span>✏️</span> Work Update
        </Link>
      </div>

      {/* Today's Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-white border border-slate-200 p-2.5 rounded-xl shadow-2xs">
          <span className="text-[11px] text-slate-500 block font-semibold">Today Work Items</span>
          <span className="text-base font-black text-amber-600 mt-0.5 block">
            {todayRecord ? `${todayRecord.totalWorkItems} Items` : '0 Items'}
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-2.5 rounded-xl shadow-2xs">
          <span className="text-[11px] text-slate-500 block font-semibold">Completed Today</span>
          <span className="text-base font-black text-[#087F3E] mt-0.5 block">
            {todayRecord ? `${todayRecord.completedCount} Done` : '0 Done'}
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-2.5 rounded-xl shadow-2xs">
          <span className="text-[11px] text-slate-500 block font-semibold">Active Issues</span>
          <span className="text-base font-black text-slate-900 mt-0.5 block">
            {todayRecord ? `${todayRecord.issueCount} Issues` : '0 Issues'}
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-2.5 rounded-xl shadow-2xs">
          <span className="text-[11px] text-slate-500 block font-semibold">Site Photos</span>
          <span className="text-base font-black text-slate-900 mt-0.5 block">
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
        <div className="py-8 text-center text-slate-500 text-xs">Loading daily site logs...</div>
      ) : history.length === 0 ? (
        <div className="bg-white border border-slate-200 p-6 rounded-xl text-center space-y-2 shadow-2xs">
          <span className="text-2xl">📝</span>
          <h3 className="text-xs font-extrabold text-slate-900">No Daily Reports Found</h3>
          <p className="text-[11px] text-slate-500">Click "Work Update" to record today's site work progress.</p>
        </div>
      ) : (
        <div className="space-y-2">
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
                className="group bg-white border border-slate-200 hover:border-[#087F3E] p-2.5 rounded-xl transition-all duration-200 block space-y-1.5 shadow-2xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[#087F3E] text-xs">📅</span>
                    <h3 className="text-xs font-extrabold text-slate-900 group-hover:text-[#087F3E] transition-colors truncate">
                      {formattedDate}
                    </h3>
                  </div>

                  <span className="text-[10px] text-[#087F3E] font-extrabold shrink-0 group-hover:translate-x-0.5 transition-transform">
                    Report →
                  </span>
                </div>

                <div className="flex flex-wrap gap-1 text-[10px]">
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800 font-bold">
                    📦 {rec.totalWorkItems} Items
                  </span>

                  <span className="px-1.5 py-0.5 rounded bg-[#EAF7EF] border border-[#bce6cb] text-[#056B34] font-bold">
                    ✓ {rec.completedCount} Done
                  </span>

                  {rec.inProgressCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 font-bold">
                      ⏳ {rec.inProgressCount} In Progress
                    </span>
                  )}

                  {rec.pendingCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-bold">
                      ⏸️ {rec.pendingCount} Pending
                    </span>
                  )}

                  {rec.issueCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-red-50 border border-red-200 text-red-700 font-bold">
                      ⚠️ {rec.issueCount} Issues
                    </span>
                  )}

                  {rec.photoCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 font-bold">
                      📷 {rec.photoCount} Photos
                    </span>
                  )}
                </div>

                {isFeatureEnabled('workers') && rec.workforceCount > 0 && (
                  <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-100 flex items-center gap-2">
                    <span>👷 Workforce: {rec.workforceCount} workers</span>
                    {rec.labourCost > 0 && <span>· Cost: ₹{rec.labourCost.toLocaleString('en-IN')}</span>}
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
