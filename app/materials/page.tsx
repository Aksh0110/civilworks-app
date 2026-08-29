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
    <div className="space-y-3 pb-12 max-w-4xl mx-auto">
      {/* Top Banner Header */}
      <div className="flex flex-row items-center justify-between gap-2 bg-white border border-slate-200 p-3 rounded-xl shadow-2xs">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg">📦</span>
            <h1 className="text-base font-extrabold text-slate-900">Material Management</h1>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Site receipts & stock levels for <span className="text-[#087F3E] font-bold">{activeProject?.name || 'Selected Site'}</span>.
          </p>
        </div>

        <Link
          href="/materials/stock"
          className="inline-flex items-center justify-center gap-1 px-3 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors shrink-0"
        >
          <span>📊</span> Stock
        </Link>
      </div>

      {/* Stock Alerts Widget */}
      {stockMetrics && stockMetrics.outOfStockCount > 0 && (
        <div className="bg-red-50 border border-red-200 p-2.5 rounded-xl flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="text-base">🚨</span>
            <div>
              <h3 className="text-xs font-bold text-red-900">
                {stockMetrics.outOfStockCount} Material(s) Out of Stock
              </h3>
              <p className="text-[10px] text-red-700">
                Receive new deliveries to replenish inventory.
              </p>
            </div>
          </div>

          <Link
            href="/materials/stock?status=OUT_OF_STOCK"
            className="px-2.5 py-1 bg-red-600 text-white text-[11px] font-extrabold rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap shadow-2xs"
          >
            Review
          </Link>
        </div>
      )}

      {/* Primary Mobile Action Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Receive Material Action */}
        <Link
          href="/materials/receive"
          className="group bg-white border border-slate-200 hover:border-[#087F3E] p-3 rounded-xl transition-all duration-200 shadow-2xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-[#EAF7EF] text-[#056B34] border border-[#bce6cb] flex items-center justify-center text-lg">
              📥
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EAF7EF] text-[#056B34]">
              Inward
            </span>
          </div>

          <div className="mt-2">
            <h2 className="text-xs font-extrabold text-slate-900 group-hover:text-[#087F3E] transition-colors">
              Receive Material
            </h2>
            <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
              Record new deliveries from vendors.
            </p>
          </div>

          <div className="mt-2 flex items-center text-[11px] font-bold text-[#087F3E] gap-1">
            <span>+ Inward Receipt</span>
            <span>→</span>
          </div>
        </Link>

        {/* Issue Material Action */}
        <Link
          href="/materials/issue"
          className="group bg-white border border-slate-200 hover:border-[#087F3E] p-3 rounded-xl transition-all duration-200 shadow-2xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center text-lg">
              📤
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
              Outward
            </span>
          </div>

          <div className="mt-2">
            <h2 className="text-xs font-extrabold text-slate-900 group-hover:text-[#087F3E] transition-colors">
              Give Material
            </h2>
            <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
              Issue materials to work areas.
            </p>
          </div>

          <div className="mt-2 flex items-center text-[11px] font-bold text-[#087F3E] gap-1">
            <span>- Issue Material</span>
            <span>→</span>
          </div>
        </Link>
      </div>

      {/* Secondary Actions */}
      <div className="grid grid-cols-2 gap-2.5">
        <Link
          href="/materials/stock"
          className="bg-white border border-slate-200 p-2.5 rounded-xl hover:border-slate-300 transition-colors shadow-2xs flex items-center gap-2.5"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center text-base shrink-0">
            📊
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs font-bold text-slate-900 truncate">Stock Balance</h3>
            <p className="text-[10px] text-slate-500 truncate">Live balance & limits</p>
          </div>
        </Link>

        <Link
          href="/materials/master"
          className="bg-white border border-slate-200 p-2.5 rounded-xl hover:border-slate-300 transition-colors shadow-2xs flex items-center gap-2.5"
        >
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center text-base shrink-0">
            ⚙️
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs font-bold text-slate-900 truncate">Material Master</h3>
            <p className="text-[10px] text-slate-500 truncate">Add & edit materials</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
