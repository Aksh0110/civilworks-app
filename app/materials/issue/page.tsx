'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useProject } from '@/lib/context/ProjectContext';

interface MaterialStockOption {
  _id: string;
  name: string;
  category: string;
  unit: string;
  minStockLevel?: number;
  currentStock: number;
  stockStatus: string;
}

export default function IssueMaterialPage() {
  const { activeProject } = useProject();
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [materials, setMaterials] = useState<MaterialStockOption[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [locationWorkArea, setLocationWorkArea] = useState('');
  const [issuedTo, setIssuedTo] = useState('');
  const [remarks, setRemarks] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Success state
  const [successResult, setSuccessResult] = useState<any>(null);

  useEffect(() => {
    if (!activeProject?._id) return;
    setLoading(true);
    fetch(`/api/materials?projectId=${activeProject._id}`)
      .then((r) => r.json())
      .then((d) => setMaterials(d.data || []))
      .finally(() => setLoading(false));
  }, [activeProject?._id]);

  const selectedMaterial = materials.find((m) => m._id === selectedMaterialId);
  const availableStock = selectedMaterial ? selectedMaterial.currentStock : 0;
  const numericQty = parseFloat(quantity) || 0;
  const isInsufficient = selectedMaterial && numericQty > availableStock;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject?._id) {
      setError('Please select an active project.');
      return;
    }
    if (!selectedMaterialId) {
      setError('Please select a material to issue.');
      return;
    }
    if (numericQty <= 0) {
      setError('Please enter a valid positive quantity.');
      return;
    }
    if (isInsufficient) {
      setError(`Cannot issue ${numericQty} ${selectedMaterial?.unit}. Available stock is only ${availableStock} ${selectedMaterial?.unit}.`);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/materials/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: activeProject._id,
          date,
          locationWorkArea: locationWorkArea.trim() || undefined,
          issuedTo: issuedTo.trim() || undefined,
          remarks: remarks.trim() || undefined,
          items: [
            {
              materialId: selectedMaterialId,
              quantity: numericQty
            }
          ]
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to issue material.');
      }

      setSuccessResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (successResult) {
    return (
      <div className="max-w-lg mx-auto py-6 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-2xl text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-3xl mx-auto font-black shadow">
            ✓
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-blue-950">Material Issued Successfully!</h2>
            <p className="text-xs text-slate-600 mt-1">
              Stock balance has been automatically reduced for{' '}
              <span className="font-bold text-slate-900">{activeProject?.name}</span>.
            </p>
          </div>
        </div>

        {/* Issue Summary Card */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Issue Summary</h3>

          <div className="divide-y divide-slate-100">
            {successResult.updatedStockList?.map((item: any) => (
              <div key={item.materialId} className="py-3 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{item.materialName}</h4>
                  <span className="text-xs text-slate-500">
                    Remaining Stock: <strong className="text-[#087F3E]">{item.currentStock} {item.unit}</strong>
                  </span>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                    item.status === 'GOOD'
                      ? 'bg-[#EAF7EF] text-[#056B34] border border-[#bce6cb]'
                      : item.status === 'LOW'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>

          {(locationWorkArea || issuedTo) && (
            <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
              {locationWorkArea && <div>Location / Work Area: <strong className="text-slate-900">{locationWorkArea}</strong></div>}
              {issuedTo && <div>Issued To: <strong className="text-slate-900">{issuedTo}</strong></div>}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              setSuccessResult(null);
              setSelectedMaterialId('');
              setQuantity('');
              setLocationWorkArea('');
              setIssuedTo('');
            }}
            className="flex-1 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
          >
            + Give Another Material
          </button>
          <Link
            href="/materials/stock"
            className="flex-1 h-12 rounded-xl bg-[#087F3E] hover:bg-[#056B34] text-white text-xs font-bold transition-colors flex items-center justify-center shadow"
          >
            View Live Stock →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-20">
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/materials"
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-sm transition-colors font-bold"
          >
            ←
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>📤</span> Give Material (Outward)
            </h1>
            <p className="text-xs text-slate-500">
              Site: <span className="text-[#087F3E] font-semibold">{activeProject?.name || 'Select Site'}</span>
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-3">
          <span className="text-lg">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#087F3E]">Issue Material Details</h2>

          {/* Issue Date */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Issue Date *</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-[#087F3E]"
            />
          </div>

          {/* Select Material with Live Balance */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Select Material *</label>
            <select
              required
              value={selectedMaterialId}
              onChange={(e) => {
                setSelectedMaterialId(e.target.value);
                setError('');
              }}
              className="w-full h-12 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-[#087F3E] font-medium"
            >
              <option value="">-- Choose Material from Site Stock --</option>
              {materials.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name} — Current Stock: {m.currentStock} {m.unit} ({m.stockStatus})
                </option>
              ))}
            </select>
          </div>

          {/* Live Available Balance Indicator */}
          {selectedMaterial && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">Available Stock Balance:</span>
              <span
                className={`text-sm font-bold ${
                  availableStock <= 0 ? 'text-red-600' : availableStock < (selectedMaterial.minStockLevel || 0) ? 'text-amber-600' : 'text-[#087F3E]'
                }`}
              >
                {availableStock} {selectedMaterial.unit}
              </span>
            </div>
          )}

          {/* Quantity Input */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
              Quantity to Issue {selectedMaterial ? `(${selectedMaterial.unit})` : ''} *
            </label>
            <input
              type="number"
              step="any"
              min="0.01"
              required
              placeholder="e.g. 100"
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value);
                setError('');
              }}
              className={`w-full h-12 px-4 bg-slate-50 border text-slate-900 text-base font-bold rounded-xl placeholder-slate-400 focus:outline-none ${
                isInsufficient ? 'border-red-500 text-red-600' : 'border-slate-200 focus:border-[#087F3E]'
              }`}
            />
          </div>

          {/* Insufficient Stock Red Guard Banner */}
          {isInsufficient && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <span>🚨</span>
              <span>
                Insufficient Stock! You are trying to issue <strong>{numericQty} {selectedMaterial?.unit}</strong>, but only <strong>{availableStock} {selectedMaterial?.unit}</strong> is available.
              </span>
            </div>
          )}

          {/* Location / Work Area */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
              Work Location / Area
            </label>
            <input
              type="text"
              placeholder="e.g. Block A — 1st Floor Slab"
              value={locationWorkArea}
              onChange={(e) => setLocationWorkArea(e.target.value)}
              className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-[#087F3E]"
            />
          </div>

          {/* Issued To */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
              Issued To (Person / Contractor Team)
            </label>
            <input
              type="text"
              placeholder="e.g. Mason Team Ramesh"
              value={issuedTo}
              onChange={(e) => setIssuedTo(e.target.value)}
              className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-[#087F3E]"
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
              Optional Remark
            </label>
            <input
              type="text"
              placeholder="e.g. Approved for casting"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-[#087F3E]"
            />
          </div>
        </div>

        {/* Primary Submit Button */}
        <button
          type="submit"
          disabled={submitting || isInsufficient || !selectedMaterialId || numericQty <= 0}
          className="w-full h-14 bg-[#087F3E] hover:bg-[#056B34] disabled:opacity-40 text-white font-extrabold rounded-2xl text-base transition-colors shadow flex items-center justify-center gap-2"
        >
          {submitting ? 'Issuing Material...' : '📤 Issue Material'}
        </button>
      </form>
    </div>
  );
}
