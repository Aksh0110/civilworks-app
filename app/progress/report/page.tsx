'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useProject } from '@/lib/context/ProjectContext';

import { useRouter } from 'next/navigation';
import ConfirmModal from '@/components/ConfirmModal';

function DailyReportContent() {
  const { activeProject } = useProject();
  const searchParams = useSearchParams();
  const router = useRouter();
  const dateParam = searchParams.get('date') || new Date().toISOString().slice(0, 10);

  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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

  const handleDeleteReport = async () => {
    if (!activeProject?._id || !dateParam) return;
    const res = await fetch(`/api/progress?projectId=${activeProject._id}&date=${dateParam}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Failed to delete daily progress report');
    }
    router.push('/progress');
  };

  const formattedDate = new Date(dateParam).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  if (loading) {
    return <div className="py-12 text-center text-slate-500 text-sm">Loading daily site report...</div>;
  }

  if (error || !report) {
    return (
      <div className="max-w-lg mx-auto py-8 text-center space-y-4">
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
          {error || 'Daily progress report not found for date'}
        </div>
        <div className="flex gap-3 justify-center">
          <Link href="/progress" className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl">
            ← History
          </Link>
          <Link href="/progress/update" className="px-4 py-2 bg-[#087F3E] text-white text-xs font-bold rounded-xl shadow">
            + Create Today's Report
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 print:p-0 print:m-0">
      {/* Top Action Bar (Hidden when printing) */}
      <div className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-2xl print:hidden shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/progress"
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-sm transition-colors font-bold"
          >
            ←
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>📜</span> Daily Site Progress Report
            </h1>
            <p className="text-xs text-slate-500">Printable & Shareable Site Log</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/progress/update?date=${dateParam}`}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
          >
            ✏️ Edit Report
          </Link>

          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="px-3 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-bold rounded-xl transition-colors"
          >
            🗑️ Delete
          </button>

          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-[#087F3E] hover:bg-[#056B34] text-white text-xs font-bold rounded-xl transition-colors shadow flex items-center gap-1.5"
          >
            <span>🖨️</span> Print / Save PDF
          </button>
        </div>
      </div>

      {/* Report Document Sheet */}
      <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-2xl space-y-6 shadow-sm print:border-none print:shadow-none">
        {/* Document Header */}
        <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">{activeProject?.name}</h1>
            <p className="text-xs text-slate-500 mt-0.5">Project Site Code: {activeProject?.code}</p>
          </div>

          <div className="sm:text-right">
            <span className="text-sm font-bold text-[#087F3E] block">{formattedDate}</span>
            <span className="text-xs text-slate-500 font-semibold">Weather: {report.weather || 'Sunny / Clear'}</span>
          </div>
        </div>

        {/* Workforce Summary Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Workforce Present</span>
            <span className="text-lg font-black text-[#087F3E] mt-0.5 block">
              👷 {report.workforceCount || 0} Workers
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Labour Cost</span>
            <span className="text-lg font-black text-amber-700 mt-0.5 block">
              ₹{(report.labourCost || 0).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Status Breakdown</span>
            <span className="text-xs font-bold text-slate-800 mt-1 block">
              {report.completedWork?.length || 0} Done · {report.inProgressWork?.length || 0} In Progress
            </span>
          </div>
        </div>

        {/* Work Completed Section */}
        {report.completedWork && report.completedWork.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#087F3E] flex items-center gap-1.5">
              <span>✓</span> Work Completed Today ({report.completedWork.length})
            </h2>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {report.completedWork.map((item: any) => (
                <div key={item._id} className="p-3.5 bg-slate-50 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{item.workTypeIcon}</span> {item.workTypeName}
                      {item.location && <span className="text-slate-500 font-normal">({item.location})</span>}
                    </span>
                    {item.remark && <p className="text-[11px] text-slate-500 mt-0.5">{item.remark}</p>}
                  </div>

                  <span className="font-black text-[#087F3E] text-sm">
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
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
              <span>⏳</span> Work In Progress ({report.inProgressWork.length})
            </h2>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {report.inProgressWork.map((item: any) => (
                <div key={item._id} className="p-3.5 bg-slate-50 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{item.workTypeIcon}</span> {item.workTypeName}
                      {item.location && <span className="text-slate-500 font-normal">({item.location})</span>}
                    </span>
                    {item.remark && <p className="text-[11px] text-slate-500 mt-0.5">{item.remark}</p>}
                  </div>

                  <span className="font-black text-amber-700 text-sm">
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
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <span>⏸️</span> Pending Work ({report.pendingWork.length})
            </h2>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {report.pendingWork.map((item: any) => (
                <div key={item._id} className="p-3.5 bg-slate-50 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span>{item.workTypeIcon}</span> {item.workTypeName}
                      {item.location && <span className="text-slate-500 font-normal">({item.location})</span>}
                    </span>
                    {item.remark && <p className="text-[11px] text-slate-500 mt-0.5">{item.remark}</p>}
                  </div>

                  <span className="font-bold text-slate-800 text-sm">
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
            <h2 className="text-xs font-bold uppercase tracking-wider text-red-700 flex items-center gap-1.5">
              <span>⚠️</span> Site Issues & Delays ({report.issues.length})
            </h2>

            <div className="space-y-2">
              {report.issues.map((iss: any) => (
                <div key={iss._id} className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-red-800">{iss.issueType}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-200 text-red-900">
                      Severity: {iss.severity}
                    </span>
                  </div>
                  <p className="text-slate-700">{iss.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Site Photos Gallery */}
        {report.photos && report.photos.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <span>📷</span> Site Progress Photos ({report.photos.length})
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {report.photos.map((ph: any, idx: number) => (
                <div key={ph._id || idx} className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <div className="h-28 bg-slate-100 flex items-center justify-center text-slate-600 font-mono text-[10px] p-2 text-center break-all">
                    📷 {ph.url}
                  </div>
                  {ph.caption && <p className="p-2 text-slate-700 text-[11px]">{ph.caption}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Signature */}
        <div className="pt-6 border-t border-slate-200 flex justify-between text-[11px] text-slate-500">
          <span>Prepared by: {report.createdBy || 'Site Supervisor'}</span>
          <span>Generated by CivilWorks Application</span>
        </div>
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Daily Progress Report"
        message={`Are you sure you want to delete the daily progress report for ${dateParam}?`}
        itemName={`Daily Report for ${formattedDate}`}
        warningText="Daily progress log for this date will be permanently deleted."
        confirmText="Delete Report"
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteReport}
      />
    </div>
  );
}

export default function DailyReportPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-slate-500 text-sm">Loading daily site report...</div>}>
      <DailyReportContent />
    </Suspense>
  );
}
