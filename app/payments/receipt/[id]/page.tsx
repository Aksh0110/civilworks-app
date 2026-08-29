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
      <div className="max-w-lg mx-auto py-12 text-center text-xs text-slate-500">
        Loading receipt...
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="max-w-lg mx-auto py-12 text-center space-y-4">
        <div className="text-red-600 text-sm font-bold">{error || 'Receipt unavailable'}</div>
        <Link
          href="/payments"
          className="inline-block px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
        >
          Back to Payments
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-4 space-y-6">
      {/* Action Bar (Print) */}
      <div className="flex items-center justify-end print:hidden">
        <button
          onClick={() => window.print()}
          className="px-3 py-1.5 bg-[#087F3E] hover:bg-[#056B34] text-white text-xs font-extrabold rounded-lg shadow-2xs transition-colors"
        >
          🖨️ Print / Save PDF
        </button>
      </div>

      {/* Printable Receipt Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm print:shadow-none print:border-black">
        {/* Header */}
        <div className="text-center border-b border-slate-100 print:border-slate-300 pb-5 space-y-1">
          <div className="flex items-center justify-center gap-2 text-xl font-extrabold text-[#087F3E]">
            <span>🏗️</span> CivilWorks
          </div>
          <h1 className="text-xs font-extrabold uppercase tracking-widest text-slate-500">
            OFFICIAL PAYMENT RECEIPT
          </h1>
          <div className="text-xs font-bold text-[#087F3E] mt-2">
            Receipt ID: {receipt.receiptId}
          </div>
        </div>

        {/* Receipt Key-Value Details */}
        <div className="space-y-3 text-xs">
          <div className="flex justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Project Site:</span>
            <span className="font-bold text-slate-900">{receipt.projectName}</span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Paid To ({receipt.recipientType}):</span>
            <span className="font-bold text-slate-900 text-sm">{receipt.recipientName}</span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Transaction Type:</span>
            <span className="font-bold text-slate-900">
              {receipt.paymentType.replace('_', ' ')}
            </span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Payment Mode:</span>
            <span className="font-semibold text-slate-900">{receipt.paymentMethod}</span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Date & Time:</span>
            <span className="text-slate-800">
              {new Date(receipt.paymentDate).toLocaleString('en-IN')}
            </span>
          </div>

          {receipt.notes && (
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Remarks:</span>
              <span className="text-slate-800 italic">{receipt.notes}</span>
            </div>
          )}

          <div className="flex justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Status:</span>
            <span
              className={`font-extrabold ${
                receipt.status === 'COMPLETED' ? 'text-[#087F3E]' : 'text-red-600'
              }`}
            >
              {receipt.status}
            </span>
          </div>
        </div>

        {/* Total Amount Banner */}
        <div className="bg-[#EAF7EF] border border-[#bce6cb] p-4 rounded-xl text-center space-y-1 shadow-sm">
          <span className="text-[11px] font-bold text-[#056B34] uppercase tracking-wider">
            Total Amount Settled
          </span>
          <div className="text-3xl font-black text-[#087F3E]">
            ₹{receipt.amount.toLocaleString('en-IN')}
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-2 text-center text-[10px] text-slate-400 print:text-slate-600">
          Generated By: {receipt.createdBy} • CivilWorks Mobile Construction Management System
        </div>
      </div>
    </div>
  );
}
