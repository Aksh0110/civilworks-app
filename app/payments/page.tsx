'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useProject } from '@/lib/context/ProjectContext';

import ConfirmModal from '@/components/ConfirmModal';
import { isFeatureEnabled } from '@/lib/config/features';

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

  const showLabour = isFeatureEnabled('workers') || isFeatureEnabled('attendance');

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

  const availableTabs = showLabour
    ? (['ALL', 'LABOUR', 'VENDOR', 'ADVANCES'] as const)
    : (['ALL', 'VENDOR', 'ADVANCES'] as const);

  return (
    <div className="space-y-3 pb-20 max-w-4xl mx-auto">
      {/* Top Banner Header */}
      <div className="flex flex-row items-center justify-between gap-2 bg-white border border-slate-200 p-3 rounded-xl shadow-2xs">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg">💳</span>
            <h1 className="text-base font-extrabold text-slate-900">Payment & Settlements</h1>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Payments & settlements for <span className="text-[#087F3E] font-bold">{activeProject?.name || 'Selected Site'}</span>.
          </p>
        </div>
      </div>

      {/* Summary Widget */}
      <div className={`grid grid-cols-2 ${showLabour ? 'sm:grid-cols-4' : 'sm:grid-cols-2'} gap-2`}>
        {showLabour && (
          <div className="bg-white border border-slate-200 p-2.5 rounded-xl shadow-2xs">
            <span className="text-[11px] text-slate-500 block font-semibold">Today Labour</span>
            <span className="text-base font-black text-[#087F3E] mt-0.5 block">
              ₹{(summary?.todayLabourPaid || 0).toLocaleString('en-IN')}
            </span>
          </div>
        )}

        <div className="bg-white border border-slate-200 p-2.5 rounded-xl shadow-2xs">
          <span className="text-[11px] text-slate-500 block font-semibold">Today Vendor</span>
          <span className="text-base font-black text-[#087F3E] mt-0.5 block">
            ₹{(summary?.todayVendorPaid || 0).toLocaleString('en-IN')}
          </span>
        </div>

        {showLabour && (
          <div className="bg-white border border-slate-200 p-2.5 rounded-xl shadow-2xs">
            <span className="text-[11px] text-slate-500 block font-semibold">Labour Due</span>
            <span className="text-base font-black text-amber-600 mt-0.5 block">
              ₹{(summary?.outstandingLabourDue || 0).toLocaleString('en-IN')}
            </span>
          </div>
        )}

        <div className="bg-white border border-slate-200 p-2.5 rounded-xl shadow-2xs">
          <span className="text-[11px] text-slate-500 block font-semibold">Vendor Outstanding</span>
          <span className="text-base font-black text-amber-600 mt-0.5 block">
            ₹{(summary?.outstandingVendorDue || 0).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Primary Action Cards */}
      <div className={`grid grid-cols-2 ${showLabour ? 'sm:grid-cols-2' : 'sm:grid-cols-1'} gap-2.5`}>
        {showLabour && (
          <Link
            href="/payments/labour"
            className="group bg-white border border-slate-200 hover:border-[#087F3E] p-3 rounded-xl transition-all duration-200 shadow-2xs flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-[#EAF7EF] text-[#056B34] border border-[#bce6cb] flex items-center justify-center text-lg">
                👷
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EAF7EF] text-[#056B34]">
                Wage
              </span>
            </div>

            <div className="mt-2">
              <h2 className="text-xs font-extrabold text-slate-900 group-hover:text-[#087F3E] transition-colors">
                Pay Labour
              </h2>
              <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                Settle worker wages.
              </p>
            </div>

            <div className="mt-2 flex items-center text-[11px] font-bold text-[#087F3E] gap-1">
              <span>Pay Wages</span>
              <span>→</span>
            </div>
          </Link>
        )}

        {/* Pay Vendor Card */}
        <Link
          href="/payments/vendor"
          className="group bg-white border border-slate-200 hover:border-[#087F3E] p-3 rounded-xl transition-all duration-200 shadow-2xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center text-lg">
              🏬
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
              Vendor
            </span>
          </div>

          <div className="mt-2">
            <h2 className="text-xs font-extrabold text-slate-900 group-hover:text-[#087F3E] transition-colors">
              Pay Vendor
            </h2>
            <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
              Settle vendor bills.
            </p>
          </div>

          <div className="mt-2 flex items-center text-[11px] font-bold text-[#087F3E] gap-1">
            <span>Pay Bills</span>
            <span>→</span>
          </div>
        </Link>
      </div>

      {/* Secondary Quick Actions for Advances */}
      <div className={`grid ${showLabour ? 'grid-cols-2' : 'grid-cols-1'} gap-2.5`}>
        {showLabour && (
          <Link
            href="/payments/advance?type=LABOUR"
            className="bg-white border border-slate-200 p-2.5 rounded-xl hover:border-slate-300 transition-colors shadow-2xs flex items-center gap-2.5"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center text-base shrink-0">
              💵
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xs font-bold text-slate-900 truncate">Labour Advance</h3>
              <p className="text-[10px] text-slate-500 truncate">Record wage advance</p>
            </div>
          </Link>
        )}

        <Link
          href="/payments/advance?type=VENDOR"
          className="bg-white border border-slate-200 p-2.5 rounded-xl hover:border-slate-300 transition-colors shadow-2xs flex items-center gap-2.5"
        >
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center text-base shrink-0">
            🏷️
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs font-bold text-slate-900 truncate">Vendor Advance</h3>
            <p className="text-[10px] text-slate-500 truncate">Record supplier advance</p>
          </div>
        </Link>
      </div>

      {/* Payment History Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-900">Payment History & Ledger</h2>

          {/* Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1 border border-slate-200">
            {availableTabs.map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t as any)}
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
                    <span className="font-extrabold text-xs text-slate-900">{item.receiptId}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        item.recipientType === 'WORKER'
                          ? 'bg-[#EAF7EF] text-[#056B34]'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {item.paymentType.replace('_', ' ')}
                    </span>
                    {item.status === 'VOIDED' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-100 text-red-700">
                        VOIDED
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-bold text-slate-900">{item.recipientName}</p>
                  <p className="text-[11px] text-slate-500">
                    {new Date(item.paymentDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}{' '}
                    · Mode: {item.paymentMethod}
                  </p>
                  {item.notes && <p className="text-xs text-slate-600 italic">"{item.notes}"</p>}
                  {item.voidReason && (
                    <p className="text-xs text-red-600 font-semibold">Reason: {item.voidReason}</p>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <span className="text-base font-black text-slate-900">
                    ₹{item.amount.toLocaleString('en-IN')}
                  </span>

                  <div className="flex items-center gap-2">
                    {item.status !== 'VOIDED' && (
                      <button
                        onClick={() => {
                          setSelectedPaymentToVoid(item);
                          setVoidReason('');
                          setVoidError('');
                        }}
                        className="px-3 py-1.5 rounded-xl border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 text-xs font-bold transition-colors"
                      >
                        Void
                      </button>
                    )}

                    <button
                      onClick={() => setPaymentToDelete(item)}
                      className="p-1.5 text-slate-400 hover:text-red-600 text-xs font-bold"
                      title="Delete Transaction"
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

      {/* Void Confirmation Modal */}
      {selectedPaymentToVoid && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleVoidPayment}
            className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl"
          >
            <h3 className="text-base font-bold text-slate-900">
              Void Payment Receipt ({selectedPaymentToVoid.receiptId})
            </h3>
            <p className="text-xs text-slate-500">
              Voiding this payment will adjust ledger balances for {selectedPaymentToVoid.recipientName}.
            </p>

            {voidError && <div className="text-xs text-red-600 font-semibold">{voidError}</div>}

            <textarea
              required
              rows={3}
              placeholder="Reason for voiding (e.g. Duplicate entry, Wrong amount)..."
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-[#087F3E]"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedPaymentToVoid(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={voiding}
                className="px-4 py-2 bg-amber-500 text-slate-950 text-xs font-extrabold rounded-xl hover:bg-amber-400"
              >
                {voiding ? 'Voiding...' : 'Confirm Void'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confirm Delete Modal */}
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
