'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useProject } from '@/lib/context/ProjectContext';

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

  // Voiding Modal state
  const [selectedPaymentToVoid, setSelectedPaymentToVoid] = useState<PaymentHistoryRecord | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [voiding, setVoiding] = useState(false);
  const [voidError, setVoidError] = useState('');

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-900 border border-stone-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">💳</span>
            <h1 className="text-xl font-bold text-stone-100">Payment & Settlements</h1>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Manage worker wages, vendor bill payments, and advances for{' '}
            <span className="text-amber-400 font-semibold">{activeProject?.name || 'Selected Site'}</span>.
          </p>
        </div>
      </div>

      {/* Summary Widget */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl">
          <span className="text-xs text-stone-400 block font-medium">Today Labour Paid</span>
          <span className="text-lg font-bold text-emerald-400 mt-1 block">
            ₹{(summary?.todayLabourPaid || 0).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl">
          <span className="text-xs text-stone-400 block font-medium">Today Vendor Paid</span>
          <span className="text-lg font-bold text-emerald-400 mt-1 block">
            ₹{(summary?.todayVendorPaid || 0).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl">
          <span className="text-xs text-stone-400 block font-medium">Labour Wage Due</span>
          <span className="text-lg font-bold text-amber-400 mt-1 block">
            ₹{(summary?.outstandingLabourDue || 0).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl">
          <span className="text-xs text-stone-400 block font-medium">Vendor Outstanding</span>
          <span className="text-lg font-bold text-amber-400 mt-1 block">
            ₹{(summary?.outstandingVendorDue || 0).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Primary Action Cards: Pay Labour & Pay Vendor */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Pay Labour Card */}
        <Link
          href="/payments/labour"
          className="group bg-stone-900 border border-stone-800 hover:border-emerald-500/50 p-6 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-emerald-950/20 flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
              👷
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300">
              Wage Payment
            </span>
          </div>

          <div className="mt-5">
            <h2 className="text-xl font-bold text-stone-100 group-hover:text-emerald-400 transition-colors">
              Pay Labour
            </h2>
            <p className="text-xs text-stone-400 mt-1">
              Select workers with wage due, review worked days, and settle payments.
            </p>
          </div>

          <div className="mt-6 flex items-center text-xs font-semibold text-emerald-400 gap-1">
            <span>Pay Worker Wages</span>
            <span className="text-base">→</span>
          </div>
        </Link>

        {/* Pay Vendor Card */}
        <Link
          href="/payments/vendor"
          className="group bg-stone-900 border border-stone-800 hover:border-blue-500/50 p-6 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-blue-950/20 flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
              🏬
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-500/20 text-blue-300">
              Vendor Payment
            </span>
          </div>

          <div className="mt-5">
            <h2 className="text-xl font-bold text-stone-100 group-hover:text-blue-400 transition-colors">
              Pay Vendor
            </h2>
            <p className="text-xs text-stone-400 mt-1">
              Pay outstanding vendor balances or settle specific material bills.
            </p>
          </div>

          <div className="mt-6 flex items-center text-xs font-semibold text-blue-400 gap-1">
            <span>Pay Vendor Bills</span>
            <span className="text-base">→</span>
          </div>
        </Link>
      </div>

      {/* Secondary Quick Actions for Advances */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/payments/advance?type=LABOUR"
          className="bg-stone-900 border border-stone-800 p-4 rounded-2xl hover:border-stone-700 transition-colors flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-xl shrink-0">
            💵
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-200">Give Labour Advance</h3>
            <p className="text-xs text-stone-500">Record wage advance</p>
          </div>
        </Link>

        <Link
          href="/payments/advance?type=VENDOR"
          className="bg-stone-900 border border-stone-800 p-4 rounded-2xl hover:border-stone-700 transition-colors flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-xl shrink-0">
            🏷️
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-200">Give Vendor Advance</h3>
            <p className="text-xs text-stone-500">Record supplier advance</p>
          </div>
        </Link>
      </div>

      {/* Payment History Section */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-bold text-stone-100">Payment History & Ledger</h2>

          {/* Tabs */}
          <div className="flex bg-stone-950 p-1 rounded-xl gap-1 border border-stone-800">
            {(['ALL', 'LABOUR', 'VENDOR', 'ADVANCES'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === t
                    ? 'bg-amber-500 text-stone-950 shadow'
                    : 'text-stone-400 hover:text-stone-200'
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
          className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
        />

        {/* Payment History List */}
        {loading ? (
          <div className="text-center py-8 text-xs text-stone-500">Loading payment history...</div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-8 text-xs text-stone-500">No payment records found.</div>
        ) : (
          <div className="space-y-3">
            {filteredHistory.map((item) => (
              <div
                key={item._id}
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  item.status === 'VOIDED'
                    ? 'bg-red-950/20 border-red-900/40 opacity-75'
                    : 'bg-stone-950 border-stone-800/80'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-stone-100">{item.recipientName}</span>

                    {/* Badge */}
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        item.paymentType === 'LABOUR_PAYMENT'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : item.paymentType === 'VENDOR_PAYMENT'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {item.paymentType.replace('_', ' ')}
                    </span>

                    {item.status === 'VOIDED' && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                        VOIDED
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-stone-400">
                    <span>Receipt: {item.receiptId}</span>
                    <span>•</span>
                    <span>Method: {item.paymentMethod}</span>
                    <span>•</span>
                    <span>{new Date(item.paymentDate).toLocaleDateString('en-IN')}</span>
                  </div>

                  {item.status === 'VOIDED' && item.voidReason && (
                    <div className="text-xs text-red-400 italic">Reason: {item.voidReason}</div>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-base font-extrabold text-stone-100">
                      ₹{item.amount.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/payments/receipt/${item._id}`}
                      className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold rounded-lg transition-colors"
                    >
                      Receipt
                    </Link>

                    {item.status === 'COMPLETED' && (
                      <button
                        onClick={() => setSelectedPaymentToVoid(item)}
                        className="px-2.5 py-1.5 bg-red-950/60 border border-red-900/60 hover:bg-red-900/80 text-red-300 text-xs font-semibold rounded-lg transition-colors"
                      >
                        Void
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Void Modal */}
      {selectedPaymentToVoid && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 w-full max-w-md p-6 rounded-2xl space-y-4">
            <h3 className="text-lg font-bold text-red-400">Void Payment #{selectedPaymentToVoid.receiptId}</h3>
            <p className="text-xs text-stone-400">
              Are you sure you want to void this payment of{' '}
              <strong className="text-stone-200">₹{selectedPaymentToVoid.amount.toLocaleString('en-IN')}</strong> to{' '}
              <strong className="text-stone-200">{selectedPaymentToVoid.recipientName}</strong>? This action will
              restore the outstanding balance.
            </p>

            {voidError && (
              <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 text-xs rounded-xl font-medium">
                {voidError}
              </div>
            )}

            <form onSubmit={handleVoidPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">
                  Reason for Voiding <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Wrong amount entered, Cash refunded"
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPaymentToVoid(null);
                    setVoidReason('');
                  }}
                  className="px-4 py-2 bg-stone-800 text-stone-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={voiding || !voidReason.trim()}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-stone-950 text-xs font-bold rounded-xl disabled:opacity-50"
                >
                  {voiding ? 'Voiding...' : 'Confirm Void'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
