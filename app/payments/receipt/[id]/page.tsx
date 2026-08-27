'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function PaymentReceiptPage() {
  const params = useParams();
  const id = params?.id as string;

  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    fetch(`/api/payments/receipt/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.data) setReceipt(d.data);
        else throw new Error(d.message || 'Receipt not found.');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-lg mx-auto py-12 text-center text-xs text-stone-500">
        Loading receipt...
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="max-w-lg mx-auto py-12 text-center space-y-4">
        <div className="text-red-400 text-sm font-bold">{error || 'Receipt unavailable'}</div>
        <Link
          href="/payments"
          className="inline-block px-4 py-2 bg-stone-800 text-stone-300 text-xs font-bold rounded-xl"
        >
          Back to Payments
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-4 space-y-6">
      {/* Action Bar (Print / Back) */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          href="/payments"
          className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold rounded-xl"
        >
          ← Back to Payments
        </Link>
        <button
          onClick={() => window.print()}
          className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-extrabold rounded-xl shadow transition-colors"
        >
          🖨️ Print / Save PDF
        </button>
      </div>

      {/* Printable Receipt Card */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 space-y-6 shadow-2xl print:bg-white print:text-black print:border-black">
        {/* Header */}
        <div className="text-center border-b border-stone-800 print:border-stone-300 pb-5 space-y-1">
          <div className="flex items-center justify-center gap-2 text-xl font-black text-emerald-400 print:text-emerald-700">
            <span>🏗️</span> CivilWorks
          </div>
          <h1 className="text-xs font-extrabold uppercase tracking-widest text-stone-400 print:text-stone-600">
            OFFICIAL PAYMENT RECEIPT
          </h1>
          <div className="text-xs font-bold text-amber-400 print:text-amber-700 mt-2">
            Receipt ID: {receipt.receiptId}
          </div>
        </div>

        {/* Receipt Key-Value Details */}
        <div className="space-y-3 text-xs">
          <div className="flex justify-between py-1.5 border-b border-stone-800/80 print:border-stone-200">
            <span className="text-stone-400 print:text-stone-600">Project Site:</span>
            <span className="font-bold text-stone-100 print:text-black">{receipt.projectName}</span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-stone-800/80 print:border-stone-200">
            <span className="text-stone-400 print:text-stone-600">Paid To ({receipt.recipientType}):</span>
            <span className="font-bold text-stone-100 print:text-black text-sm">{receipt.recipientName}</span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-stone-800/80 print:border-stone-200">
            <span className="text-stone-400 print:text-stone-600">Transaction Type:</span>
            <span className="font-bold text-stone-200 print:text-black">
              {receipt.paymentType.replace('_', ' ')}
            </span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-stone-800/80 print:border-stone-200">
            <span className="text-stone-400 print:text-stone-600">Payment Mode:</span>
            <span className="font-semibold text-stone-200 print:text-black">{receipt.paymentMethod}</span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-stone-800/80 print:border-stone-200">
            <span className="text-stone-400 print:text-stone-600">Date & Time:</span>
            <span className="text-stone-300 print:text-black">
              {new Date(receipt.paymentDate).toLocaleString('en-IN')}
            </span>
          </div>

          {receipt.notes && (
            <div className="flex justify-between py-1.5 border-b border-stone-800/80 print:border-stone-200">
              <span className="text-stone-400 print:text-stone-600">Remarks:</span>
              <span className="text-stone-300 print:text-black italic">{receipt.notes}</span>
            </div>
          )}

          <div className="flex justify-between py-1.5 border-b border-stone-800/80 print:border-stone-200">
            <span className="text-stone-400 print:text-stone-600">Status:</span>
            <span
              className={`font-extrabold ${
                receipt.status === 'COMPLETED' ? 'text-emerald-400 print:text-emerald-700' : 'text-red-400'
              }`}
            >
              {receipt.status}
            </span>
          </div>
        </div>

        {/* Total Amount Banner */}
        <div className="bg-stone-950 print:bg-stone-100 p-4 rounded-xl text-center space-y-1 border border-stone-800 print:border-stone-300">
          <span className="text-[11px] font-bold text-stone-400 print:text-stone-600 uppercase tracking-wider">
            Total Amount Settled
          </span>
          <div className="text-3xl font-black text-emerald-400 print:text-emerald-700">
            ₹{receipt.amount.toLocaleString('en-IN')}
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-2 text-center text-[10px] text-stone-500 print:text-stone-600">
          Generated By: {receipt.createdBy} • CivilWorks Mobile Construction Management System
        </div>
      </div>
    </div>
  );
}
