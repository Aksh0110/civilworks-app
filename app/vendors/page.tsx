'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useProject } from '@/lib/context/ProjectContext';
import { DEFAULT_VENDOR_CATEGORIES } from '@/lib/constants/vendorCategories';

import VendorModal from '@/components/VendorModal';
import ConfirmModal from '@/components/ConfirmModal';
import ModuleGuard from '@/components/ModuleGuard';

interface VendorListItem {
  _id: string;
  name: string;
  contactPerson?: string;
  mobile?: string;
  category: string;
  outstandingAmount: number;
  advanceAmount: number;
  vendorStatus: 'DUE' | 'ADVANCE' | 'SETTLED';
  address?: string;
}

export default function VendorsListPage() {
  const { activeProject } = useProject();

  const [vendors, setVendors] = useState<VendorListItem[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | 'DUE' | 'ADVANCE' | 'SETTLED'>('ALL');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Edit / Delete State
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [vendorToEdit, setVendorToEdit] = useState<VendorListItem | null>(null);
  const [vendorToDelete, setVendorToDelete] = useState<VendorListItem | null>(null);

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

  const handleDeleteVendor = async () => {
    if (!vendorToDelete) return;
    const res = await fetch(`/api/vendors/${vendorToDelete._id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Failed to delete vendor');
    }
    loadVendors();
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
    <ModuleGuard module="vendors">
      <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏬</span>
            <h1 className="text-xl font-bold text-slate-900">Vendor Management</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Supplier directory, outstanding balances, bills & transaction ledgers for{' '}
            <span className="text-[#087F3E] font-semibold">{activeProject?.name || 'All Sites'}</span>.
          </p>
        </div>

        <button
          onClick={() => {
            setVendorToEdit(null);
            setIsVendorModalOpen(true);
          }}
          className="px-5 h-12 bg-[#087F3E] hover:bg-[#056B34] text-white text-xs font-bold rounded-xl transition-colors shadow flex items-center justify-center gap-2 shrink-0 self-start sm:self-auto"
        >
          <span>+</span> Add Vendor
        </button>
      </div>

      {/* Filter Bar & Tabs */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-3 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1 border border-slate-200">
            {(['ALL', 'DUE', 'ADVANCE', 'SETTLED'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === t
                    ? 'bg-[#087F3E] text-white shadow'
                    : 'text-slate-600 hover:text-slate-900'
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
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#087F3E]"
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
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#087F3E]"
        />
      </div>

      {/* Vendor Cards List */}
      {loading ? (
        <div className="text-center py-12 text-xs text-slate-500">Loading vendor profiles...</div>
      ) : filteredVendors.length === 0 ? (
        <div className="bg-white border border-slate-200 p-8 rounded-2xl text-center space-y-3 shadow-sm">
          <div className="text-3xl">🏬</div>
          <h3 className="text-sm font-bold text-slate-900">No vendors found</h3>
          <p className="text-xs text-slate-500">Add suppliers to track bills, payments, and outstanding balances.</p>
          <button
            onClick={() => {
              setVendorToEdit(null);
              setIsVendorModalOpen(true);
            }}
            className="inline-block px-4 py-2 bg-[#087F3E] text-white text-xs font-bold rounded-xl"
          >
            + Add Vendor
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredVendors.map((v) => (
            <div
              key={v._id}
              className="p-5 rounded-2xl bg-white border border-slate-200 text-left shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <Link
                    href={`/vendors/${v._id}`}
                    className="text-base font-bold text-slate-900 hover:text-[#087F3E] transition-colors block"
                  >
                    {v.name}
                  </Link>
                  <div className="text-xs text-slate-500">
                    {v.category} {v.contactPerson ? `• ${v.contactPerson}` : ''}
                  </div>
                  {v.mobile && (
                    <div className="text-[11px] text-slate-400">📞 {v.mobile}</div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase shrink-0 ${
                      v.vendorStatus === 'DUE'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : v.vendorStatus === 'ADVANCE'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : 'bg-[#EAF7EF] text-[#056B34] border border-[#bce6cb]'
                    }`}
                  >
                    {v.vendorStatus}
                  </span>

                  <button
                    onClick={() => {
                      setVendorToEdit(v);
                      setIsVendorModalOpen(true);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-700 text-xs font-bold"
                    title="Edit Vendor"
                  >
                    ✏️
                  </button>

                  <button
                    onClick={() => setVendorToDelete(v)}
                    className="p-1 text-slate-400 hover:text-red-600 text-xs font-bold"
                    title="Delete Vendor"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] block">Outstanding Due</span>
                  <span
                    className={`text-base font-black ${
                      v.outstandingAmount > 0 ? 'text-amber-600' : 'text-slate-400'
                    }`}
                  >
                    ₹{v.outstandingAmount.toLocaleString('en-IN')}
                  </span>
                </div>

                <Link
                  href={`/vendors/${v._id}`}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                >
                  Profile & Ledger →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vendor Edit/Create Modal */}
      <VendorModal
        isOpen={isVendorModalOpen}
        vendorToEdit={vendorToEdit}
        onClose={() => {
          setIsVendorModalOpen(false);
          setVendorToEdit(null);
        }}
        onSuccess={loadVendors}
      />

      {/* Delete Vendor Confirmation Modal */}
      <ConfirmModal
        isOpen={!!vendorToDelete}
        title="Delete Vendor Profile"
        message={`Are you sure you want to delete vendor "${vendorToDelete?.name}"?`}
        itemName={vendorToDelete?.name}
        warningText="Vendor profile will be removed."
        confirmText="Delete Vendor"
        onClose={() => setVendorToDelete(null)}
        onConfirm={handleDeleteVendor}
      />
    </div>
    </ModuleGuard>
  );
}

