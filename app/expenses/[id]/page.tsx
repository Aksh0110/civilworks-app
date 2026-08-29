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
    return <div className="py-12 text-center text-slate-500 text-sm">Loading expense receipt detail...</div>;
  }

  if (error || !expense) {
    return (
      <div className="max-w-lg mx-auto py-8 text-center space-y-4">
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
          {error || 'Expense record not found'}
        </div>
        <Link href="/expenses" className="inline-block px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl">
          ← Back to Expenses
        </Link>
      </div>
    );
  }

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editAmount, setEditAmount] = useState('');
  const [editVendor, setEditVendor] = useState('');
  const [editRemark, setEditRemark] = useState('');
  const [editRef, setEditRef] = useState('');
  const [editMethod, setEditMethod] = useState('CASH');
  const [editLoading, setEditLoading] = useState(false);

  const openEditModal = () => {
    if (!expense) return;
    setEditAmount(String(expense.amount || ''));
    setEditVendor(expense.vendorPerson || '');
    setEditRemark(expense.remark || '');
    setEditRef(expense.referenceNumber || '');
    setEditMethod(expense.paymentMethod || 'CASH');
    setIsEditModalOpen(true);
  };

  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAmount || Number(editAmount) <= 0) return;
    setEditLoading(true);

    try {
      const res = await fetch(`/api/expenses/${expenseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: activeProject?._id,
          amount: Number(editAmount),
          vendorPerson: editVendor.trim(),
          remark: editRemark.trim(),
          referenceNumber: editRef.trim(),
          paymentMethod: editMethod
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update expense');

      setIsEditModalOpen(false);
      loadExpense();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-3 pb-20">
      {/* Top Header */}
      <div className="flex flex-row items-center justify-between gap-2 bg-white border border-slate-200 p-3 rounded-xl shadow-2xs">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg">🧾</span>
            <h1 className="text-base font-extrabold text-slate-900">Expense Receipt</h1>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Site: <span className="text-[#087F3E] font-bold">{activeProject?.name}</span>
          </p>
        </div>

        {expense?.status === 'ACTIVE' && (
          <div className="flex items-center gap-2">
            <button
              onClick={openEditModal}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
            >
              ✏️ Edit
            </button>

            <button
              onClick={() => setIsVoidModalOpen(true)}
              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-bold rounded-xl transition-colors"
            >
              Void Expense
            </button>
          </div>
        )}
      </div>

      {/* Receipt Card */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-5 shadow-sm">
        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Voucher Record</span>
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full border uppercase ${
              expense.status === 'ACTIVE'
                ? 'bg-[#EAF7EF] text-[#056B34] border-[#bce6cb]'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}
          >
            {expense.status}
          </span>
        </div>

        {/* Amount Hero */}
        <div className="text-center py-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
          <span className="text-xs text-slate-500 uppercase tracking-wider block font-bold">Total Amount</span>
          <span
            className={`text-3xl font-black ${
              expense.status === 'VOIDED' ? 'text-slate-400 line-through' : 'text-[#087F3E]'
            }`}
          >
            ₹{Number(expense.amount).toLocaleString('en-IN')}
          </span>
        </div>

        {/* Void Reason Banner */}
        {expense.status === 'VOIDED' && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 space-y-1 font-bold">
            <strong className="block">⚠️ Expense Record Voided</strong>
            <p>Reason: {expense.voidReason || 'No reason specified'}</p>
          </div>
        )}

        {/* Key Information Fields */}
        <div className="divide-y divide-slate-100 text-xs space-y-2 pt-2">
          <div className="flex justify-between py-2">
            <span className="text-slate-500">Category:</span>
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <span>{expense.categoryIcon}</span> {expense.categoryName}
            </span>
          </div>

          <div className="flex justify-between py-2">
            <span className="text-slate-500">Payment Method:</span>
            <span className="font-bold text-slate-900">{expense.paymentMethod.replace('_', ' ')}</span>
          </div>

          <div className="flex justify-between py-2">
            <span className="text-slate-500">Expense Date:</span>
            <span className="font-bold text-slate-900">
              {new Date(expense.expenseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>

          {expense.vendorPerson && (
            <div className="flex justify-between py-2">
              <span className="text-slate-500">Paid To / Vendor:</span>
              <span className="font-bold text-slate-900">{expense.vendorPerson}</span>
            </div>
          )}

          {expense.referenceNumber && (
            <div className="flex justify-between py-2">
              <span className="text-slate-500">Reference No.:</span>
              <span className="font-bold text-slate-900">{expense.referenceNumber}</span>
            </div>
          )}

          {expense.remark && (
            <div className="flex justify-between py-2">
              <span className="text-slate-500">Remark / Note:</span>
              <span className="font-bold text-slate-900">{expense.remark}</span>
            </div>
          )}

          <div className="flex justify-between py-2">
            <span className="text-slate-500">Created By:</span>
            <span className="font-bold text-slate-900">{expense.createdBy || 'Site Supervisor'}</span>
          </div>
        </div>
      </div>

      {/* Controlled Void Modal */}
      {isVoidModalOpen && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 pb-6 sm:pb-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 max-h-[85vh] overflow-y-auto shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Void Expense Record</h3>
              <button onClick={() => setIsVoidModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Voiding will exclude this ₹{expense.amount} expense from project reporting totals. Financial audit history will be preserved.
            </p>

            <form onSubmit={handleVoidExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Reason for Voiding *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Duplicate entry / Incorrect amount entered"
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsVoidModalOpen(false)}
                  className="flex-1 h-11 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={voidLoading}
                  className="flex-1 h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                >
                  {voidLoading ? 'Voiding...' : 'Confirm Void Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Controlled Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 pb-6 sm:pb-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 max-h-[85vh] overflow-y-auto shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Edit Expense Record</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateExpense} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 uppercase mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-[#087F3E]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 uppercase mb-1">Payment Method</label>
                <select
                  value={editMethod}
                  onChange={(e) => setEditMethod(e.target.value)}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#087F3E]"
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI_ONLINE">UPI / Online</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="ADVANCE">Advance</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-600 uppercase mb-1">Vendor / Payee Person</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Tool Store"
                  value={editVendor}
                  onChange={(e) => setEditVendor(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#087F3E]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 uppercase mb-1">Reference No.</label>
                <input
                  type="text"
                  placeholder="e.g. UPI-987234"
                  value={editRef}
                  onChange={(e) => setEditRef(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#087F3E]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 uppercase mb-1">Remark / Note</label>
                <input
                  type="text"
                  placeholder="e.g. Fuel for generator"
                  value={editRemark}
                  onChange={(e) => setEditRemark(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#087F3E]"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 h-11 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex-1 h-11 rounded-xl bg-[#087F3E] hover:bg-[#056B34] text-white font-extrabold shadow"
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
