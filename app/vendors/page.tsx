'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useProject } from '@/lib/context/ProjectContext';
import { DEFAULT_VENDOR_CATEGORIES } from '@/lib/constants/vendorCategories';

import VendorModal from '@/components/VendorModal';
import ConfirmModal from '@/components/ConfirmModal';

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
    <div className="space-y-3 pb-20 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-row items-center justify-between gap-2 bg-white border border-slate-200 p-3 rounded-xl shadow-2xs">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg">🏬</span>
            <h1 className="text-base font-extrabold text-slate-900">Vendor Management</h1>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Suppliers, outstanding balances & ledgers for <span className="text-[#087F3E] font-semibold">{activeProject?.name || 'All Sites'}</span>.
          </p>
        </div>

        <button
          onClick={() => {
            setVendorToEdit(null);
            setIsVendorModalOpen(true);
          }}
          className="px-3 h-8 bg-[#087F3E] hover:bg-[#056B34] text-white text-[11px] font-bold rounded-lg transition-colors shadow-2xs flex items-center justify-center gap-1 shrink-0"
        >
          <span>+</span> Add Vendor
        </button>
      </div>

      {/* Filter Bar & Tabs */}
      <div className="bg-white border border-slate-200 p-3 rounded-xl space-y-2.5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {/* Status Tabs */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg gap-1 border border-slate-200">
            {(['ALL', 'DUE', 'ADVANCE', 'SETTLED'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-2 py-1 rounded-md text-[10px] font-bold transition-colors ${
                  activeTab === t
                    ? 'bg-[#087F3E] text-white shadow-2xs'
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
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:border-[#087F3E]"
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
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#087F3E]"
        />
      </div>

      {/* Vendor Cards List */}
      {loading ? (
        <div className="text-center py-8 text-xs text-slate-500">Loading vendor profiles...</div>
      ) : filteredVendors.length === 0 ? (
        <div className="bg-white border border-slate-200 p-6 rounded-xl text-center space-y-2 shadow-2xs">
          <div className="text-2xl">🏬</div>
          <h3 className="text-xs font-extrabold text-slate-900">No vendors found</h3>
          <p className="text-[11px] text-slate-500">Add suppliers to track bills, payments, and outstanding balances.</p>
          <button
            onClick={() => {
              setVendorToEdit(null);
              setIsVendorModalOpen(true);
            }}
            className="inline-block px-3 py-1.5 bg-[#087F3E] text-white text-xs font-bold rounded-lg"
          >
            + Add Vendor
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {filteredVendors.map((v) => (
            <div
              key={v._id}
              className="p-2.5 rounded-xl bg-white border border-slate-200 text-left shadow-2xs flex flex-col gap-1.5"
            >
              {/* Header Row */}
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <Link
                    href={`/vendors/${v._id}`}
                    className="text-xs font-extrabold text-slate-900 hover:text-[#087F3E] transition-colors truncate"
                  >
                    {v.name}
                  </Link>
                  <span
                    className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase shrink-0 ${
                      v.vendorStatus === 'DUE'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : v.vendorStatus === 'ADVANCE'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : 'bg-[#EAF7EF] text-[#056B34] border border-[#bce6cb]'
                    }`}
                  >
                    {v.vendorStatus}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => {
                      setVendorToEdit(v);
                      setIsVendorModalOpen(true);
                    }}
                    className="p-0.5 text-slate-400 hover:text-slate-700 text-xs font-bold"
                    title="Edit Vendor"
                  >
                    ✏️
                  </button>

                  <button
                    onClick={() => setVendorToDelete(v)}
                    className="p-0.5 text-slate-400 hover:text-red-600 text-xs font-bold"
                    title="Delete Vendor"
                  >
                    🗑️
                  </button>

                  <Link
                    href={`/vendors/${v._id}`}
                    className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] rounded-md transition-colors"
                  >
                    Ledger →
                  </Link>
                </div>
              </div>

              {/* Subline Details & Financial Summary */}
              <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100/80 text-[10px]">
                <div className="text-slate-500 truncate">
                  {v.category} {v.mobile ? `· 📞 ${v.mobile}` : ''}
                </div>

                <div className="shrink-0 text-right">
                  <span className="text-slate-400 font-medium">Due: </span>
                  <strong
                    className={`text-xs font-black ${
                      v.outstandingAmount > 0 ? 'text-amber-600' : 'text-slate-700'
                    }`}
                  >
                    ₹{v.outstandingAmount.toLocaleString('en-IN')}
                  </strong>
                </div>
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
  );
}

