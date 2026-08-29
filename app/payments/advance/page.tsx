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
        body: JSON.stringify({
          ...bodyPayload
        })
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
        <div className="bg-[#EAF7EF] border border-[#bce6cb] p-6 rounded-2xl text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-[#087F3E] text-white rounded-full flex items-center justify-center text-3xl mx-auto font-black shadow">
            ✓
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-[#056B34]">Advance Given Successfully ✓</h2>
            <p className="text-xs text-slate-600 mt-1">Receipt ID: {successResult.receiptId}</p>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-2 text-left text-xs shadow-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Paid To:</span>
              <span className="font-bold text-slate-900">{successResult.recipientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Advance Amount:</span>
              <span className="font-extrabold text-[#087F3E] text-sm">
                ₹{successResult.amount.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Payment Mode:</span>
              <span className="font-semibold text-slate-900">{successResult.paymentMethod}</span>
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
    <div className="space-y-3 pb-20 max-w-2xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-row items-center justify-between gap-2 bg-white border border-slate-200 p-3 rounded-xl shadow-2xs">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-lg">💵</span>
            <h1 className="text-base font-extrabold text-slate-900">Give Financial Advance</h1>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Record advances for <span className="text-[#087F3E] font-semibold">{activeProject?.name || 'Selected Site'}</span>.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 p-3.5 rounded-xl space-y-3.5 shadow-2xs">
        {/* Toggle Advance Recipient Type */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">Advance Type</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAdvanceType('LABOUR')}
              className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                advanceType === 'LABOUR'
                  ? 'bg-[#087F3E] text-white border-[#087F3E] shadow'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              👷 Worker Wage Advance
            </button>
            <button
              type="button"
              onClick={() => setAdvanceType('VENDOR')}
              className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                advanceType === 'VENDOR'
                  ? 'bg-[#087F3E] text-white border-[#087F3E] shadow'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              🏷️ Vendor Supplier Advance
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-bold">
            {error}
          </div>
        )}

        {/* Select Recipient */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Select {advanceType === 'LABOUR' ? 'Worker' : 'Vendor'} <span className="text-red-500">*</span>
          </label>
          <select
            required
            value={selectedRecipientId}
            onChange={(e) => setSelectedRecipientId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-900 focus:outline-none focus:border-[#087F3E]"
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
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Advance Amount (₹) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            required
            placeholder="Enter advance amount..."
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-bold text-[#087F3E] focus:outline-none focus:border-[#087F3E]"
          />
        </div>

        {/* Payment Method */}
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

        {/* Remarks */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Remarks / Reason (Optional)</label>
          <input
            type="text"
            placeholder="e.g. Festival advance, Site mobilization advance"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#087F3E]"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 bg-[#087F3E] hover:bg-[#056B34] text-white text-base font-extrabold rounded-xl transition-all shadow text-center disabled:opacity-50"
        >
          {submitting ? 'Saving Advance...' : 'Confirm & Save Advance →'}
        </button>
      </form>
    </div>
  );
}

export default function GiveAdvancePage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-xs text-slate-500">Loading form...</div>}>
      <GiveAdvanceForm />
    </Suspense>
  );
}
