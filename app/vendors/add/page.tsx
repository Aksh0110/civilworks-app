'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DEFAULT_VENDOR_CATEGORIES } from '@/lib/constants/vendorCategories';

export default function AddVendorPage() {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Cement / Steel');
  const [contactPerson, setContactPerson] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successVendor, setSuccessVendor] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vendor name is required.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const res = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          category,
          contactPerson: contactPerson.trim() || undefined,
          mobile: mobile.trim() || undefined,
          email: email.trim() || undefined,
          address: address.trim() || undefined,
          gstNumber: gstNumber.trim() || undefined,
          notes: notes.trim() || undefined,
          user: 'Site Supervisor'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to save vendor.');
      }

      setSuccessVendor(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (successVendor) {
    return (
      <div className="max-w-lg mx-auto py-6 space-y-6">
        <div className="bg-[#EAF7EF] border border-[#bce6cb] p-6 rounded-2xl text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-[#087F3E] text-white rounded-full flex items-center justify-center text-3xl mx-auto font-black shadow">
            ✓
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-[#056B34]">Vendor Added Successfully ✓</h2>
            <p className="text-xs text-slate-600 mt-1">{successVendor.name}</p>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-2 text-left text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Category:</span>
              <span className="font-semibold text-slate-900">{successVendor.category}</span>
            </div>
            {successVendor.contactPerson && (
              <div className="flex justify-between">
                <span className="text-slate-500">Contact Person:</span>
                <span className="font-semibold text-slate-900">{successVendor.contactPerson}</span>
              </div>
            )}
            {successVendor.mobile && (
              <div className="flex justify-between">
                <span className="text-slate-500">Phone:</span>
                <span className="font-semibold text-slate-900">{successVendor.mobile}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href={`/vendors/${successVendor._id}`}
              className="flex-1 py-3 bg-[#087F3E] hover:bg-[#056B34] text-white font-extrabold text-xs rounded-xl transition-colors text-center shadow"
            >
              View Vendor
            </Link>
            <Link
              href="/vendors"
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
          <div className="flex items-center gap-1.5">
            <span className="text-lg">➕</span>
            <h1 className="text-base font-extrabold text-slate-900">Add New Vendor</h1>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Onboard a material supplier, transporter, or contractor.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 p-6 rounded-2xl space-y-5 shadow-sm">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-bold">
            {error}
          </div>
        )}

        {/* Vendor Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Vendor / Company Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Shree Traders, R.K. Transport"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#087F3E]"
          />
        </div>

        {/* Category & Contact Person */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Supply Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#087F3E]"
            >
              {DEFAULT_VENDOR_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Contact Person</label>
            <input
              type="text"
              placeholder="e.g. Amit Sharma (Manager)"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#087F3E]"
            />
          </div>
        </div>

        {/* Mobile & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Phone / WhatsApp</label>
            <input
              type="tel"
              placeholder="e.g. 9876543210"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#087F3E]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email (Optional)</label>
            <input
              type="email"
              placeholder="e.g. info@shreetraders.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#087F3E]"
            />
          </div>
        </div>

        {/* GSTIN & Address */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">GSTIN Number (Optional)</label>
            <input
              type="text"
              placeholder="e.g. 27AAAAA0000A1Z5"
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 uppercase focus:outline-none focus:border-[#087F3E]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Office / Yard Address (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Plot 12, Industrial Area"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#087F3E]"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Terms (Optional)</label>
          <textarea
            rows={2}
            placeholder="e.g. 30-day payment terms, credit limit ₹2,00,000"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-[#087F3E]"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 bg-[#087F3E] hover:bg-[#056B34] text-white text-base font-extrabold rounded-xl transition-all shadow text-center disabled:opacity-50"
        >
          {submitting ? 'Saving Vendor...' : 'Save Vendor ✓'}
        </button>
      </form>
    </div>
  );
}
