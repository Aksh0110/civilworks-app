'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useProject } from '@/lib/context/ProjectContext';

interface TimelineEntry {
  id: string;
  type: 'INWARD' | 'ISSUE' | 'ADJUSTMENT';
  date: string;
  change: string;
  quantity: number;
  unit: string;
  description: string;
  subtext?: string;
}

export default function MaterialDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: materialId } = use(params);
  const { activeProject } = useProject();

  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Stock Adjustment Modal state
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjType, setAdjType] = useState<'ADD' | 'SUBTRACT' | 'SET'>('SET');
  const [adjQty, setAdjQty] = useState('');
  const [adjReason, setAdjReason] = useState('');
  const [adjLoading, setAdjLoading] = useState(false);

  useEffect(() => {
    if (!activeProject?._id || !materialId) return;
    loadDetail();
  }, [activeProject?._id, materialId]);

  const loadDetail = () => {
    if (!activeProject?._id) return;
    setLoading(true);
    fetch(`/api/materials/stock/${materialId}?projectId=${activeProject._id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.data) setDetail(d.data);
        else setError(d.message || 'Material detail not found');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjQty || !adjReason.trim()) return;
    setAdjLoading(true);

    try {
      const res = await fetch('/api/materials/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: activeProject?._id,
          materialId,
          adjustmentType: adjType,
          quantity: parseFloat(adjQty),
          reason: adjReason.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Adjustment failed');

      setIsAdjustModalOpen(false);
      setAdjQty('');
      setAdjReason('');
      loadDetail();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAdjLoading(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-slate-500 text-sm">Loading material history timeline...</div>;
  }

  if (error || !detail) {
    return (
      <div className="max-w-lg mx-auto py-8 text-center space-y-4">
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
          {error || 'Material not found'}
        </div>
        <Link href="/materials/stock" className="inline-block px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl">
          ← Back to Stock
        </Link>
      </div>
    );
  }

  const { material, currentStock, status, timeline } = detail;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      {/* Top Navigation */}
      <div className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/materials/stock"
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-sm transition-colors font-bold"
          >
            ←
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-900">{material.name}</h1>
            <p className="text-xs text-slate-500">
              Category: <span className="text-[#087F3E] font-semibold">{material.category}</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAdjustModalOpen(true)}
          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors border border-slate-200"
        >
          More (Adjust)
        </button>
      </div>

      {/* Material Stock Balance Hero Card */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 block uppercase tracking-wider font-bold">Available Site Stock</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span
                className={`text-3xl font-black ${
                  currentStock <= 0 ? 'text-red-600' : status === 'LOW' ? 'text-amber-600' : 'text-[#087F3E]'
                }`}
              >
                {currentStock.toLocaleString('en-IN')}
              </span>
              <span className="text-sm font-semibold text-slate-600">{material.unit}</span>
            </div>
          </div>

          <span
            className={`text-xs px-3 py-1.5 rounded-full font-bold uppercase ${
              status === 'GOOD'
                ? 'bg-[#EAF7EF] text-[#056B34] border border-[#bce6cb]'
                : status === 'LOW'
                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {status === 'GOOD' ? 'Good Stock' : status === 'LOW' ? 'Low Stock' : 'Out of Stock'}
          </span>
        </div>

        <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-500 block">Minimum Warning Limit</span>
            <span className="text-slate-900 font-bold">{material.minStockLevel || 0} {material.unit}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Default Unit Rate</span>
            <span className="text-slate-900 font-bold">₹{material.defaultRate || 0} / {material.unit}</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="pt-2 flex gap-3">
          <Link
            href="/materials/receive"
            className="flex-1 h-11 bg-[#087F3E] hover:bg-[#056B34] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition-colors shadow"
          >
            <span>📥</span> Receive Material
          </Link>
          <Link
            href="/materials/issue"
            className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition-colors shadow"
          >
            <span>📤</span> Give Material
          </Link>
        </div>
      </div>

      {/* Transaction Timeline History */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Transaction History</h2>

        {timeline.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">No transactions recorded for this material yet.</div>
        ) : (
          <div className="space-y-3">
            {timeline.map((item: TimelineEntry) => (
              <div
                key={item.id}
                className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 ${
                      item.type === 'INWARD'
                        ? 'bg-[#EAF7EF] text-[#056B34] border border-[#bce6cb]'
                        : item.type === 'ISSUE'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-purple-50 text-purple-700 border border-purple-200'
                    }`}
                  >
                    {item.type === 'INWARD' ? '📥' : item.type === 'ISSUE' ? '📤' : '⚙️'}
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{item.description}</h3>
                    <p className="text-[11px] text-slate-500">
                      {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {item.subtext ? ` · ${item.subtext}` : ''}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-sm font-black whitespace-nowrap ${
                    item.type === 'INWARD' ? 'text-[#087F3E]' : item.type === 'ISSUE' ? 'text-blue-700' : 'text-purple-700'
                  }`}
                >
                  {item.change}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stock Adjustment Modal */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 pb-6 sm:pb-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 max-h-[85vh] overflow-y-auto shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Stock Adjustment ({material.name})</h3>
              <button onClick={() => setIsAdjustModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleStockAdjustment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Adjustment Action</label>
                <select
                  value={adjType}
                  onChange={(e) => setAdjType(e.target.value as any)}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-[#087F3E]"
                >
                  <option value="SET">Set Fixed Stock Balance</option>
                  <option value="ADD">Add Stock (+)</option>
                  <option value="SUBTRACT">Subtract Stock (-)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Quantity ({material.unit})</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="e.g. 500"
                  value={adjQty}
                  onChange={(e) => setAdjQty(e.target.value)}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-[#087F3E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Reason / Note *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Physical site audit reconciliation"
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-[#087F3E]"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="flex-1 h-11 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjLoading}
                  className="flex-1 h-11 rounded-xl bg-[#087F3E] hover:bg-[#056B34] text-white text-xs font-bold shadow"
                >
                  {adjLoading ? 'Adjusting...' : 'Confirm Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
