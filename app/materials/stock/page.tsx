'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useProject } from '@/lib/context/ProjectContext';
import MaterialModal from '@/components/MaterialModal';
import ConfirmModal from '@/components/ConfirmModal';

interface StockItem {
  materialId: string;
  name: string;
  category: string;
  unit: string;
  minStockLevel: number;
  currentStock: number;
  status: 'GOOD' | 'LOW' | 'OUT_OF_STOCK';
  defaultRate?: number;
}

export default function StockOverviewPage() {
  const { activeProject } = useProject();
  const [items, setItems] = useState<StockItem[]>([]);
  const [metrics, setMetrics] = useState<{ lowStockCount: number; outOfStockCount: number; totalAttentionCount: number } | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'GOOD' | 'LOW' | 'OUT_OF_STOCK'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [categories, setCategories] = useState<string[]>([]);
  const [units, setUnits] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit / Delete State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [materialToEdit, setMaterialToEdit] = useState<any>(null);
  const [materialToDelete, setMaterialToDelete] = useState<StockItem | null>(null);

  useEffect(() => {
    fetch('/api/materials/categories')
      .then((r) => r.json())
      .then((d) => {
        if (d.data?.categories) setCategories(d.data.categories);
        if (d.data?.units) setUnits(d.data.units);
      });
  }, []);

  useEffect(() => {
    if (!activeProject?._id) return;
    loadStock();
  }, [activeProject?._id, statusFilter, categoryFilter]);

  const loadStock = () => {
    if (!activeProject?._id) return;
    setLoading(true);
    let url = `/api/materials/stock?projectId=${activeProject._id}`;
    if (statusFilter !== 'ALL') url += `&status=${statusFilter}`;
    if (categoryFilter !== 'ALL') url += `&category=${encodeURIComponent(categoryFilter)}`;

    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        setItems(d.data || []);
        if (d.metrics) setMetrics(d.metrics);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleDeleteMaterial = async () => {
    if (!materialToDelete) return;
    const res = await fetch(`/api/materials/${materialToDelete.materialId}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Failed to delete material');
    }
    setMaterialToDelete(null);
    loadStock();
  };

  const filteredItems = items.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-3 pb-20 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-row items-center justify-between gap-2 bg-white border border-slate-200 p-3 rounded-xl shadow-2xs">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-lg">📊</span>
            <h1 className="text-base font-extrabold text-slate-900">Site Stock Overview</h1>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Site: <span className="text-[#087F3E] font-bold">{activeProject?.name || 'Select Site'}</span>
          </p>
        </div>

        <div className="flex gap-1.5 shrink-0">
          <Link
            href="/materials/receive"
            className="px-2.5 py-1.5 bg-[#087F3E] hover:bg-[#056B34] text-white text-xs font-extrabold rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
          >
            <span>📥</span> Receive
          </Link>
          <Link
            href="/materials/issue"
            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
          >
            <span>📤</span> Give
          </Link>
        </div>
      </div>

      {/* Metrics Summary */}
      {metrics && (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white border border-slate-200 p-2.5 rounded-xl text-center shadow-2xs">
            <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">Total Materials</span>
            <span className="text-sm font-black text-slate-900">{items.length}</span>
          </div>

          <div
            onClick={() => setStatusFilter('OUT_OF_STOCK')}
            className={`bg-white border p-2.5 rounded-xl text-center cursor-pointer transition-colors shadow-2xs ${
              metrics.outOfStockCount > 0 ? 'border-red-200 bg-red-50/50 hover:bg-red-50' : 'border-slate-200'
            }`}
          >
            <span className={`text-[10px] block font-bold uppercase tracking-wider ${metrics.outOfStockCount > 0 ? 'text-red-700' : 'text-slate-500'}`}>Out of Stock</span>
            <span className={`text-sm font-black ${metrics.outOfStockCount > 0 ? 'text-red-700' : 'text-slate-900'}`}>{metrics.outOfStockCount}</span>
          </div>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="space-y-2">
        <div className="relative">
          <input
            type="text"
            placeholder="Search material name or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 pl-8 text-xs text-slate-900 focus:outline-none focus:border-[#087F3E]"
          />
          <span className="absolute left-2.5 top-1.5 text-slate-400 text-xs">🔍</span>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1.5 text-[11px] text-slate-500 hover:text-slate-900 font-bold"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
              statusFilter === 'ALL'
                ? 'bg-[#087F3E] text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
            }`}
          >
            All Stock ({items.length})
          </button>
          <button
            onClick={() => setStatusFilter('GOOD')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
              statusFilter === 'GOOD'
                ? 'bg-[#087F3E] text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
            }`}
          >
            🟢 Available Stock
          </button>
          <button
            onClick={() => setStatusFilter('OUT_OF_STOCK')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
              statusFilter === 'OUT_OF_STOCK'
                ? 'bg-red-600 text-white shadow-2xs'
                : 'bg-white text-red-700 border border-red-200 hover:text-red-800'
            }`}
          >
            🚨 Out of Stock ({metrics?.outOfStockCount || 0})
          </button>
        </div>
      </div>

      {/* Material Stock List Cards */}
      {loading ? (
        <div className="py-8 text-center text-slate-500 text-xs font-medium">Loading site stock balance...</div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white border border-slate-200 p-6 rounded-xl text-center space-y-2 shadow-2xs">
          <span className="text-2xl">📦</span>
          <h3 className="text-xs font-bold text-slate-900">No Materials Match Filter</h3>
          <p className="text-[11px] text-slate-500">
            {search || statusFilter !== 'ALL'
              ? 'Try clearing your search or filter pills.'
              : 'Add materials to material master or receive deliveries.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {filteredItems.map((item) => (
            <div
              key={item.materialId}
              className="bg-white border border-slate-200 hover:border-[#087F3E] p-2.5 rounded-xl transition-all flex items-center justify-between gap-2 shadow-2xs group"
            >
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Link href={`/materials/stock/${item.materialId}`}>
                    <h3 className="text-xs font-extrabold text-slate-900 group-hover:text-[#087F3E] transition-colors truncate">
                      {item.name}
                    </h3>
                  </Link>
                  <span
                    className={`text-[9px] uppercase font-black px-1.5 py-0.2 rounded-full shrink-0 ${
                      item.currentStock > 0
                        ? 'bg-[#EAF7EF] text-[#056B34] border border-[#bce6cb]'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    {item.currentStock > 0 ? 'Available' : 'Out of Stock'}
                  </span>
                </div>

                <div className="text-[10px] text-slate-500 truncate">{item.category}</div>

                <div className="text-xs font-black pt-0.5">
                  <span className="text-[10px] font-semibold text-slate-400 mr-1">Current Stock:</span>
                  <span className={item.currentStock <= 0 ? 'text-red-600' : 'text-slate-900'}>
                    {item.currentStock.toLocaleString('en-IN')} <span className="text-[10px] font-bold text-slate-500">{item.unit}</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setMaterialToEdit({
                      _id: item.materialId,
                      name: item.name,
                      category: item.category,
                      unit: item.unit,
                      defaultRate: item.defaultRate || 0
                    });
                    setIsModalOpen(true);
                  }}
                  className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-900 text-xs transition-colors"
                  title="Edit Material"
                >
                  ✏️
                </button>

                <button
                  type="button"
                  onClick={() => setMaterialToDelete(item)}
                  className="p-1.5 bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-lg text-slate-400 hover:text-red-600 text-xs transition-colors"
                  title="Delete Material"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <MaterialModal
        isOpen={isModalOpen}
        materialToEdit={materialToEdit}
        onClose={() => {
          setIsModalOpen(false);
          setMaterialToEdit(null);
        }}
        onSuccess={() => loadStock()}
        categories={categories}
        units={units}
      />

      <ConfirmModal
        isOpen={!!materialToDelete}
        title="Delete Material Item"
        message={`Are you sure you want to delete material "${materialToDelete?.name}"?`}
        itemName={materialToDelete ? `${materialToDelete.name} (${materialToDelete.category})` : undefined}
        warningText="Material definition will be removed from master catalog."
        confirmText="Delete Material"
        onClose={() => setMaterialToDelete(null)}
        onConfirm={handleDeleteMaterial}
      />
    </div>
  );
}
