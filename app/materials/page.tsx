'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useProject } from '@/lib/context/ProjectContext';

export default function MaterialsPage() {
  const { activeProject } = useProject();
  const [stockMetrics, setStockMetrics] = useState<{ lowStockCount: number; outOfStockCount: number; totalAttentionCount: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeProject?._id) return;
    setLoading(true);
    fetch(`/api/materials/stock?projectId=${activeProject._id}&metricsOnly=true`)
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          setStockMetrics(data.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [activeProject?._id]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-900 border border-stone-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📦</span>
            <h1 className="text-xl font-bold text-stone-100">Material Management</h1>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Track site receipts, material issuance, and live stock levels for{' '}
            <span className="text-amber-400 font-semibold">{activeProject?.name || 'Selected Site'}</span>.
          </p>
        </div>

        <Link
          href="/materials/stock"
          className="inline-flex items-center justify-center gap-2 px-4 h-10 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold transition-colors"
        >
          <span>📊</span> View All Stock
        </Link>
      </div>

      {/* Stock Alerts Widget */}
      {stockMetrics && stockMetrics.totalAttentionCount > 0 && (
        <div className="bg-amber-950/40 border border-amber-800/80 p-4 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-lg font-bold shrink-0">
              ⚠️
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-200">
                {stockMetrics.totalAttentionCount} Materials Need Attention
              </h3>
              <p className="text-xs text-amber-300/80">
                {stockMetrics.outOfStockCount > 0 && `${stockMetrics.outOfStockCount} Out of Stock · `}
                {stockMetrics.lowStockCount} Below Minimum Stock Threshold
              </p>
            </div>
          </div>

          <Link
            href="/materials/stock?status=LOW"
            className="px-3 py-2 bg-amber-500 text-stone-950 text-xs font-bold rounded-lg hover:bg-amber-400 transition-colors whitespace-nowrap"
          >
            Review Stock
          </Link>
        </div>
      )}

      {/* Primary Mobile Action Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Receive Material Action */}
        <Link
          href="/materials/receive"
          className="group bg-stone-900 border border-stone-800 hover:border-emerald-500/50 p-5 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-emerald-950/20 flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              📥
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300">
              Inward
            </span>
          </div>

          <div className="mt-4">
            <h2 className="text-lg font-bold text-stone-100 group-hover:text-emerald-400 transition-colors">
              Receive Material
            </h2>
            <p className="text-xs text-stone-400 mt-1">
              Record new deliveries from vendors. Automatically increases project stock.
            </p>
          </div>

          <div className="mt-5 flex items-center text-xs font-semibold text-emerald-400 gap-1">
            <span>+ Start Inward Receipt</span>
            <span className="text-sm">→</span>
          </div>
        </Link>

        {/* Issue Material Action */}
        <Link
          href="/materials/issue"
          className="group bg-stone-900 border border-stone-800 hover:border-blue-500/50 p-5 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-blue-950/20 flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              📤
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300">
              Outward
            </span>
          </div>

          <div className="mt-4">
            <h2 className="text-lg font-bold text-stone-100 group-hover:text-blue-400 transition-colors">
              Give Material
            </h2>
            <p className="text-xs text-stone-400 mt-1">
              Issue materials to work areas or sub-contractors. Automatically reduces stock.
            </p>
          </div>

          <div className="mt-5 flex items-center text-xs font-semibold text-blue-400 gap-1">
            <span>- Start Material Issue</span>
            <span className="text-sm">→</span>
          </div>
        </Link>
      </div>

      {/* Secondary Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/materials/stock"
          className="bg-stone-900 border border-stone-800 p-4 rounded-2xl hover:border-stone-700 transition-colors flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-xl shrink-0">
            📊
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-200">Stock Balance</h3>
            <p className="text-xs text-stone-500">Live balance & limits</p>
          </div>
        </Link>

        <Link
          href="/materials/master"
          className="bg-stone-900 border border-stone-800 p-4 rounded-2xl hover:border-stone-700 transition-colors flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-xl shrink-0">
            ⚙️
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-200">Material Master</h3>
            <p className="text-xs text-stone-500">Add & edit materials</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
