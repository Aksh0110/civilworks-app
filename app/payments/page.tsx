'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useProject } from '@/lib/context/ProjectContext';

import ConfirmModal from '@/components/ConfirmModal';

interface PaymentSummary {
  todayLabourPaid: number;
  todayVendorPaid: number;
  outstandingLabourDue: number;
  outstandingVendorDue: number;
}

interface PaymentHistoryRecord {
  _id: string;
  receiptId: string;
  paymentType: 'LABOUR_PAYMENT' | 'VENDOR_PAYMENT' | 'LABOUR_ADVANCE' | 'VENDOR_ADVANCE';
  recipientType: 'WORKER' | 'VENDOR';
  recipientName: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  status: 'COMPLETED' | 'VOIDED';
  voidReason?: string;
  notes?: string;
}

export default function PaymentsMainPage() {
  const { activeProject } = useProject();
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [history, setHistory] = useState<PaymentHistoryRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | 'LABOUR' | 'VENDOR' | 'ADVANCES'>('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Delete State
  const [paymentToDelete, setPaymentToDelete] = useState<PaymentHistoryRecord | null>(null);

  // Voiding Modal state
  const [selectedPaymentToVoid, setSelectedPaymentToVoid] = useState<PaymentHistoryRecord | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [voiding, setVoiding] = useState(false);
  const [voidError, setVoidError] = useState('');

  const handleDeletePayment = async () => {
    if (!paymentToDelete) return;
    const res = await fetch(`/api/payments/${paymentToDelete._id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Failed to delete payment transaction');
    }
    loadData();
  };

  useEffect(() => {
    if (!activeProject?._id) return;
    loadData();
  }, [activeProject?._id, activeTab]);

  const loadData = () => {
    if (!activeProject?._id) return;
    setLoading(true);

    Promise.all([
      fetch(`/api/payments/summary?projectId=${activeProject._id}`).then((r) => r.json()),
      fetch(`/api/payments?projectId=${activeProject._id}&type=${activeTab}`).then((r) => r.json())
    ])
      .then(([sumRes, histRes]) => {
        if (sumRes.data) setSummary(sumRes.data);
        if (histRes.data) setHistory(histRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleVoidPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaymentToVoid || !voidReason.trim()) return;

    try {
      setVoiding(true);
      setVoidError('');

      const res = await fetch(`/api/payments/${selectedPaymentToVoid._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: voidReason.trim(), user: 'Site Supervisor' })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to void payment.');

      setSelectedPaymentToVoid(null);
      setVoidReason('');
      loadData();
    } catch (err: any) {
      setVoidError(err.message);
    } finally {
      setVoiding(false);
    }
  };

  const filteredHistory = history.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.recipientName.toLowerCase().includes(q) ||
      item.receiptId.toLowerCase().includes(q) ||
      (item.notes && item.notes.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">💳</span>
            <h1 className="text-xl font-extrabold text-slate-900">Payment & Settlements</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage worker wages, vendor bill payments, and advances for{' '}
            <span className="text-[#087F3E] font-bold">{activeProject?.name || 'Selected Site'}</span>.
          </p>
        </div>
      </div>

      {/* Summary Widget */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <span className="text-xs text-slate-500 block font-semibold">Today Labour Paid</span>
          <span className="text-lg font-black text-[#087F3E] mt-1 block">
            ₹{(summary?.todayLabourPaid || 0).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <span className="text-xs text-slate-500 block font-semibold">Today Vendor Paid</span>
          <span className="text-lg font-black text-[#087F3E] mt-1 block">
            ₹{(summary?.todayVendorPaid || 0).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <span className="text-xs text-slate-500 block font-semibold">Labour Wage Due</span>
          <span className="text-lg font-black text-amber-600 mt-1 block">
            ₹{(summary?.outstandingLabourDue || 0).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <span className="text-xs text-slate-500 block font-semibold">Vendor Outstanding</span>
          <span className="text-lg font-black text-amber-600 mt-1 block">
            ₹{(summary?.outstandingVendorDue || 0).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Primary Action Cards: Pay Labour & Pay Vendor */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Pay Labour Card */}
        <Link
          href="/payments/labour"
          className="group bg-white border border-slate-200 hover:border-[#087F3E] p-6 rounded-2xl transition-all duration-200 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="w-14 h-14 rounded-2xl bg-[#EAF7EF] text-[#056B34] border border-[#bce6cb] flex items-center justify-center text-3xl group-hover:scale-105 transition-transform">
              👷
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#EAF7EF] text-[#056B34]">
              Wage Payment
            </span>
          </div>

          <div className="mt-5">
            <h2 className="text-xl font-bold text-slate-900 group-hover:text-[#087F3E] transition-colors">
              Pay Labour
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select workers with wage due, review worked days, and settle payments.
            </p>
          </div>

          <div className="mt-6 flex items-center text-xs font-bold text-[#087F3E] gap-1">
            <span>Pay Worker Wages</span>
            <span className="text-base">→</span>
          </div>
        </Link>

        {/* Pay Vendor Card */}
        <Link
          href="/payments/vendor"
          className="group bg-white border border-slate-200 hover:border-[#087F3E] p-6 rounded-2xl transition-all duration-200 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center text-3xl group-hover:scale-105 transition-transform">
              🏬
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700">
              Vendor Payment
            </span>
          </div>

          <div className="mt-5">
            <h2 className="text-xl font-bold text-slate-900 group-hover:text-[#087F3E] transition-colors">
              Pay Vendor
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Pay outstanding vendor balances or settle specific material bills.
            </p>
          </div>

          <div className="mt-6 flex items-center text-xs font-bold text-[#087F3E] gap-1">
            <span>Pay Vendor Bills</span>
            <span className="text-base">→</span>
          </div>
        </Link>
      </div>

      {/* Secondary Quick Actions for Advances */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/payments/advance?type=LABOUR"
          className="bg-white border border-slate-200 p-4 rounded-2xl hover:border-slate-300 transition-colors shadow-sm flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-xl shrink-0">
            💵
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Give Labour Advance</h3>
            <p className="text-xs text-slate-500">Record wage advance</p>
          </div>
        </Link>

        <Link
          href="/payments/advance?type=VENDOR"
          className="bg-white border border-slate-200 p-4 rounded-2xl hover:border-slate-300 transition-colors shadow-sm flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center text-xl shrink-0">
            🏷️
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Give Vendor Advance</h3>
            <p className="text-xs text-slate-500">Record supplier advance</p>
          </div>
        </Link>
      </div>

      {/* Payment History Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-900">Payment History & Ledger</h2>

          {/* Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1 border border-slate-200">
            {(['ALL', 'LABOUR', 'VENDOR', 'ADVANCES'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === t
                    ? 'bg-[#087F3E] text-white shadow'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search by recipient name, receipt ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#087F3E]"
        />

        {/* Payment History List */}
        {loading ? (
          <div className="text-center py-8 text-xs text-slate-500">Loading payment history...</div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">No payment records found.</div>
        ) : (
          <div className="space-y-3">
            {filteredHistory.map((item) => (
              <div
                key={item._id}
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  item.status === 'VOIDED'
                    ? 'bg-red-50 border-red-200 opacity-75'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{item.recipientName}</span>

                    {/* Badge */}
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                        item.paymentType === 'LABOUR_PAYMENT'
                          ? 'bg-[#EAF7EF] text-[#056B34] border border-[#bce6cb]'
                          : item.paymentType === 'VENDOR_PAYMENT'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {item.paymentType.replace('_', ' ')}
                    </span>

                    {item.status === 'VOIDED' && (
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                        VOIDED
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>Receipt: {item.receiptId}</span>
                    <span>•</span>
                    <span>Method: {item.paymentMethod}</span>
                    <span>•</span>
                    <span>{new Date(item.paymentDate).toLocaleDateString('en-IN')}</span>
                  </div>

                  {item.status === 'VOIDED' && item.voidReason && (
                    <div className="text-xs text-red-600 italic">Reason: {item.voidReason}</div>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-base font-black text-slate-900">
                      ₹{item.amount.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/payments/receipt/${item._id}`}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                    >
                      Receipt
                    </Link>

                    {item.status === 'COMPLETED' && (
                      <button
                        onClick={() => setSelectedPaymentToVoid(item)}
                        className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-bold rounded-lg transition-colors"
                      >
                        Void
                      </button>
                    )}

                    <button
                      onClick={() => setPaymentToDelete(item)}
                      className="p-1.5 text-slate-400 hover:text-red-600 text-xs font-bold"
                      title="Delete Record"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Void Modal */}
      {selectedPaymentToVoid && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 pb-6 sm:pb-4">
          <div className="bg-white border border-slate-200 w-full max-w-md p-6 max-h-[85vh] overflow-y-auto rounded-2xl space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-red-600">Void Payment #{selectedPaymentToVoid.receiptId}</h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to void this payment of{' '}
              <strong className="text-slate-900">₹{selectedPaymentToVoid.amount.toLocaleString('en-IN')}</strong> to{' '}
              <strong className="text-slate-900">{selectedPaymentToVoid.recipientName}</strong>? This action will
              restore the outstanding balance.
            </p>

            {voidError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                {voidError}
              </div>
            )}

            <form onSubmit={handleVoidPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Voiding <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Wrong amount entered, Cash refunded"
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPaymentToVoid(null);
                    setVoidReason('');
                  }}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={voiding || !voidReason.trim()}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl disabled:opacity-50"
                >
                  {voiding ? 'Voiding...' : 'Confirm Void'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Payment Confirmation Modal */}
      <ConfirmModal
        isOpen={!!paymentToDelete}
        title="Delete Payment Transaction"
        message={`Are you sure you want to delete payment receipt ${paymentToDelete?.receiptId}?`}
        itemName={paymentToDelete ? `Receipt: ${paymentToDelete.receiptId} (${paymentToDelete.recipientName} - ₹${paymentToDelete.amount})` : undefined}
        warningText="Transaction record will be removed from payment ledger."
        confirmText="Delete Payment"
        onClose={() => setPaymentToDelete(null)}
        onConfirm={handleDeletePayment}
      />
    </div>
  );
}
