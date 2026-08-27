'use client';

import { useState, useEffect, useId } from 'react';
import Link from 'next/link';
import { useProject } from '@/lib/context/ProjectContext';
import { VendorOutstandingItem } from '@/lib/services/paymentService';

export default function PayVendorPage() {
  const { activeProject } = useProject();
  const idempotencyId = useId();

  const [vendors, setVendors] = useState<VendorOutstandingItem[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<VendorOutstandingItem | null>(null);
  const [vendorDetail, setVendorDetail] = useState<any>(null);
  const [selectedBillId, setSelectedBillId] = useState<string>('');
  const [search, setSearch] = useState('');
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
    loadVendors();
  }, [activeProject?._id]);

  const loadVendors = () => {
    if (!activeProject?._id) return;
    setLoading(true);

    fetch(`/api/payments/vendors/due?projectId=${activeProject._id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.data) setVendors(d.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleSelectVendor = (v: VendorOutstandingItem) => {
    setSelectedVendor(v);
    setSelectedBillId('');
    setPaymentAmount(v.outstandingAmount > 0 ? String(v.outstandingAmount) : '');
    setError('');

    // Fetch vendor bill details
    if (activeProject?._id) {
      fetch(`/api/payments/vendors/due?projectId=${activeProject._id}&vendorId=${v.vendorId}`)
        .then((r) => r.json())
        .then((d) => setVendorDetail(d.data))
        .catch(console.error);
    }
  };

  const handleSelectBill = (bill: any) => {
    setSelectedBillId(bill._id);
    const balance = (bill.totalAmount || 0) - (bill.paidAmount || 0);
    setPaymentAmount(balance > 0 ? String(balance) : '');
  };

  const handleConfirmPay = async () => {
    if (!selectedVendor || !activeProject?._id) return;

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
          vendorId: selectedVendor.vendorId,
          billId: selectedBillId || undefined,
          paymentType: 'VENDOR_PAYMENT',
          amount: numAmount,
          paymentMethod,
          notes: notes.trim() || undefined,
          idempotencyKey: `vendor-pay-${selectedVendor.vendorId}-${idempotencyId}-${Date.now()}`,
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

  const filteredVendors = vendors.filter((v) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return v.name.toLowerCase().includes(q) || (v.category && v.category.toLowerCase().includes(q));
  });

  // Render Success Screen
  if (successResult) {
    return (
      <div className="max-w-lg mx-auto py-6 space-y-6">
        <div className="bg-blue-950/80 border border-blue-800/80 p-6 rounded-2xl text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full flex items-center justify-center text-3xl mx-auto">
            ✓
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-blue-100">Vendor Payment Successful ✓</h2>
            <p className="text-xs text-blue-300/80 mt-1">Receipt ID: {successResult.receiptId}</p>
          </div>

          <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl space-y-2 text-left text-xs">
            <div className="flex justify-between">
              <span className="text-stone-400">Paid To Vendor:</span>
              <span className="font-bold text-stone-100">{selectedVendor?.name}</span>
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
              className="flex-1 py-3 bg-blue-500 hover:bg-blue-400 text-stone-950 font-extrabold text-xs rounded-xl transition-colors text-center"
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
            <span className="text-2xl">🏬</span>
            <h1 className="text-xl font-bold text-stone-100">Pay Vendor Bill</h1>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Review vendor outstanding balances, select open bills, and record payments for{' '}
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

      {!selectedVendor ? (
        /* STEP 1: VENDOR SELECTION */
        <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl space-y-4">
          <h2 className="text-base font-bold text-stone-100">Select Vendor to Pay</h2>

          <input
            type="text"
            placeholder="Search vendor by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
          />

          {loading ? (
            <div className="text-center py-8 text-xs text-stone-500">Loading vendors...</div>
          ) : filteredVendors.length === 0 ? (
            <div className="text-center py-8 text-xs text-stone-500">No vendors found.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredVendors.map((v) => (
                <button
                  key={v.vendorId}
                  onClick={() => handleSelectVendor(v)}
                  className="p-4 rounded-2xl bg-stone-950 hover:bg-stone-800/60 border border-stone-800 text-left transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="space-y-1">
                    <div className="font-bold text-stone-100 group-hover:text-blue-400 transition-colors">
                      {v.name}
                    </div>
                    <div className="text-xs text-stone-400">{v.category || 'Vendor Supplier'}</div>
                    <div className="text-[11px] text-stone-500">
                      Billed: ₹{v.totalBilled.toLocaleString('en-IN')} • Open Bills: {v.openBillsCount}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs text-stone-400">Outstanding</div>
                    <div
                      className={`text-base font-extrabold ${
                        v.outstandingAmount > 0 ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      ₹{v.outstandingAmount.toLocaleString('en-IN')}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* STEP 2: VENDOR DETAIL & BILL PAYMENT */
        <div className="space-y-6">
          <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-xs text-blue-400 font-bold uppercase tracking-wider block">Selected Vendor</span>
              <h2 className="text-xl font-extrabold text-stone-100">{selectedVendor.name}</h2>
              <p className="text-xs text-stone-400">
                Outstanding Balance: ₹{selectedVendor.outstandingAmount.toLocaleString('en-IN')}
              </p>
            </div>
            <button
              onClick={() => setSelectedVendor(null)}
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold rounded-xl"
            >
              Change Vendor
            </button>
          </div>

          {/* Open Bills Selection (if available) */}
          {vendorDetail && vendorDetail.bills && vendorDetail.bills.length > 0 && (
            <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Select Specific Open Bill (Optional)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBillId('');
                    setPaymentAmount(String(selectedVendor.outstandingAmount));
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    !selectedBillId
                      ? 'bg-blue-950/60 border-blue-500 text-stone-100'
                      : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                  }`}
                >
                  <div className="text-xs font-bold">Pay Total Outstanding Balance</div>
                  <div className="text-sm font-extrabold text-amber-400 mt-1">
                    ₹{selectedVendor.outstandingAmount.toLocaleString('en-IN')}
                  </div>
                </button>

                {vendorDetail.bills.map((b: any) => {
                  const bal = (b.totalAmount || 0) - (b.paidAmount || 0);
                  return (
                    <button
                      key={b._id}
                      type="button"
                      onClick={() => handleSelectBill(b)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedBillId === b._id
                          ? 'bg-blue-950/60 border-blue-500 text-stone-100'
                          : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                      }`}
                    >
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-stone-200">Bill: {b.billNumber}</span>
                        <span className="text-[10px] uppercase font-bold text-amber-400">{b.status}</span>
                      </div>
                      <div className="text-xs text-stone-400 mt-1">
                        Total: ₹{b.totalAmount.toLocaleString('en-IN')} • Paid: ₹{(b.paidAmount || 0).toLocaleString('en-IN')}
                      </div>
                      <div className="text-sm font-extrabold text-blue-400 mt-1">
                        Balance Due: ₹{bal.toLocaleString('en-IN')}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-lg font-bold text-blue-400 focus:outline-none focus:border-amber-500"
                />
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
                  placeholder="e.g. Bill payment against cement delivery"
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
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-stone-950 text-base font-extrabold rounded-xl transition-all shadow-lg text-center"
              >
                Review & Confirm Vendor Payment →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && selectedVendor && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 w-full max-w-md p-6 rounded-2xl space-y-5">
            <h3 className="text-lg font-bold text-stone-100 border-b border-stone-800 pb-3">
              Confirm Vendor Payment
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-stone-800/60">
                <span className="text-stone-400">Vendor:</span>
                <span className="font-bold text-stone-100">{selectedVendor.name}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-stone-800/60">
                <span className="text-stone-400">Payment Amount:</span>
                <span className="font-extrabold text-blue-400 text-sm">
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
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-stone-950 text-xs font-extrabold rounded-xl transition-all disabled:opacity-50"
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
