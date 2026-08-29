'use client';

import { useState, useEffect } from 'react';
import { DEFAULT_VENDOR_CATEGORIES } from '@/lib/constants/vendorCategories';

interface VendorModalProps {
  isOpen: boolean;
  vendorToEdit?: any | null;
  onClose: () => void;
  onSuccess: (vendor: any) => void;
}

export default function VendorModal({ isOpen, vendorToEdit, onClose, onSuccess }: VendorModalProps) {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [category, setCategory] = useState('Cement / Steel');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (vendorToEdit) {
      setName(vendorToEdit.name || '');
      setMobile(vendorToEdit.mobile || '');
      setCategory(vendorToEdit.category || 'Cement / Steel');
      setAddress(vendorToEdit.address || '');
    } else {
      setName('');
      setMobile('');
      setCategory('Cement / Steel');
      setAddress('');
    }
  }, [vendorToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vendor name is required');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const url = vendorToEdit ? `/api/vendors/${vendorToEdit._id}` : '/api/vendors';
      const method = vendorToEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          mobile: mobile.trim(),
          category,
          address: address.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || `Failed to ${vendorToEdit ? 'update' : 'add'} vendor`);
      }

      setName('');
      setMobile('');
      setAddress('');
      onSuccess(data.data);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-4 pb-6 sm:pb-4">
      <div className="w-full sm:max-w-md bg-white border border-slate-200 rounded-2xl p-6 max-h-[85vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>🚚</span> {vendorToEdit ? 'Edit Vendor / Supplier' : 'Add Vendor / Supplier'}
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors font-bold"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
              Vendor / Business Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Shree Ram Traders"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#087F3E] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
              Mobile Number
            </label>
            <input
              type="tel"
              placeholder="e.g. 9876543210"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#087F3E] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-[#087F3E]"
            >
              {DEFAULT_VENDOR_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-11 rounded-xl bg-[#087F3E] hover:bg-[#056B34] disabled:opacity-50 text-white text-sm font-extrabold transition-colors flex items-center justify-center gap-2 shadow"
            >
              {loading ? 'Saving...' : 'Save Vendor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
