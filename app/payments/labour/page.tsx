'use client';

import { useState, useEffect, useId } from 'react';
import Link from 'next/link';
import { useProject } from '@/lib/context/ProjectContext';
import { WorkerWageDueItem } from '@/lib/services/paymentService';

export default function PayLabourPage() {
  const { activeProject } = useProject();
  const idempotencyId = useId();

  const [workers, setWorkers] = useState<WorkerWageDueItem[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<WorkerWageDueItem | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [dueOnly, setDueOnly] = useState(true);
  const [loading, setLoading] = useState(true);

  // Payment Form state
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'ONLINE' | 'BANK_TRANSFER' | 'OTHER'>('CASH');
  const [notes, setNotes] = useState('');

  // Confirmation & Success modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successResult, setSuccessResult] = useState<any>(null);

  useEffect(() => {
    if (!activeProject?._id) return;
    loadWorkers();
  }, [activeProject?._id]);

  const loadWorkers = () => {
    if (!activeProject?._id) return;
    setLoading(true);

    fetch(`/api/payments/labour/due?projectId=${activeProject._id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.data) setWorkers(d.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const categories = Array.from(new Set(workers.map((w) => w.category)));

  const filteredWorkers = workers.filter((w) => {
    if (dueOnly && w.amountDue <= 0) return false;
    if (categoryFilter !== 'ALL' && w.category !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        w.name.toLowerCase().includes(q) ||
        w.category.toLowerCase().includes(q) ||
        (w.workerIdCode && w.workerIdCode.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleSelectWorker = (w: WorkerWageDueItem) => {
    setSelectedWorker(w);
    setPaymentAmount(w.amountDue > 0 ? String(w.amountDue) : '');
    setError('');
  };

  const handleConfirmPay = async () => {
    if (!selectedWorker || !activeProject?._id) return;

    const numAmount = parseFloat(paymentAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid positive payment amount.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: activeProject._id,
          workerId: selectedWorker.workerId,
          paymentType: 'LABOUR_PAYMENT',
          amount: numAmount,
          paymentMethod,
          notes: notes.trim() || undefined,
          idempotencyKey: `labour-pay-${selectedWorker.workerId}-${idempotencyId}-${Date.now()}`,
          user: 'Site Supervisor'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit payment.');
      }

      setShowConfirmModal(false);
      setSuccessResult(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Render Success Screen
  if (successResult) {
    return (
      <div className="max-w-lg mx-auto py-6 space-y-6">
        <div className="bg-[#EAF7EF] border border-[#bce6cb] p-6 rounded-2xl text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-[#087F3E] text-white rounded-full flex items-center justify-center text-3xl mx-auto font-black shadow">
            ✓
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-[#056B34]">Payment Successful ✓</h2>
            <p className="text-xs text-slate-600 mt-1">Receipt ID: {successResult.receiptId}</p>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-2 text-left text-xs shadow-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Paid To:</span>
              <span className="font-bold text-slate-900">{selectedWorker?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Amount Paid:</span>
              <span className="font-extrabold text-[#087F3E] text-sm">
                ₹{successResult.amount.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Payment Mode:</span>
              <span className="font-semibold text-slate-900">{successResult.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date:</span>
              <span className="text-slate-700">
                {new Date(successResult.paymentDate).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href={`/payments/receipt/${successResult._id}`}
              className="flex-1 py-3 bg-[#087F3E] hover:bg-[#056B34] text-white font-extrabold text-xs rounded-xl transition-colors text-center shadow"
            >
              View Receipt
            </Link>
            <Link
              href="/payments"
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors text-center"
            >
              Done
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-20 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-row items-center justify-between gap-2 bg-white border border-slate-200 p-3 rounded-xl shadow-2xs">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-lg">👷</span>
            <h1 className="text-base font-extrabold text-slate-900">Pay Labour Wage</h1>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Pay workers for <span className="text-[#087F3E] font-semibold">{activeProject?.name || 'Selected Site'}</span>.
          </p>
        </div>
      </div>

      {!selectedWorker ? (
        /* STEP 1: WORKER SELECTION */
        <div className="bg-white border border-slate-200 p-3 rounded-xl space-y-2.5 shadow-2xs">
          <div className="flex flex-row items-center justify-between gap-2">
            <h2 className="text-xs font-extrabold text-slate-900">Select Worker to Pay</h2>

            <div className="flex items-center gap-1.5">
              <label className="flex items-center gap-1.5 text-[11px] text-slate-700 cursor-pointer bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                <input
                  type="checkbox"
                  checked={dueOnly}
                  onChange={(e) => setDueOnly(e.target.checked)}
                  className="rounded border-slate-300 text-[#087F3E] focus:ring-0"
                />
                <span>Due Only ({workers.filter((w) => w.amountDue > 0).length})</span>
              </label>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Search worker by name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#087F3E]"
            />

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#087F3E]"
            >
              <option value="ALL">All Categories ({categories.length})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Worker Cards List */}
          {loading ? (
            <div className="text-center py-6 text-xs text-slate-500">Loading worker wage details...</div>
          ) : filteredWorkers.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500">No workers match your filter.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredWorkers.map((w) => (
                <button
                  key={w.workerId}
                  onClick={() => handleSelectWorker(w)}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-[#EAF7EF] border border-slate-200 text-left transition-all flex items-center justify-between gap-2 group shadow-2xs"
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="font-extrabold text-xs text-slate-900 group-hover:text-[#087F3E] transition-colors truncate">
                      {w.name}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {w.category} • ₹{w.dailyRate}/day
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      Worked: {w.workedDays} days ({w.presentDays}P / {w.halfDays}HD)
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-[9px] text-slate-500 font-semibold">Due</div>
                    <div
                      className={`text-xs font-black ${
                        w.amountDue > 0 ? 'text-amber-600' : 'text-[#087F3E]'
                      }`}
                    >
                      ₹{w.amountDue.toLocaleString('en-IN')}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* STEP 2: WAGE SUMMARY & PAYMENT ENTRY */
        <div className="space-y-3">
          {/* Worker Selected Header */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-sm">
            <div>
              <span className="text-xs text-[#087F3E] font-bold uppercase tracking-wider block">Selected Worker</span>
              <h2 className="text-xl font-extrabold text-slate-900">{selectedWorker.name}</h2>
              <p className="text-xs text-slate-500">
                {selectedWorker.category} • Rate: ₹{selectedWorker.dailyRate}/day
              </p>
            </div>
            <button
              onClick={() => setSelectedWorker(null)}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
            >
              Change Worker
            </button>
          </div>

          {/* Wage Breakdown Summary Card */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#087F3E]">Automatic Wage Calculation</h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-500 block">Worked Days</span>
                <span className="text-sm font-bold text-slate-900 mt-1 block">
                  {selectedWorker.workedDays} Days
                </span>
                <span className="text-[10px] text-slate-500">
                  {selectedWorker.presentDays} Present, {selectedWorker.halfDays} Half Day
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-500 block">Gross Wage</span>
                <span className="text-sm font-bold text-slate-900 mt-1 block">
                  ₹{selectedWorker.grossWage.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-500 block">Advances Taken</span>
                <span className="text-sm font-bold text-amber-600 mt-1 block">
                  ₹{selectedWorker.advances.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-500 block">Previous Paid</span>
                <span className="text-sm font-bold text-[#087F3E] mt-1 block">
                  ₹{selectedWorker.previousPaid.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Current Amount Due Box */}
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-800">Net Current Amount Due</span>
                <div className="text-2xl font-black text-amber-800">
                  ₹{selectedWorker.amountDue.toLocaleString('en-IN')}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPaymentAmount(String(selectedWorker.amountDue))}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white font-extrabold text-xs rounded-xl shadow transition-colors"
              >
                Use Amount Due
              </button>
            </div>
          </div>

          {/* Payment Form Entry */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#087F3E]">Enter Payment Details</h3>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-bold">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payment Amount (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Enter amount to pay..."
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-bold text-[#087F3E] focus:outline-none focus:border-[#087F3E]"
                />
                {parseFloat(paymentAmount) < selectedWorker.amountDue && parseFloat(paymentAmount) > 0 && (
                  <p className="text-[11px] text-amber-700 mt-1 font-semibold">
                    Partial Payment: Remaining due will be ₹
                    {(selectedWorker.amountDue - parseFloat(paymentAmount)).toLocaleString('en-IN')}.
                  </p>
                )}
              </div>

              {/* Payment Method Chips */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Payment Method</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      { id: 'CASH', label: '💵 Cash' },
                      { id: 'ONLINE', label: '📱 UPI / Online' },
                      { id: 'BANK_TRANSFER', label: '🏦 Bank Transfer' },
                      { id: 'OTHER', label: '📝 Other' }
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                        paymentMethod === m.id
                          ? 'bg-[#087F3E] text-white border-[#087F3E] shadow'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Remark (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Weekly settlement, Part payment for Mason work"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#087F3E]"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  const amt = parseFloat(paymentAmount);
                  if (isNaN(amt) || amt <= 0) {
                    setError('Please enter a valid positive payment amount.');
                    return;
                  }
                  setError('');
                  setShowConfirmModal(true);
                }}
                className="w-full py-4 bg-[#087F3E] hover:bg-[#056B34] text-white text-base font-extrabold rounded-xl transition-all shadow text-center"
              >
                Review & Confirm Payment →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compact Review Confirmation Modal */}
      {showConfirmModal && selectedWorker && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 pb-6 sm:pb-4">
          <div className="bg-white border border-slate-200 w-full max-w-md p-6 max-h-[85vh] overflow-y-auto rounded-2xl space-y-5 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-3">
              Confirm Payment
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Recipient Worker:</span>
                <span className="font-bold text-slate-900">{selectedWorker.name}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Payment Amount:</span>
                <span className="font-black text-[#087F3E] text-sm">
                  ₹{parseFloat(paymentAmount).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Payment Method:</span>
                <span className="font-semibold text-slate-900">{paymentMethod}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Project Site:</span>
                <span className="text-slate-900 font-semibold">{activeProject?.name}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmPay}
                className="px-6 py-2.5 bg-[#087F3E] hover:bg-[#056B34] text-white text-xs font-extrabold rounded-xl transition-all disabled:opacity-50 shadow"
              >
                {submitting ? 'Processing Payment...' : 'Confirm & Pay ✓'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
