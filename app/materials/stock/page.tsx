'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useProject } from '@/lib/context/ProjectContext';

interface StockItem {
  materialId: string;
  name: string;
  category: string;
  unit: string;
  minStockLevel: number;
  currentStock: number;
  status: 'GOOD' | 'LOW' | 'OUT_OF_STOCK';
}

export default function StockOverviewPage() {
  const { activeProject } = useProject();
  const [items, setItems] = useState<StockItem[]>([]);
  const [metrics, setMetrics] = useState<{ lowStockCount: number; outOfStockCount: number; totalAttentionCount: number } | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'GOOD' | 'LOW' | 'OUT_OF_STOCK'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/materials/categories')
      .then((r) => r.json())
      .then((d) => {
        if (d.data?.categories) setCategories(d.data.categories);
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

  const filteredItems = items.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/materials"
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-sm transition-colors font-bold"
          >
            ←
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>📊</span> Site Stock Overview
            </h1>
            <p className="text-xs text-slate-500">
              Site: <span className="text-[#087F3E] font-semibold">{activeProject?.name || 'Select Site'}</span>
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            href="/materials/receive"
            className="px-3.5 py-2 bg-[#087F3E] hover:bg-[#056B34] text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1 shadow"
          >
            <span>📥</span> Receive
          </Link>
          <Link
            href="/materials/issue"
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1 shadow"
          >
            <span>📤</span> Give
          </Link>
        </div>
      </div>

      {/* Metrics Bar */}
      {metrics && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-slate-200 p-3.5 rounded-2xl text-center shadow-sm">
            <span className="text-xs text-slate-500 block font-semibold">Total Materials</span>
            <span className="text-lg font-black text-slate-900">{items.length}</span>
          </div>

          <div
            onClick={() => setStatusFilter('LOW')}
            className="bg-white border border-amber-200 p-3.5 rounded-2xl text-center cursor-pointer hover:bg-amber-50 transition-colors shadow-sm"
          >
            <span className="text-xs text-amber-700 block font-semibold">Low Stock</span>
            <span className="text-lg font-black text-amber-700">{metrics.lowStockCount}</span>
          </div>

          <div
            onClick={() => setStatusFilter('OUT_OF_STOCK')}
            className="bg-white border border-red-200 p-3.5 rounded-2xl text-center cursor-pointer hover:bg-red-50 transition-colors shadow-sm"
          >
            <span className="text-xs text-red-700 block font-semibold">Out of Stock</span>
            <span className="text-lg font-black text-red-700">{metrics.outOfStockCount}</span>
          </div>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="space-y-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Search material name or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-[#087F3E]"
          />
          <span className="absolute left-3.5 top-3 text-slate-400 text-sm">🔍</span>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-3 text-xs text-slate-500 hover:text-slate-900"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
              statusFilter === 'ALL'
                ? 'bg-[#087F3E] text-white shadow'
                : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
            }`}
          >
            All Stock ({items.length})
          </button>
          <button
            onClick={() => setStatusFilter('GOOD')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
              statusFilter === 'GOOD'
                ? 'bg-[#087F3E] text-white shadow'
                : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
            }`}
          >
            🟢 Good Stock
          </button>
          <button
            onClick={() => setStatusFilter('LOW')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
              statusFilter === 'LOW'
                ? 'bg-amber-500 text-white shadow'
                : 'bg-white text-amber-700 border border-amber-200 hover:text-amber-800'
            }`}
          >
            ⚠️ Low Stock ({metrics?.lowStockCount || 0})
          </button>
          <button
            onClick={() => setStatusFilter('OUT_OF_STOCK')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
              statusFilter === 'OUT_OF_STOCK'
                ? 'bg-red-600 text-white shadow'
                : 'bg-white text-red-700 border border-red-200 hover:text-red-800'
            }`}
          >
            🚨 Out of Stock ({metrics?.outOfStockCount || 0})
          </button>
        </div>
      </div>

      {/* Material Stock List Cards */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 text-sm">Loading site stock balance...</div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white border border-slate-200 p-8 rounded-2xl text-center space-y-3 shadow-sm">
          <span className="text-3xl">📦</span>
          <h3 className="text-base font-bold text-slate-900">No Materials Match Filter</h3>
          <p className="text-xs text-slate-500">
            {search || statusFilter !== 'ALL'
              ? 'Try clearing your search or filter pills.'
              : 'Add materials to material master or receive deliveries.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredItems.map((item) => (
            <Link
              key={item.materialId}
              href={`/materials/stock/${item.materialId}`}
              className="group bg-white border border-slate-200 hover:border-[#087F3E] p-4 rounded-2xl transition-all duration-200 flex flex-col justify-between shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-[#087F3E] transition-colors">
                      {item.name}
                    </h3>
                    <span className="text-xs text-slate-500">{item.category}</span>
                  </div>

                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase shrink-0 ${
                      item.status === 'GOOD'
                        ? 'bg-[#EAF7EF] text-[#056B34] border border-[#bce6cb]'
                        : item.status === 'LOW'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    {item.status === 'GOOD' ? 'Good' : item.status === 'LOW' ? 'Low Stock' : 'Out of Stock'}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 block">Current Stock</span>
                  <span
                    className={`text-xl font-black ${
                      item.currentStock <= 0
                        ? 'text-red-600'
                        : item.status === 'LOW'
                        ? 'text-amber-600'
                        : 'text-slate-900'
                    }`}
                  >
                    {item.currentStock.toLocaleString('en-IN')} <span className="text-xs font-semibold text-slate-500">{item.unit}</span>
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-500 block">Min Threshold</span>
                  <span className="text-xs font-bold text-slate-600">
                    {item.minStockLevel || 0} {item.unit}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
