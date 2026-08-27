'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useProject } from '@/lib/context/ProjectContext';
import { DEFAULT_VENDOR_CATEGORIES } from '@/lib/constants/vendorCategories';

interface VendorListItem {
  _id: string;
  name: string;
  contactPerson?: string;
  mobile?: string;
  category: string;
  outstandingAmount: number;
  advanceAmount: number;
  vendorStatus: 'DUE' | 'ADVANCE' | 'SETTLED';
}

export default function VendorsListPage() {
  const { activeProject } = useProject();

  const [vendors, setVendors] = useState<VendorListItem[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | 'DUE' | 'ADVANCE' | 'SETTLED'>('ALL');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVendors();
  }, [activeProject?._id, activeTab, categoryFilter]);

  const loadVendors = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeProject?._id) params.set('projectId', activeProject._id);
    if (categoryFilter !== 'ALL') params.set('category', categoryFilter);
    if (activeTab !== 'ALL') params.set('statusTab', activeTab);

    fetch(`/api/vendors?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.data) setVendors(d.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const filteredVendors = vendors.filter((v) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      v.name.toLowerCase().includes(q) ||
      (v.contactPerson && v.contactPerson.toLowerCase().includes(q)) ||
      (v.mobile && v.mobile.toLowerCase().includes(q)) ||
      v.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-900 border border-stone-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏬</span>
            <h1 className="text-xl font-bold text-stone-100">Vendor Management</h1>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Supplier directory, outstanding balances, bills & transaction ledgers for{' '}
            <span className="text-amber-400 font-semibold">{activeProject?.name || 'All Sites'}</span>.
          </p>
        </div>

        <Link
          href="/vendors/add"
          className="px-5 h-12 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2 shrink-0 self-start sm:self-auto"
        >
          <span>+</span> Add Vendor
        </Link>
      </div>

      {/* Filter Bar & Tabs */}
      <div className="bg-stone-900 border border-stone-800 p-4 rounded-2xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex bg-stone-950 p-1 rounded-xl gap-1 border border-stone-800">
            {(['ALL', 'DUE', 'ADVANCE', 'SETTLED'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === t
                    ? 'bg-amber-500 text-stone-950 shadow'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Categories</option>
            {DEFAULT_VENDOR_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search vendor name, contact person, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Vendor Cards List */}
      {loading ? (
        <div className="text-center py-12 text-xs text-stone-500">Loading vendor profiles...</div>
      ) : filteredVendors.length === 0 ? (
        <div className="bg-stone-900 border border-stone-800 p-8 rounded-2xl text-center space-y-3">
          <div className="text-3xl">🏬</div>
          <h3 className="text-sm font-bold text-stone-200">No vendors found</h3>
          <p className="text-xs text-stone-400">Add suppliers to track bills, payments, and outstanding balances.</p>
          <Link
            href="/vendors/add"
            className="inline-block px-4 py-2 bg-amber-500 text-stone-950 text-xs font-bold rounded-xl"
          >
            + Add Vendor
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredVendors.map((v) => (
            <Link
              key={v._id}
              href={`/vendors/${v._id}`}
              className="p-5 rounded-2xl bg-stone-900 hover:bg-stone-800/80 border border-stone-800 text-left transition-all shadow-lg flex flex-col justify-between group space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-base font-extrabold text-stone-100 group-hover:text-amber-400 transition-colors">
                    {v.name}
                  </div>
                  <div className="text-xs text-stone-400">
                    {v.category} {v.contactPerson ? `• ${v.contactPerson}` : ''}
                  </div>
                  {v.mobile && (
                    <div className="text-[11px] text-stone-500">📞 {v.mobile}</div>
                  )}
                </div>

                {/* Status Badge */}
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase shrink-0 ${
                    v.vendorStatus === 'DUE'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : v.vendorStatus === 'ADVANCE'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {v.vendorStatus}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-stone-800/80 pt-3 text-xs">
                <div>
                  <span className="text-stone-400 text-[11px] block">Outstanding Due</span>
                  <span
                    className={`text-base font-black ${
                      v.outstandingAmount > 0 ? 'text-amber-400' : 'text-stone-400'
                    }`}
                  >
                    ₹{v.outstandingAmount.toLocaleString('en-IN')}
                  </span>
                </div>

                {v.advanceAmount > 0 && (
                  <div className="text-right">
                    <span className="text-purple-400 text-[11px] block font-semibold">Advance</span>
                    <span className="text-sm font-bold text-purple-300">
                      ₹{v.advanceAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
