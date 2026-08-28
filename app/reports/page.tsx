'use client';

import Link from 'next/link';
import { useProject } from '@/lib/context/ProjectContext';
import { useModules } from '@/lib/context/ModuleContext';
import ModuleGuard from '@/components/ModuleGuard';
import { IProjectModules } from '@/lib/models/Project';

interface ReportTypeItem {
  id: string;
  moduleKey?: keyof IProjectModules;
  title: string;
  desc: string;
  icon: string;
}

const reportTypes: ReportTypeItem[] = [
  { id: 'cost-summary', title: 'Project Cost Summary', desc: 'Management summary of labour, materials & site expenses', icon: '📊' },
  { id: 'attendance', moduleKey: 'attendance', title: 'Labour Attendance Register', desc: 'Daily attendance logs & worker status counts', icon: '👷' },
  { id: 'wage', moduleKey: 'attendance', title: 'Wage & Earnings Statement', desc: 'Gross wages earned, advances taken & net due', icon: '💰' },
  { id: 'material-stock', moduleKey: 'materials', title: 'Material Stock Level Report', desc: 'Current quantities, units & low stock alerts', icon: '📦' },
  { id: 'material-movement', moduleKey: 'materials', title: 'Material Inward & Issue Log', desc: 'Chronological inward deliveries & site issues', icon: '🚚' },
  { id: 'vendor-outstanding', moduleKey: 'vendors', title: 'Vendor Outstanding Statement', desc: 'Unpaid vendor bills & supplier balances', icon: '🏬' },
  { id: 'vendor-ledger', moduleKey: 'vendors', title: 'Vendor Transaction Ledger', desc: 'Chronological vendor bills & payment ledger', icon: '📒' },
  { id: 'expense', moduleKey: 'expenses', title: 'Expense Category Breakdown', desc: 'Operational site expenditure vouchers', icon: '💸' },
  { id: 'payment', moduleKey: 'payments', title: 'Payment & Advance Register', desc: 'Disbursed labour payments & vendor settlements', icon: '💳' },
  { id: 'progress', moduleKey: 'progress', title: 'Daily Progress Site Report', desc: 'Daily work completed, pending items & site photos', icon: '📋' }
];

export default function ReportsHubPage() {
  const { activeProject } = useProject();
  const { isModuleEnabled } = useModules();

  const visibleReports = reportTypes.filter((rep) => {
    if (!rep.moduleKey) return true;
    return isModuleEnabled(rep.moduleKey);
  });

  return (
    <ModuleGuard module="reports">
      <div className="space-y-6 pb-20 max-w-4xl mx-auto">
        {/* Header Banner */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📊</span>
            <h1 className="text-xl font-bold text-slate-900">Reports & Analytics Hub</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Structured operational reports and shareable statements for{' '}
            <span className="text-[#087F3E] font-semibold">{activeProject?.name || 'Selected Site'}</span>.
          </p>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {visibleReports.map((rep) => (
            <Link
              key={rep.id}
              href={`/reports/${rep.id}`}
              className="p-5 rounded-2xl bg-white hover:border-[#087F3E] border border-slate-200 transition-all shadow-sm flex items-start gap-4 group"
            >
              <div className="text-3xl p-3 bg-[#EAF7EF] rounded-xl border border-[#bce6cb] shrink-0 text-[#056B34]">
                {rep.icon}
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#087F3E] transition-colors">
                  {rep.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">{rep.desc}</p>
                <span className="inline-block text-[11px] text-[#087F3E] font-bold mt-2">
                  Open Report →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </ModuleGuard>
  );
}
