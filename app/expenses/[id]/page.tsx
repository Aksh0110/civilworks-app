'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useProject } from '@/lib/context/ProjectContext';

export default function ExpenseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: expenseId } = use(params);
  const { activeProject } = useProject();

  const [expense, setExpense] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Void Modal State
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [voidLoading, setVoidLoading] = useState(false);

  useEffect(() => {
    if (!activeProject?._id || !expenseId) return;
    loadExpense();
  }, [activeProject?._id, expenseId]);

  const loadExpense = () => {
    if (!activeProject?._id) return;
    setLoading(true);
    fetch(`/api/expenses/${expenseId}?projectId=${activeProject._id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.data) setExpense(d.data);
        else setError(d.message || 'Expense record not found');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  const handleVoidExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voidReason.trim()) return;
    setVoidLoading(true);

    try {
      const res = await fetch(`/api/expenses/${expenseId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: activeProject?._id,
          reason: voidReason.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to void expense');

      setIsVoidModalOpen(false);
      setVoidReason('');
      loadExpense();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setVoidLoading(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-stone-500 text-sm">Loading expense receipt detail...</div>;
  }

  if (error || !expense) {
    return (
      <div className="max-w-lg mx-auto py-8 text-center space-y-4">
        <div className="p-4 rounded-xl bg-amber-950/80 border border-amber-800 text-amber-200 text-sm">
          {error || 'Expense record not found'}
        </div>
        <Link href="/expenses" className="inline-block px-4 py-2 bg-stone-800 text-stone-200 text-xs font-bold rounded-xl">
          ← Back to Expenses
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-stone-900 border border-stone-800 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <Link
            href="/expenses"
            className="w-9 h-9 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center text-sm transition-colors"
          >
            ←
          </Link>
          <div>
            <h1 className="text-lg font-bold text-stone-100 flex items-center gap-2">
              <span>🧾</span> Expense Receipt
            </h1>
            <p className="text-xs text-stone-400">
              Site: <span className="text-amber-400 font-semibold">{activeProject?.name}</span>
            </p>
          </div>
        </div>

        {expense.status === 'ACTIVE' && (
          <button
            onClick={() => setIsVoidModalOpen(true)}
            className="px-3 py-1.5 bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 text-xs font-bold rounded-xl transition-colors"
          >
            Void Expense
          </button>
        )}
      </div>

      {/* Receipt Card */}
      <div className="bg-stone-900 border border-stone-800 p-6 rounded-2xl space-y-5 shadow-xl">
        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Voucher Record</span>
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full border ${
              expense.status === 'ACTIVE'
                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                : 'bg-red-950 text-red-300 border-red-800'
            }`}
          >
            {expense.status}
          </span>
        </div>

        {/* Amount Hero */}
        <div className="text-center py-4 bg-stone-950 border border-stone-800 rounded-xl space-y-1">
          <span className="text-xs text-stone-500 uppercase tracking-wider block font-semibold">Total Amount</span>
          <span
            className={`text-3xl font-extrabold ${
              expense.status === 'VOIDED' ? 'text-stone-600 line-through' : 'text-amber-400'
            }`}
          >
            ₹{Number(expense.amount).toLocaleString('en-IN')}
          </span>
        </div>

        {/* Void Reason Banner */}
        {expense.status === 'VOIDED' && (
          <div className="p-3.5 bg-red-950/80 border border-red-800/80 rounded-xl text-xs text-red-200 space-y-1">
            <strong className="block font-bold">⚠️ Expense Record Voided</strong>
            <p>Reason: {expense.voidReason || 'No reason specified'}</p>
          </div>
        )}

        {/* Key Information Fields */}
        <div className="divide-y divide-stone-800/80 text-xs space-y-2 pt-2">
          <div className="flex justify-between py-2">
            <span className="text-stone-400">Category:</span>
            <span className="font-bold text-stone-100 flex items-center gap-1.5">
              <span>{expense.categoryIcon}</span> {expense.categoryName}
            </span>
          </div>

          <div className="flex justify-between py-2">
            <span className="text-stone-400">Payment Method:</span>
            <span className="font-bold text-stone-100">{expense.paymentMethod.replace('_', ' ')}</span>
          </div>

          <div className="flex justify-between py-2">
            <span className="text-stone-400">Expense Date:</span>
            <span className="font-bold text-stone-100">
              {new Date(expense.expenseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>

          {expense.vendorPerson && (
            <div className="flex justify-between py-2">
              <span className="text-stone-400">Paid To / Vendor:</span>
              <span className="font-bold text-stone-100">{expense.vendorPerson}</span>
            </div>
          )}

          {expense.referenceNumber && (
            <div className="flex justify-between py-2">
              <span className="text-stone-400">Reference No.:</span>
              <span className="font-bold text-stone-100">{expense.referenceNumber}</span>
            </div>
          )}

          {expense.remark && (
            <div className="flex justify-between py-2">
              <span className="text-stone-400">Remark / Note:</span>
              <span className="font-bold text-stone-100">{expense.remark}</span>
            </div>
          )}

          <div className="flex justify-between py-2">
            <span className="text-stone-400">Created By:</span>
            <span className="font-bold text-stone-100">{expense.createdBy || 'Site Supervisor'}</span>
          </div>
        </div>
      </div>

      {/* Controlled Void Modal */}
      {isVoidModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h3 className="text-base font-bold text-stone-100">Void Expense Record</h3>
              <button onClick={() => setIsVoidModalOpen(false)} className="text-stone-400 hover:text-stone-200">
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-400">
              Voiding will exclude this ₹{expense.amount} expense from project reporting totals. Financial audit history will be preserved.
            </p>

            <form onSubmit={handleVoidExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-400 uppercase mb-1">
                  Reason for Voiding *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Duplicate entry / Incorrect amount entered"
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  className="w-full h-11 px-3 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsVoidModalOpen(false)}
                  className="flex-1 h-11 rounded-xl border border-stone-800 text-stone-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={voidLoading}
                  className="flex-1 h-11 rounded-xl bg-red-600 hover:bg-red-500 text-stone-100 text-xs font-bold"
                >
                  {voidLoading ? 'Voiding...' : 'Confirm Void Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
