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
        <div className="bg-emerald-950/80 border border-emerald-800/80 p-6 rounded-2xl text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center text-3xl mx-auto">
            ✓
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-emerald-100">Vendor Added Successfully ✓</h2>
            <p className="text-xs text-emerald-300/80 mt-1">{successVendor.name}</p>
          </div>

          <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl space-y-2 text-left text-xs">
            <div className="flex justify-between">
              <span className="text-stone-400">Category:</span>
              <span className="font-semibold text-stone-200">{successVendor.category}</span>
            </div>
            {successVendor.contactPerson && (
              <div className="flex justify-between">
                <span className="text-stone-400">Contact Person:</span>
                <span className="font-semibold text-stone-200">{successVendor.contactPerson}</span>
              </div>
            )}
            {successVendor.mobile && (
              <div className="flex justify-between">
                <span className="text-stone-400">Phone:</span>
                <span className="font-semibold text-stone-200">{successVendor.mobile}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href={`/vendors/${successVendor._id}`}
              className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-xs rounded-xl transition-colors text-center"
            >
              View Vendor
            </Link>
            <Link
              href="/vendors"
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
            <span className="text-2xl">➕</span>
            <h1 className="text-xl font-bold text-stone-100">Add New Vendor</h1>
          </div>
          <p className="text-xs text-stone-400 mt-1">Onboard a material supplier, transporter, or contractor.</p>
        </div>

        <Link
          href="/vendors"
          className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold rounded-xl"
        >
          ← Back
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-stone-900 border border-stone-800 p-6 rounded-2xl space-y-5">
        {error && (
          <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        {/* Vendor Name */}
        <div>
          <label className="block text-xs font-bold text-stone-300 mb-1">
            Vendor / Company Name <span className="text-amber-400">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Shree Traders, R.K. Transport"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-sm font-bold text-stone-100 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Category & Contact Person */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-stone-300 mb-1">Supply Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
            >
              {DEFAULT_VENDOR_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-300 mb-1">Contact Person</label>
            <input
              type="text"
              placeholder="e.g. Amit Sharma (Manager)"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Mobile & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-stone-300 mb-1">Phone / WhatsApp</label>
            <input
              type="tel"
              placeholder="e.g. 9876543210"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-300 mb-1">Email (Optional)</label>
            <input
              type="email"
              placeholder="e.g. info@shreetraders.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* GSTIN & Address */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-stone-300 mb-1">GSTIN Number (Optional)</label>
            <input
              type="text"
              placeholder="e.g. 27AAAAA0000A1Z5"
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-stone-100 uppercase focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-300 mb-1">Office / Yard Address (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Plot 12, Industrial Area"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold text-stone-300 mb-1">Notes / Terms (Optional)</label>
          <textarea
            rows={2}
            placeholder="e.g. 30-day payment terms, credit limit ₹2,00,000"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-stone-950 text-base font-extrabold rounded-xl transition-all shadow-lg text-center disabled:opacity-50"
        >
          {submitting ? 'Saving Vendor...' : 'Save Vendor ✓'}
        </button>
      </form>
    </div>
  );
}
