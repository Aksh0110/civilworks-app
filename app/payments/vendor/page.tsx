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
        <div className="bg-[#EAF7EF] border border-[#bce6cb] p-6 rounded-2xl text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-[#087F3E] text-white rounded-full flex items-center justify-center text-3xl mx-auto font-black shadow">
            ✓
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-[#056B34]">Vendor Payment Successful ✓</h2>
            <p className="text-xs text-slate-600 mt-1">Receipt ID: {successResult.receiptId}</p>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-2 text-left text-xs shadow-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Paid To Vendor:</span>
              <span className="font-bold text-slate-900">{selectedVendor?.name}</span>
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
            <span className="text-lg">🏬</span>
            <h1 className="text-base font-extrabold text-slate-900">Pay Vendor Bill</h1>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Settle vendor bills for <span className="text-[#087F3E] font-semibold">{activeProject?.name || 'Selected Site'}</span>.
          </p>
        </div>
      </div>

      {!selectedVendor ? (
        /* STEP 1: VENDOR SELECTION */
        <div className="bg-white border border-slate-200 p-3 rounded-xl space-y-2.5 shadow-2xs">
          <h2 className="text-xs font-extrabold text-slate-900">Select Vendor to Pay</h2>

          <input
            type="text"
            placeholder="Search vendor by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#087F3E]"
          />

          {loading ? (
            <div className="text-center py-6 text-xs text-slate-500">Loading vendors...</div>
          ) : filteredVendors.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500">No vendors found.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredVendors.map((v) => (
                <button
                  key={v.vendorId}
                  onClick={() => handleSelectVendor(v)}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-[#EAF7EF] border border-slate-200 text-left transition-all flex items-center justify-between gap-2 group shadow-2xs"
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="font-extrabold text-xs text-slate-900 group-hover:text-[#087F3E] transition-colors truncate">
                      {v.name}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">{v.category || 'Vendor Supplier'}</div>
                    <div className="text-[10px] text-slate-500 truncate">
                      Billed: ₹{v.totalBilled.toLocaleString('en-IN')} • Open Bills: {v.openBillsCount}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-[9px] text-slate-500 font-semibold">Outstanding</div>
                    <div
                      className={`text-xs font-black ${
                        v.outstandingAmount > 0 ? 'text-amber-600' : 'text-[#087F3E]'
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
        <div className="space-y-3">
          <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-sm">
            <div>
              <span className="text-xs text-[#087F3E] font-bold uppercase tracking-wider block">Selected Vendor</span>
              <h2 className="text-xl font-extrabold text-slate-900">{selectedVendor.name}</h2>
              <p className="text-xs text-slate-500">
                Outstanding Balance: ₹{selectedVendor.outstandingAmount.toLocaleString('en-IN')}
              </p>
            </div>
            <button
              onClick={() => setSelectedVendor(null)}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
            >
              Change Vendor
            </button>
          </div>

          {/* Open Bills Selection (if available) */}
          {vendorDetail && vendorDetail.bills && vendorDetail.bills.length > 0 && (
            <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-3 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#087F3E]">
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
                      ? 'bg-[#EAF7EF] border-[#087F3E] text-slate-900 shadow'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="text-xs font-bold">Pay Total Outstanding Balance</div>
                  <div className="text-sm font-extrabold text-[#087F3E] mt-1">
                    ₹{selectedVendor.outstandingAmount.toLocaleString('en-IN')}
                  </div>
                </button>

                {vendorDetail.bills.map((b: any) => {
                  const bal = (b.totalAmount || 0) - (b.paidAmount || 0);
                  const itemsText = Array.isArray(b.items) && b.items.length > 0
                    ? b.items.map((i: any) => `${i.quantity} ${i.unit} ${i.materialName}`).join(', ')
                    : b.remarks || '';

                  return (
                    <button
                      key={b._id}
                      type="button"
                      onClick={() => handleSelectBill(b)}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        selectedBillId === b._id
                          ? 'bg-[#EAF7EF] border-[#087F3E] text-slate-900 shadow-md ring-2 ring-[#087F3E]/20'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-extrabold text-slate-900">
                          {b.materialInwardId ? '📦 Invoice:' : '📄 Bill:'} {b.billNumber}
                        </span>
                        <span
                          className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${
                            b.status === 'SETTLED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : b.status === 'PARTIAL'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {b.status}
                        </span>
                      </div>

                      {itemsText && (
                        <div className="text-[11px] font-bold text-slate-700 mt-1 line-clamp-2">
                          {itemsText}
                        </div>
                      )}

                      <div className="text-xs text-slate-500 mt-1 flex justify-between">
                        <span>Total: ₹{b.totalAmount.toLocaleString('en-IN')}</span>
                        <span>Paid: ₹{(b.paidAmount || 0).toLocaleString('en-IN')}</span>
                      </div>

                      <div className="text-sm font-black text-[#087F3E] mt-1 pt-1 border-t border-slate-200/60 flex justify-between items-center">
                        <span>Balance Due:</span>
                        <span>₹{bal.toLocaleString('en-IN')}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
                  placeholder="e.g. Bill payment against cement delivery"
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
                Review & Confirm Vendor Payment →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && selectedVendor && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 pb-6 sm:pb-4">
          <div className="bg-white border border-slate-200 w-full max-w-md p-6 max-h-[85vh] overflow-y-auto rounded-2xl space-y-5 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-3">
              Confirm Vendor Payment
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Vendor:</span>
                <span className="font-bold text-slate-900">{selectedVendor.name}</span>
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
