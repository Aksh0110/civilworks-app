'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useProject } from '@/lib/context/ProjectContext';

import ModuleGuard from '@/components/ModuleGuard';

interface ExpenseItem {
  _id: string;
  categoryName: string;
  categoryIcon: string;
  amount: number;
  paymentMethod: string;
  expenseDate: string;
  vendorPerson?: string;
  remark?: string;
  status: 'ACTIVE' | 'VOIDED';
}

interface SummaryData {
  todayTotal: number;
  weekTotal: number;
  monthTotal: number;
  projectTotal: number;
  categorySummary: Array<{ categoryName: string; categoryIcon: string; totalAmount: number; percentage: number }>;
  paymentMethodSummary: Array<{ id: string; label: string; icon: string; totalAmount: number; percentage: number }>;
}

export default function ExpensesHubPage() {
  const { activeProject } = useProject();
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeProject?._id) return;
    loadData();
  }, [activeProject?._id, timeframe]);

  const loadData = () => {
    if (!activeProject?._id) return;
    setLoading(true);

    Promise.all([
      fetch(`/api/expenses/summary?projectId=${activeProject._id}`).then((r) => r.json()),
      fetch(`/api/expenses?projectId=${activeProject._id}&timeframe=${timeframe}`).then((r) => r.json())
    ])
      .then(([sumRes, expRes]) => {
        if (sumRes.data) setSummary(sumRes.data);
        if (expRes.data) setExpenses(expRes.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const filteredExpenses = expenses.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.categoryName.toLowerCase().includes(q) ||
      (item.vendorPerson && item.vendorPerson.toLowerCase().includes(q)) ||
      (item.remark && item.remark.toLowerCase().includes(q))
    );
  });

  return (
    <ModuleGuard module="expenses">
      <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">💸</span>
            <h1 className="text-xl font-bold text-slate-900">Site Expense Management</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track operational site costs for{' '}
            <span className="text-[#087F3E] font-semibold">{activeProject?.name || 'Selected Site'}</span>.
          </p>
        </div>

        <Link
          href="/expenses/add"
          className="px-5 h-12 bg-[#087F3E] hover:bg-[#056B34] text-white text-xs font-bold rounded-xl transition-colors shadow flex items-center justify-center gap-2 shrink-0"
        >
          <span>+</span> Add Expense
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <span className="text-xs text-slate-500 block font-semibold">Today</span>
          <span className="text-lg font-black text-amber-600 mt-1 block">
            ₹{(summary?.todayTotal || 0).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <span className="text-xs text-slate-500 block font-semibold">This Week</span>
          <span className="text-lg font-black text-slate-900 mt-1 block">
            ₹{(summary?.weekTotal || 0).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <span className="text-xs text-slate-500 block font-semibold">This Month</span>
          <span className="text-lg font-black text-slate-900 mt-1 block">
            ₹{(summary?.monthTotal || 0).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <span className="text-xs text-slate-500 block font-semibold">Total Project</span>
          <span className="text-lg font-black text-[#087F3E] mt-1 block">
            ₹{(summary?.projectTotal || 0).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Category & Payment Summaries */}
      {summary && summary.categorySummary.length > 0 && (
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#087F3E]">Expense Breakdown by Category</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {summary.categorySummary.slice(0, 6).map((cat) => (
              <div key={cat.categoryName} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span>{cat.categoryIcon}</span> {cat.categoryName}
                  </span>
                  <span className="text-slate-500 font-semibold">{cat.percentage}%</span>
                </div>
                <div className="text-sm font-extrabold text-[#087F3E]">
                  ₹{cat.totalAmount.toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Timeframe Filter Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search vendor, remark, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 h-11 px-4 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-[#087F3E]"
          />

          <div className="flex gap-2">
            {(['today', 'week', 'month', 'all'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-2 rounded-xl text-xs font-bold capitalize transition-colors ${
                  timeframe === t
                    ? 'bg-[#087F3E] text-white shadow'
                    : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Anti-Duplicate Notice Banner */}
      <div className="p-3.5 bg-[#EAF7EF] border border-[#bce6cb] rounded-xl text-xs text-[#056B34] flex items-center gap-2">
        <span className="font-bold">ℹ️ Tip:</span>
        <span>Material deliveries recorded in <strong>Material Inward</strong> are tracked separately and should not be re-entered here.</span>
      </div>

      {/* Expenses History List */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 text-sm">Loading site expense history...</div>
      ) : filteredExpenses.length === 0 ? (
        <div className="bg-white border border-slate-200 p-8 rounded-2xl text-center space-y-3 shadow-sm">
          <span className="text-3xl">💸</span>
          <h3 className="text-base font-bold text-slate-900">No Expenses Found</h3>
          <p className="text-xs text-slate-500">
            {search ? 'Try clearing your search query.' : 'Click "+ Add Expense" to record a new site expense.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredExpenses.map((item) => (
            <Link
              key={item._id}
              href={`/expenses/${item._id}`}
              className="group bg-white border border-slate-200 hover:border-[#087F3E] p-4 rounded-xl transition-all duration-200 flex items-center justify-between gap-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EAF7EF] text-[#056B34] border border-[#bce6cb] flex items-center justify-center text-lg shrink-0">
                  {item.categoryIcon}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#087F3E] transition-colors">
                      {item.categoryName}
                    </h3>
                    {item.status === 'VOIDED' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700 border border-red-200">
                        VOIDED
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500">
                    {item.vendorPerson ? `${item.vendorPerson} · ` : ''}
                    {new Date(item.expenseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} ·{' '}
                    <span className="text-slate-700 font-semibold">{item.paymentMethod.replace('_', ' ')}</span>
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span
                  className={`text-base font-black ${
                    item.status === 'VOIDED' ? 'text-slate-400 line-through' : 'text-slate-900'
                  }`}
                >
                  ₹{item.amount.toLocaleString('en-IN')}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
    </ModuleGuard>
  );
}
