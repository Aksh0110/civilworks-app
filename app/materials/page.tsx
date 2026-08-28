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
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📦</span>
            <h1 className="text-xl font-extrabold text-slate-900">Material Management</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track site receipts, material issuance, and live stock levels for{' '}
            <span className="text-[#087F3E] font-bold">{activeProject?.name || 'Selected Site'}</span>.
          </p>
        </div>

        <Link
          href="/materials/stock"
          className="inline-flex items-center justify-center gap-2 px-4 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors shrink-0 self-start sm:self-auto"
        >
          <span>📊</span> View All Stock
        </Link>
      </div>

      {/* Stock Alerts Widget */}
      {stockMetrics && stockMetrics.totalAttentionCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-lg font-bold shrink-0">
              ⚠️
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900">
                {stockMetrics.totalAttentionCount} Materials Need Attention
              </h3>
              <p className="text-xs text-amber-700">
                {stockMetrics.outOfStockCount > 0 && `${stockMetrics.outOfStockCount} Out of Stock · `}
                {stockMetrics.lowStockCount} Below Minimum Stock Threshold
              </p>
            </div>
          </div>

          <Link
            href="/materials/stock?status=LOW"
            className="px-3 py-2 bg-amber-500 text-slate-950 text-xs font-extrabold rounded-xl hover:bg-amber-400 transition-colors whitespace-nowrap shadow"
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
          className="group bg-white border border-slate-200 hover:border-[#087F3E] p-6 rounded-2xl transition-all duration-200 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-[#EAF7EF] text-[#056B34] border border-[#bce6cb] flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
              📥
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#EAF7EF] text-[#056B34]">
              Inward
            </span>
          </div>

          <div className="mt-4">
            <h2 className="text-lg font-bold text-slate-900 group-hover:text-[#087F3E] transition-colors">
              Receive Material
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Record new deliveries from vendors. Automatically increases project stock.
            </p>
          </div>

          <div className="mt-5 flex items-center text-xs font-bold text-[#087F3E] gap-1">
            <span>+ Start Inward Receipt</span>
            <span className="text-sm">→</span>
          </div>
        </Link>

        {/* Issue Material Action */}
        <Link
          href="/materials/issue"
          className="group bg-white border border-slate-200 hover:border-[#087F3E] p-6 rounded-2xl transition-all duration-200 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
              📤
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700">
              Outward
            </span>
          </div>

          <div className="mt-4">
            <h2 className="text-lg font-bold text-slate-900 group-hover:text-[#087F3E] transition-colors">
              Give Material
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Issue materials to work areas or sub-contractors. Automatically reduces stock.
            </p>
          </div>

          <div className="mt-5 flex items-center text-xs font-bold text-[#087F3E] gap-1">
            <span>- Start Material Issue</span>
            <span className="text-sm">→</span>
          </div>
        </Link>
      </div>

      {/* Secondary Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/materials/stock"
          className="bg-white border border-slate-200 p-4 rounded-2xl hover:border-slate-300 transition-colors shadow-sm flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-xl shrink-0">
            📊
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Stock Balance</h3>
            <p className="text-xs text-slate-500">Live balance & limits</p>
          </div>
        </Link>

        <Link
          href="/materials/master"
          className="bg-white border border-slate-200 p-4 rounded-2xl hover:border-slate-300 transition-colors shadow-sm flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center text-xl shrink-0">
            ⚙️
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Material Master</h3>
            <p className="text-xs text-slate-500">Add & edit materials</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
