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
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-900 border border-stone-800 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <Link
            href="/materials"
            className="w-9 h-9 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center text-sm transition-colors"
          >
            ←
          </Link>
          <div>
            <h1 className="text-lg font-bold text-stone-100 flex items-center gap-2">
              <span>📊</span> Site Stock Overview
            </h1>
            <p className="text-xs text-stone-400">
              Site: <span className="text-amber-400 font-semibold">{activeProject?.name || 'Select Site'}</span>
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            href="/materials/receive"
            className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
          >
            <span>📥</span> Receive
          </Link>
          <Link
            href="/materials/issue"
            className="px-3 py-2 bg-blue-500 hover:bg-blue-400 text-stone-950 text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
          >
            <span>📤</span> Give
          </Link>
        </div>
      </div>

      {/* Metrics Bar */}
      {metrics && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-stone-900 border border-stone-800 p-3.5 rounded-xl text-center">
            <span className="text-xs text-stone-400 block">Total Materials</span>
            <span className="text-lg font-bold text-stone-100">{items.length}</span>
          </div>

          <div
            onClick={() => setStatusFilter('LOW')}
            className="bg-stone-900 border border-amber-800/60 p-3.5 rounded-xl text-center cursor-pointer hover:bg-amber-950/20 transition-colors"
          >
            <span className="text-xs text-amber-400 block">Low Stock</span>
            <span className="text-lg font-bold text-amber-300">{metrics.lowStockCount}</span>
          </div>

          <div
            onClick={() => setStatusFilter('OUT_OF_STOCK')}
            className="bg-stone-900 border border-red-800/60 p-3.5 rounded-xl text-center cursor-pointer hover:bg-red-950/20 transition-colors"
          >
            <span className="text-xs text-red-400 block">Out of Stock</span>
            <span className="text-lg font-bold text-red-300">{metrics.outOfStockCount}</span>
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
            className="w-full h-11 pl-10 pr-4 bg-stone-900 border border-stone-800 rounded-xl text-stone-100 text-sm placeholder-stone-600 focus:outline-none focus:border-amber-500"
          />
          <span className="absolute left-3.5 top-3 text-stone-500 text-sm">🔍</span>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-3 text-xs text-stone-400 hover:text-stone-200"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
              statusFilter === 'ALL'
                ? 'bg-amber-500 text-stone-950'
                : 'bg-stone-900 text-stone-400 border border-stone-800 hover:text-stone-200'
            }`}
          >
            All Stock ({items.length})
          </button>
          <button
            onClick={() => setStatusFilter('GOOD')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
              statusFilter === 'GOOD'
                ? 'bg-emerald-500 text-stone-950'
                : 'bg-stone-900 text-stone-400 border border-stone-800 hover:text-stone-200'
            }`}
          >
            🟢 Good Stock
          </button>
          <button
            onClick={() => setStatusFilter('LOW')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
              statusFilter === 'LOW'
                ? 'bg-amber-500 text-stone-950'
                : 'bg-stone-900 text-amber-400 border border-amber-900/60 hover:text-amber-300'
            }`}
          >
            ⚠️ Low Stock ({metrics?.lowStockCount || 0})
          </button>
          <button
            onClick={() => setStatusFilter('OUT_OF_STOCK')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
              statusFilter === 'OUT_OF_STOCK'
                ? 'bg-red-500 text-stone-950'
                : 'bg-stone-900 text-red-400 border border-red-900/60 hover:text-red-300'
            }`}
          >
            🚨 Out of Stock ({metrics?.outOfStockCount || 0})
          </button>
        </div>
      </div>

      {/* Material Stock List Cards */}
      {loading ? (
        <div className="py-12 text-center text-stone-500 text-sm">Loading site stock balance...</div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-stone-900 border border-stone-800 p-8 rounded-2xl text-center space-y-3">
          <span className="text-3xl">📦</span>
          <h3 className="text-base font-bold text-stone-200">No Materials Match Filter</h3>
          <p className="text-xs text-stone-500">
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
              className="group bg-stone-900 border border-stone-800 hover:border-amber-500/50 p-4 rounded-2xl transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-stone-100 group-hover:text-amber-400 transition-colors">
                      {item.name}
                    </h3>
                    <span className="text-xs text-stone-500">{item.category}</span>
                  </div>

                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-bold border flex items-center gap-1 shrink-0 ${
                      item.status === 'GOOD'
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                        : item.status === 'LOW'
                        ? 'bg-amber-950/80 text-amber-300 border-amber-800 animate-pulse'
                        : 'bg-red-950/80 text-red-300 border-red-800'
                    }`}
                  >
                    <span>{item.status === 'GOOD' ? '🟢' : item.status === 'LOW' ? '⚠️' : '🚨'}</span>
                    <span>{item.status === 'GOOD' ? 'Good' : item.status === 'LOW' ? 'Low Stock' : 'Out of Stock'}</span>
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-stone-500 block">Current Stock</span>
                  <span
                    className={`text-xl font-extrabold ${
                      item.currentStock <= 0
                        ? 'text-red-400'
                        : item.status === 'LOW'
                        ? 'text-amber-400'
                        : 'text-stone-100'
                    }`}
                  >
                    {item.currentStock.toLocaleString('en-IN')} <span className="text-xs font-semibold text-stone-400">{item.unit}</span>
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-xs text-stone-500 block">Min Threshold</span>
                  <span className="text-xs font-bold text-stone-400">
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
