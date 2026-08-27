'use client';

import { useState, useEffect, useId, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useProject } from '@/lib/context/ProjectContext';

function GiveAdvanceForm() {
  const { activeProject } = useProject();
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type') === 'VENDOR' ? 'VENDOR' : 'LABOUR';
  const idempotencyId = useId();

  const [advanceType, setAdvanceType] = useState<'LABOUR' | 'VENDOR'>(initialType);
  const [workers, setWorkers] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [selectedRecipientId, setSelectedRecipientId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'ONLINE' | 'BANK_TRANSFER' | 'OTHER'>('CASH');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successResult, setSuccessResult] = useState<any>(null);

  useEffect(() => {
    if (!activeProject?._id) return;
    loadRecipients();
  }, [activeProject?._id, advanceType]);

  const loadRecipients = () => {
    if (!activeProject?._id) return;
    setLoading(true);
    setSelectedRecipientId('');

    if (advanceType === 'LABOUR') {
      fetch(`/api/workers?projectId=${activeProject._id}&status=ACTIVE`)
        .then((r) => r.json())
        .then((d) => setWorkers(d.data || []))
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      fetch('/api/vendors')
        .then((r) => r.json())
        .then((d) => setVendors(d.data || []))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject?._id) return;

    if (!selectedRecipientId) {
      setError(`Please select a ${advanceType === 'LABOUR' ? 'worker' : 'vendor'}.`);
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid positive advance amount.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const paymentType = advanceType === 'LABOUR' ? 'LABOUR_ADVANCE' : 'VENDOR_ADVANCE';
      const bodyPayload: any = {
        projectId: activeProject._id,
        paymentType,
        amount: numAmount,
        paymentMethod,
        notes: notes.trim() || undefined,
        idempotencyKey: `advance-${advanceType.toLowerCase()}-${selectedRecipientId}-${idempotencyId}-${Date.now()}`,
        user: 'Site Supervisor'
      };

      if (advanceType === 'LABOUR') bodyPayload.workerId = selectedRecipientId;
      else bodyPayload.vendorId = selectedRecipientId;

      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to process advance.');

      setSuccessResult(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (successResult) {
    return (
      <div className="max-w-lg mx-auto py-6 space-y-6">
        <div className="bg-amber-950/80 border border-amber-800/80 p-6 rounded-2xl text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full flex items-center justify-center text-3xl mx-auto">
            ✓
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-amber-100">Advance Given Successfully ✓</h2>
            <p className="text-xs text-amber-300/80 mt-1">Receipt ID: {successResult.receiptId}</p>
          </div>

          <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl space-y-2 text-left text-xs">
            <div className="flex justify-between">
              <span className="text-stone-400">Paid To:</span>
              <span className="font-bold text-stone-100">{successResult.recipientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Advance Amount:</span>
              <span className="font-bold text-amber-400 text-sm">
                ₹{successResult.amount.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Payment Mode:</span>
              <span className="font-semibold text-stone-200">{successResult.paymentMethod}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href={`/payments/receipt/${successResult._id}`}
              className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-xs rounded-xl transition-colors text-center"
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
    <div className="space-y-6 pb-20 max-w-2xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-900 border border-stone-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">💵</span>
            <h1 className="text-xl font-bold text-stone-100">Give Financial Advance</h1>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Record independent advances for labour or suppliers on{' '}
            <span className="text-amber-400 font-semibold">{activeProject?.name || 'Selected Site'}</span>.
          </p>
        </div>

        <Link
          href="/payments"
          className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold rounded-xl"
        >
          ← Back
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-stone-900 border border-stone-800 p-6 rounded-2xl space-y-5">
        {/* Toggle Advance Recipient Type */}
        <div>
          <label className="block text-xs font-bold text-stone-300 mb-2">Advance Type</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAdvanceType('LABOUR')}
              className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                advanceType === 'LABOUR'
                  ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md'
                  : 'bg-stone-950 text-stone-300 border-stone-800'
              }`}
            >
              👷 Worker Wage Advance
            </button>
            <button
              type="button"
              onClick={() => setAdvanceType('VENDOR')}
              className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                advanceType === 'VENDOR'
                  ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md'
                  : 'bg-stone-950 text-stone-300 border-stone-800'
              }`}
            >
              🏷️ Vendor Supplier Advance
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        {/* Select Recipient */}
        <div>
          <label className="block text-xs font-bold text-stone-300 mb-1">
            Select {advanceType === 'LABOUR' ? 'Worker' : 'Vendor'} <span className="text-amber-400">*</span>
          </label>
          <select
            required
            value={selectedRecipientId}
            onChange={(e) => setSelectedRecipientId(e.target.value)}
            className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
          >
            <option value="">-- Choose {advanceType === 'LABOUR' ? 'Worker' : 'Vendor'} --</option>
            {advanceType === 'LABOUR'
              ? workers.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.name} ({w.category}) — ₹{w.dailyRate}/day
                  </option>
                ))
              : vendors.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.name} ({v.category || 'Vendor'})
                  </option>
                ))}
          </select>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-bold text-stone-300 mb-1">
            Advance Amount (₹) <span className="text-amber-400">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            required
            placeholder="Enter advance amount..."
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-lg font-bold text-amber-400 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Payment Method */}
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
                    : 'bg-stone-950 text-stone-300 border-stone-800'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Remarks */}
        <div>
          <label className="block text-xs font-bold text-stone-300 mb-1">Remarks / Reason (Optional)</label>
          <input
            type="text"
            placeholder="e.g. Festival advance, Site mobilization advance"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-stone-950 text-base font-extrabold rounded-xl transition-all shadow-lg text-center disabled:opacity-50"
        >
          {submitting ? 'Saving Advance...' : 'Confirm & Save Advance →'}
        </button>
      </form>
    </div>
  );
}

export default function GiveAdvancePage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-xs text-stone-500">Loading form...</div>}>
      <GiveAdvanceForm />
    </Suspense>
  );
}
