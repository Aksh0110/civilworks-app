'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useProject } from '@/lib/context/ProjectContext';

export default function DynamicReportPage() {
  const params = useParams();
  const type = params?.type as string;
  const { activeProject } = useProject();

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [category, setCategory] = useState('ALL');

  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeProject?._id) return;
    loadReport();
  }, [type, activeProject?._id]);

  const loadReport = () => {
    if (!activeProject?._id) return;
    setLoading(true);

    const query = new URLSearchParams();
    query.set('type', type);
    query.set('projectId', activeProject._id);
    if (fromDate) query.set('fromDate', fromDate);
    if (toDate) query.set('toDate', toDate);
    if (category !== 'ALL') query.set('category', category);

    fetch(`/api/reports?${query.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.data) setReportData(d.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print();
  };

  const handleDownloadCSV = () => {
    if (!reportData?.records) return;

    const keys = Object.keys(reportData.records[0] || {});
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [keys.join(','), ...reportData.records.map((r: any) => keys.map((k) => `"${r[k] || ''}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `civilworks-${type}-report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getReportTitle = () => {
    switch (type) {
      case 'attendance': return 'Labour Attendance Register';
      case 'wage': return 'Wage & Earnings Statement';
      case 'material-stock': return 'Material Stock Level Report';
      case 'material-movement': return 'Material Movement Register';
      case 'vendor-outstanding': return 'Vendor Outstanding Statement';
      case 'vendor-ledger': return 'Vendor Ledger Report';
      case 'expense': return 'Expense Category Breakdown';
      case 'payment': return 'Payment & Advance Register';
      case 'progress': return 'Daily Work Progress Site Report';
      case 'cost-summary': default: return 'Project Cost Summary';
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      {/* Header Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm print:bg-white print:border-none print:p-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl print:hidden">📊</span>
            <h1 className="text-xl font-bold text-slate-900 print:text-black">{getReportTitle()}</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 print:text-gray-600">
            Site: <span className="text-[#087F3E] font-semibold print:text-black">{activeProject?.name || 'Selected Site'}</span> • Generated: {new Date().toLocaleDateString('en-IN')}
          </p>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
          >
            <span>🖨️</span> Print / PDF
          </button>
          {reportData?.records && (
            <button
              onClick={handleDownloadCSV}
              className="px-3.5 py-2 bg-[#087F3E] hover:bg-[#056B34] text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow"
            >
              <span>📥</span> Export CSV
            </button>
          )}
          <Link
            href="/reports"
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
          >
            ← Back
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-3 shadow-sm print:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={loadReport}
              className="flex-1 py-2 bg-[#087F3E] hover:bg-[#056B34] text-white text-xs font-bold rounded-xl shadow"
            >
              Apply Filter
            </button>
            <button
              onClick={() => {
                setFromDate('');
                setToDate('');
                setCategory('ALL');
                loadReport();
              }}
              className="px-3 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Report Data Display */}
      {loading ? (
        <div className="text-center py-12 text-xs text-slate-500">Generating report...</div>
      ) : !reportData ? (
        <div className="text-center py-12 text-xs text-slate-500">No data found for selected period.</div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          {reportData.summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(reportData.summary).map(([k, v]: [string, any]) => {
                if (typeof v === 'object') return null; // Skip nested objects for cards
                return (
                  <div key={k} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm print:bg-gray-100 print:border-gray-300">
                    <span className="text-slate-500 text-[11px] block font-semibold capitalize print:text-gray-700">
                      {k.replace(/([A-Z])/g, ' $1')}
                    </span>
                    <span className="text-xl font-black text-[#087F3E] mt-1 block print:text-black">
                      {typeof v === 'number' && (k.toLowerCase().includes('cost') || k.toLowerCase().includes('wage') || k.toLowerCase().includes('amount') || k.toLowerCase().includes('due') || k.toLowerCase().includes('outflow'))
                        ? `₹${v.toLocaleString('en-IN')}`
                        : v}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Project Cost Summary Explanatory Note */}
          {type === 'cost-summary' && reportData.note && (
            <div className="p-4 bg-white border border-slate-200 rounded-2xl text-xs text-slate-700 space-y-2 shadow-sm print:bg-gray-50">
              <div className="font-bold text-[#087F3E]">💡 Cost Model Note:</div>
              <p className="text-slate-600 print:text-black">{reportData.note}</p>
            </div>
          )}

          {/* Data Table / Cards List */}
          {reportData.records && reportData.records.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm print:border-gray-300 print:bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-800 print:text-black">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase text-[10px] print:bg-gray-200 print:text-black">
                    <tr>
                      {Object.keys(reportData.records[0]).map((k) => (
                        <th key={k} className="px-4 py-3 font-bold">
                          {k.replace(/([A-Z])/g, ' $1')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 print:divide-gray-300">
                    {reportData.records.map((r: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        {Object.entries(r).map(([k, val]: [string, any], cIdx: number) => (
                          <td key={cIdx} className="px-4 py-3">
                            {typeof val === 'number' && (k.toLowerCase().includes('amount') || k.toLowerCase().includes('wage') || k.toLowerCase().includes('due') || k.toLowerCase().includes('outstanding'))
                              ? `₹${val.toLocaleString('en-IN')}`
                              : val instanceof Date
                              ? new Date(val).toLocaleDateString('en-IN')
                              : String(val || '-')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
