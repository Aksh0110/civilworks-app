'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useProject } from '@/lib/context/ProjectContext';

function DailyReportContent() {
  const { activeProject } = useProject();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date') || new Date().toISOString().slice(0, 10);

  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!activeProject?._id || !dateParam) return;
    loadReport();
  }, [activeProject?._id, dateParam]);

  const loadReport = () => {
    if (!activeProject?._id) return;
    setLoading(true);
    fetch(`/api/progress/report?projectId=${activeProject._id}&date=${dateParam}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.data) setReport(d.data);
        else setError(d.message || 'Daily progress report not found for date');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  const formattedDate = new Date(dateParam).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  if (loading) {
    return <div className="py-12 text-center text-stone-500 text-sm">Loading daily site report...</div>;
  }

  if (error || !report) {
    return (
      <div className="max-w-lg mx-auto py-8 text-center space-y-4">
        <div className="p-4 rounded-xl bg-amber-950/80 border border-amber-800 text-amber-200 text-sm">
          {error || 'Daily progress report not found for date'}
        </div>
        <div className="flex gap-3 justify-center">
          <Link href="/progress" className="px-4 py-2 bg-stone-800 text-stone-200 text-xs font-bold rounded-xl">
            ← History
          </Link>
          <Link href="/progress/update" className="px-4 py-2 bg-amber-500 text-stone-950 text-xs font-bold rounded-xl">
            + Create Today's Report
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 print:p-0 print:m-0">
      {/* Top Action Bar (Hidden when printing) */}
      <div className="flex items-center justify-between bg-stone-900 border border-stone-800 p-4 rounded-2xl print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/progress"
            className="w-9 h-9 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center text-sm transition-colors"
          >
            ←
          </Link>
          <div>
            <h1 className="text-lg font-bold text-stone-100 flex items-center gap-2">
              <span>📜</span> Daily Site Progress Report
            </h1>
            <p className="text-xs text-stone-400">Printable & Shareable Site Log</p>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-amber-400 border border-stone-700 text-xs font-bold rounded-xl transition-colors shadow flex items-center gap-1.5"
        >
          <span>🖨️</span> Print / Save PDF
        </button>
      </div>

      {/* Report Document Sheet */}
      <div className="bg-stone-900 border border-stone-800 p-6 sm:p-8 rounded-2xl space-y-6 shadow-2xl print:bg-white print:text-black print:border-none print:shadow-none">
        {/* Document Header */}
        <div className="border-b border-stone-800 print:border-gray-300 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-stone-100 print:text-black">{activeProject?.name}</h1>
            <p className="text-xs text-stone-400 print:text-gray-600 mt-0.5">Project Site Code: {activeProject?.code}</p>
          </div>

          <div className="sm:text-right">
            <span className="text-sm font-bold text-amber-400 print:text-gray-900 block">{formattedDate}</span>
            <span className="text-xs text-stone-400 print:text-gray-600 font-medium">Weather: {report.weather || 'Sunny / Clear'}</span>
          </div>
        </div>

        {/* Workforce Summary Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-3.5 bg-stone-950 print:bg-gray-100 border border-stone-800 print:border-gray-300 rounded-xl">
            <span className="text-[10px] text-stone-500 print:text-gray-600 uppercase font-semibold block">Workforce Present</span>
            <span className="text-lg font-extrabold text-emerald-400 print:text-emerald-700 mt-0.5 block">
              👷 {report.workforceCount || 0} Workers
            </span>
          </div>

          <div className="p-3.5 bg-stone-950 print:bg-gray-100 border border-stone-800 print:border-gray-300 rounded-xl">
            <span className="text-[10px] text-stone-500 print:text-gray-600 uppercase font-semibold block">Labour Cost</span>
            <span className="text-lg font-extrabold text-amber-400 print:text-amber-700 mt-0.5 block">
              ₹{(report.labourCost || 0).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-3.5 bg-stone-950 print:bg-gray-100 border border-stone-800 print:border-gray-300 rounded-xl col-span-2 sm:col-span-1">
            <span className="text-[10px] text-stone-500 print:text-gray-600 uppercase font-semibold block">Status Breakdown</span>
            <span className="text-xs font-bold text-stone-200 print:text-gray-800 mt-1 block">
              {report.completedWork?.length || 0} Done · {report.inProgressWork?.length || 0} In Progress
            </span>
          </div>
        </div>

        {/* Work Completed Section */}
        {report.completedWork && report.completedWork.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400 print:text-emerald-700 flex items-center gap-1.5">
              <span>✓</span> Work Completed Today ({report.completedWork.length})
            </h2>

            <div className="divide-y divide-stone-800 print:divide-gray-200 border border-stone-800 print:border-gray-300 rounded-xl overflow-hidden">
              {report.completedWork.map((item: any) => (
                <div key={item._id} className="p-3.5 bg-stone-950 print:bg-white flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-stone-100 print:text-black flex items-center gap-1.5">
                      <span>{item.workTypeIcon}</span> {item.workTypeName}
                      {item.location && <span className="text-stone-400 print:text-gray-600 font-normal">({item.location})</span>}
                    </span>
                    {item.remark && <p className="text-[11px] text-stone-400 print:text-gray-600 mt-0.5">{item.remark}</p>}
                  </div>

                  <span className="font-extrabold text-emerald-400 print:text-emerald-700 text-sm">
                    {item.quantity} {item.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Work In Progress Section */}
        {report.inProgressWork && report.inProgressWork.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400 print:text-amber-700 flex items-center gap-1.5">
              <span>⏳</span> Work In Progress ({report.inProgressWork.length})
            </h2>

            <div className="divide-y divide-stone-800 print:divide-gray-200 border border-stone-800 print:border-gray-300 rounded-xl overflow-hidden">
              {report.inProgressWork.map((item: any) => (
                <div key={item._id} className="p-3.5 bg-stone-950 print:bg-white flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-stone-100 print:text-black flex items-center gap-1.5">
                      <span>{item.workTypeIcon}</span> {item.workTypeName}
                      {item.location && <span className="text-stone-400 print:text-gray-600 font-normal">({item.location})</span>}
                    </span>
                    {item.remark && <p className="text-[11px] text-stone-400 print:text-gray-600 mt-0.5">{item.remark}</p>}
                  </div>

                  <span className="font-extrabold text-amber-400 print:text-amber-700 text-sm">
                    {item.quantity} {item.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Work Pending Section */}
        {report.pendingWork && report.pendingWork.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400 print:text-gray-600 flex items-center gap-1.5">
              <span>⏸️</span> Pending Work ({report.pendingWork.length})
            </h2>

            <div className="divide-y divide-stone-800 print:divide-gray-200 border border-stone-800 print:border-gray-300 rounded-xl overflow-hidden">
              {report.pendingWork.map((item: any) => (
                <div key={item._id} className="p-3.5 bg-stone-950 print:bg-white flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-stone-300 print:text-gray-800 flex items-center gap-1.5">
                      <span>{item.workTypeIcon}</span> {item.workTypeName}
                      {item.location && <span className="text-stone-400 print:text-gray-600 font-normal">({item.location})</span>}
                    </span>
                    {item.remark && <p className="text-[11px] text-stone-400 print:text-gray-600 mt-0.5">{item.remark}</p>}
                  </div>

                  <span className="font-bold text-stone-300 print:text-gray-800 text-sm">
                    {item.quantity} {item.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Site Issues Section */}
        {report.issues && report.issues.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-red-400 print:text-red-700 flex items-center gap-1.5">
              <span>⚠️</span> Site Issues & Delays ({report.issues.length})
            </h2>

            <div className="space-y-2">
              {report.issues.map((iss: any) => (
                <div key={iss._id} className="p-3.5 bg-red-950/40 print:bg-red-50 border border-red-800/60 print:border-red-200 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-red-300 print:text-red-800">{iss.issueType}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-900/80 print:bg-red-200 text-red-100 print:text-red-900">
                      Severity: {iss.severity}
                    </span>
                  </div>
                  <p className="text-stone-300 print:text-gray-700">{iss.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Site Photos Gallery */}
        {report.photos && report.photos.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400 print:text-gray-800 flex items-center gap-1.5">
              <span>📷</span> Site Progress Photos ({report.photos.length})
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {report.photos.map((ph: any, idx: number) => (
                <div key={ph._id || idx} className="bg-stone-950 border border-stone-800 rounded-xl overflow-hidden text-xs">
                  <div className="h-28 bg-stone-800 flex items-center justify-center text-stone-500 font-mono text-[10px] p-2 text-center break-all">
                    📷 {ph.url}
                  </div>
                  {ph.caption && <p className="p-2 text-stone-400 print:text-gray-700 text-[11px]">{ph.caption}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Signature */}
        <div className="pt-6 border-t border-stone-800 print:border-gray-300 flex justify-between text-[11px] text-stone-500 print:text-gray-600">
          <span>Prepared by: {report.createdBy || 'Site Supervisor'}</span>
          <span>Generated by CivilWorks Application</span>
        </div>
      </div>
    </div>
  );
}

export default function DailyReportPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-stone-500 text-sm">Loading daily site report...</div>}>
      <DailyReportContent />
    </Suspense>
  );
}
