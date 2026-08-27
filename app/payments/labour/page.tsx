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
        <div className="bg-emerald-950/80 border border-emerald-800/80 p-6 rounded-2xl text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center text-3xl mx-auto">
            ✓
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-emerald-100">Payment Successful ✓</h2>
            <p className="text-xs text-emerald-300/80 mt-1">Receipt ID: {successResult.receiptId}</p>
          </div>

          <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl space-y-2 text-left text-xs">
            <div className="flex justify-between">
              <span className="text-stone-400">Paid To:</span>
              <span className="font-bold text-stone-100">{selectedWorker?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Amount Paid:</span>
              <span className="font-bold text-emerald-400 text-sm">
                ₹{successResult.amount.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Payment Mode:</span>
              <span className="font-semibold text-stone-200">{successResult.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Date:</span>
              <span className="text-stone-300">
                {new Date(successResult.paymentDate).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href={`/payments/receipt/${successResult._id}`}
              className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-extrabold text-xs rounded-xl transition-colors text-center"
            >
              View Receipt
            </Link>
            <Link
              href="/payments"
              className="flex-1 py-3 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs rounded-xl transition-colors text-center"
            >
              Done
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-900 border border-stone-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">👷</span>
            <h1 className="text-xl font-bold text-stone-100">Pay Labour Wage</h1>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Calculate worked days, review amount due, and pay workers for{' '}
            <span className="text-amber-400 font-semibold">{activeProject?.name || 'Selected Site'}</span>.
          </p>
        </div>

        <Link
          href="/payments"
          className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold rounded-xl self-start sm:self-auto"
        >
          ← Back to Payments
        </Link>
      </div>

      {!selectedWorker ? (
        /* STEP 1: WORKER SELECTION */
        <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-bold text-stone-100">Select Worker to Pay</h2>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-xs text-stone-300 cursor-pointer bg-stone-950 px-3 py-1.5 rounded-xl border border-stone-800">
                <input
                  type="checkbox"
                  checked={dueOnly}
                  onChange={(e) => setDueOnly(e.target.checked)}
                  className="rounded border-stone-700 text-amber-500 focus:ring-0"
                />
                <span>Show Due Only ({workers.filter((w) => w.amountDue > 0).length})</span>
              </label>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Search worker by name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-stone-950 border border-stone-800 rounded-xl px-4 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
            />

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-stone-950 border border-stone-800 rounded-xl px-4 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
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
            <div className="text-center py-8 text-xs text-stone-500">Loading worker wage details...</div>
          ) : filteredWorkers.length === 0 ? (
            <div className="text-center py-8 text-xs text-stone-500">No workers match your filter.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredWorkers.map((w) => (
                <button
                  key={w.workerId}
                  onClick={() => handleSelectWorker(w)}
                  className="p-4 rounded-2xl bg-stone-950 hover:bg-stone-800/60 border border-stone-800 text-left transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="space-y-1">
                    <div className="font-bold text-stone-100 group-hover:text-amber-400 transition-colors">
                      {w.name}
                    </div>
                    <div className="text-xs text-stone-400">
                      {w.category} • ₹{w.dailyRate}/day
                    </div>
                    <div className="text-[11px] text-stone-500">
                      Worked: {w.workedDays} days ({w.presentDays}P / {w.halfDays}HD)
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs text-stone-400">Due Amount</div>
                    <div
                      className={`text-base font-extrabold ${
                        w.amountDue > 0 ? 'text-amber-400' : 'text-emerald-400'
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
        <div className="space-y-6">
          {/* Worker Selected Header */}
          <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-xs text-amber-400 font-bold uppercase tracking-wider block">Selected Worker</span>
              <h2 className="text-xl font-extrabold text-stone-100">{selectedWorker.name}</h2>
              <p className="text-xs text-stone-400">
                {selectedWorker.category} • Rate: ₹{selectedWorker.dailyRate}/day
              </p>
            </div>
            <button
              onClick={() => setSelectedWorker(null)}
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold rounded-xl"
            >
              Change Worker
            </button>
          </div>

          {/* Wage Breakdown Summary Card */}
          <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">Automatic Wage Calculation</h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-stone-950 border border-stone-800 rounded-xl">
                <span className="text-stone-400 block">Worked Days</span>
                <span className="text-sm font-bold text-stone-100 mt-1 block">
                  {selectedWorker.workedDays} Days
                </span>
                <span className="text-[10px] text-stone-500">
                  {selectedWorker.presentDays} Present, {selectedWorker.halfDays} Half Day
                </span>
              </div>

              <div className="p-3 bg-stone-950 border border-stone-800 rounded-xl">
                <span className="text-stone-400 block">Gross Wage</span>
                <span className="text-sm font-bold text-stone-100 mt-1 block">
                  ₹{selectedWorker.grossWage.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="p-3 bg-stone-950 border border-stone-800 rounded-xl">
                <span className="text-stone-400 block">Advances Taken</span>
                <span className="text-sm font-bold text-amber-400 mt-1 block">
                  ₹{selectedWorker.advances.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="p-3 bg-stone-950 border border-stone-800 rounded-xl">
                <span className="text-stone-400 block">Previous Paid</span>
                <span className="text-sm font-bold text-emerald-400 mt-1 block">
                  ₹{selectedWorker.previousPaid.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Current Amount Due Box */}
            <div className="bg-amber-950/40 border border-amber-800/80 p-4 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-amber-300">Net Current Amount Due</span>
                <div className="text-2xl font-black text-amber-400">
                  ₹{selectedWorker.amountDue.toLocaleString('en-IN')}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPaymentAmount(String(selectedWorker.amountDue))}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow transition-colors"
              >
                Use Amount Due
              </button>
            </div>
          </div>

          {/* Payment Form Entry */}
          <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">Enter Payment Details</h3>

            {error && (
              <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 text-xs rounded-xl font-medium">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">
                  Payment Amount (₹) <span className="text-amber-400">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Enter amount to pay..."
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-lg font-bold text-emerald-400 focus:outline-none focus:border-amber-500"
                />
                {parseFloat(paymentAmount) < selectedWorker.amountDue && parseFloat(paymentAmount) > 0 && (
                  <p className="text-[11px] text-amber-400/90 mt-1">
                    Partial Payment: Remaining due will be ₹
                    {(selectedWorker.amountDue - parseFloat(paymentAmount)).toLocaleString('en-IN')}.
                  </p>
                )}
              </div>

              {/* Payment Method Chips */}
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-2">Payment Method</label>
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
                          ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md'
                          : 'bg-stone-950 text-stone-300 border-stone-800 hover:border-stone-700'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">Notes / Remark (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Weekly settlement, Part payment for Mason work"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
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
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-base font-extrabold rounded-xl transition-all shadow-lg text-center"
              >
                Review & Confirm Payment →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compact Review Confirmation Modal */}
      {showConfirmModal && selectedWorker && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 w-full max-w-md p-6 rounded-2xl space-y-5">
            <h3 className="text-lg font-bold text-stone-100 border-b border-stone-800 pb-3">
              Confirm Payment
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-stone-800/60">
                <span className="text-stone-400">Recipient Worker:</span>
                <span className="font-bold text-stone-100">{selectedWorker.name}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-stone-800/60">
                <span className="text-stone-400">Payment Amount:</span>
                <span className="font-extrabold text-emerald-400 text-sm">
                  ₹{parseFloat(paymentAmount).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-stone-800/60">
                <span className="text-stone-400">Payment Method:</span>
                <span className="font-semibold text-stone-200">{paymentMethod}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-stone-800/60">
                <span className="text-stone-400">Project Site:</span>
                <span className="text-stone-300 font-semibold">{activeProject?.name}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2.5 bg-stone-800 text-stone-300 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmPay}
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-extrabold rounded-xl transition-all disabled:opacity-50"
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
