'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useProject } from '@/lib/context/ProjectContext';

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
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-900 border border-stone-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">💸</span>
            <h1 className="text-xl font-bold text-stone-100">Site Expense Management</h1>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Track operational site costs for{' '}
            <span className="text-amber-400 font-semibold">{activeProject?.name || 'Selected Site'}</span>.
          </p>
        </div>

        <Link
          href="/expenses/add"
          className="px-5 h-12 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2 shrink-0"
        >
          <span>+</span> Add Expense
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl">
          <span className="text-xs text-stone-400 block font-medium">Today</span>
          <span className="text-lg font-bold text-amber-400 mt-1 block">
            ₹{(summary?.todayTotal || 0).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl">
          <span className="text-xs text-stone-400 block font-medium">This Week</span>
          <span className="text-lg font-bold text-stone-100 mt-1 block">
            ₹{(summary?.weekTotal || 0).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl">
          <span className="text-xs text-stone-400 block font-medium">This Month</span>
          <span className="text-lg font-bold text-stone-100 mt-1 block">
            ₹{(summary?.monthTotal || 0).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl">
          <span className="text-xs text-stone-400 block font-medium">Total Project</span>
          <span className="text-lg font-bold text-emerald-400 mt-1 block">
            ₹{(summary?.projectTotal || 0).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Category & Payment Summaries */}
      {summary && summary.categorySummary.length > 0 && (
        <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400">Expense Breakdown by Category</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {summary.categorySummary.slice(0, 6).map((cat) => (
              <div key={cat.categoryName} className="p-3 bg-stone-950 border border-stone-800/80 rounded-xl space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-stone-200 flex items-center gap-1.5">
                    <span>{cat.categoryIcon}</span> {cat.categoryName}
                  </span>
                  <span className="text-stone-400 font-semibold">{cat.percentage}%</span>
                </div>
                <div className="text-sm font-extrabold text-amber-400">
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
            className="flex-1 h-11 px-4 bg-stone-900 border border-stone-800 rounded-xl text-stone-100 text-sm placeholder-stone-600 focus:outline-none focus:border-amber-500"
          />

          <div className="flex gap-2">
            {(['today', 'week', 'month', 'all'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-2 rounded-xl text-xs font-bold capitalize transition-colors ${
                  timeframe === t
                    ? 'bg-amber-500 text-stone-950'
                    : 'bg-stone-900 text-stone-400 border border-stone-800 hover:text-stone-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Anti-Duplicate Notice Banner */}
      <div className="p-3.5 bg-stone-900/60 border border-stone-800 rounded-xl text-xs text-stone-400 flex items-center gap-2">
        <span className="text-amber-400 font-bold">ℹ️ Tip:</span>
        <span>Material deliveries recorded in <strong>Material Inward</strong> are tracked separately and should not be re-entered here.</span>
      </div>

      {/* Expenses History List */}
      {loading ? (
        <div className="py-12 text-center text-stone-500 text-sm">Loading site expense history...</div>
      ) : filteredExpenses.length === 0 ? (
        <div className="bg-stone-900 border border-stone-800 p-8 rounded-2xl text-center space-y-3">
          <span className="text-3xl">💸</span>
          <h3 className="text-base font-bold text-stone-200">No Expenses Found</h3>
          <p className="text-xs text-stone-500">
            {search ? 'Try clearing your search query.' : 'Click "+ Add Expense" to record a new site expense.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredExpenses.map((item) => (
            <Link
              key={item._id}
              href={`/expenses/${item._id}`}
              className="group bg-stone-900 border border-stone-800 hover:border-amber-500/50 p-4 rounded-xl transition-all duration-200 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center text-lg shrink-0">
                  {item.categoryIcon}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-stone-100 group-hover:text-amber-400 transition-colors">
                      {item.categoryName}
                    </h3>
                    {item.status === 'VOIDED' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
                        VOIDED
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-stone-400">
                    {item.vendorPerson ? `${item.vendorPerson} · ` : ''}
                    {new Date(item.expenseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} ·{' '}
                    <span className="text-stone-300 font-semibold">{item.paymentMethod.replace('_', ' ')}</span>
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span
                  className={`text-base font-extrabold ${
                    item.status === 'VOIDED' ? 'text-stone-600 line-through' : 'text-amber-400'
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
  );
}
