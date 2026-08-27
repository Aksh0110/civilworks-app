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
        <div className="bg-blue-950/80 border border-blue-800/80 p-6 rounded-2xl text-center space-y-4">
          <div className="w-16 h-16 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full flex items-center justify-center text-3xl mx-auto">
            ✓
          </div>
          <div>
            <h2 className="text-xl font-bold text-blue-100">Material Issued Successfully!</h2>
            <p className="text-xs text-blue-300/80 mt-1">
              Stock balance has been automatically reduced for{' '}
              <span className="font-semibold text-white">{activeProject?.name}</span>.
            </p>
          </div>
        </div>

        {/* Issue Summary Card */}
        <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-stone-200 uppercase tracking-wider">Issue Summary</h3>

          <div className="divide-y divide-stone-800">
            {successResult.updatedStockList?.map((item: any) => (
              <div key={item.materialId} className="py-3 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-stone-100">{item.materialName}</h4>
                  <span className="text-xs text-stone-400">
                    Remaining Stock: <strong className="text-amber-400">{item.currentStock} {item.unit}</strong>
                  </span>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                    item.status === 'GOOD'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : item.status === 'LOW'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-red-950 text-red-300 border border-red-800'
                  }`}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>

          {(locationWorkArea || issuedTo) && (
            <div className="pt-3 border-t border-stone-800 text-xs text-stone-400 space-y-1">
              {locationWorkArea && <div>Location / Work Area: <strong className="text-stone-200">{locationWorkArea}</strong></div>}
              {issuedTo && <div>Issued To: <strong className="text-stone-200">{issuedTo}</strong></div>}
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
            className="flex-1 h-12 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-sm font-bold transition-colors"
          >
            + Give Another Material
          </button>
          <Link
            href="/materials/stock"
            className="flex-1 h-12 rounded-xl bg-blue-500 hover:bg-blue-400 text-stone-950 text-sm font-bold transition-colors flex items-center justify-center"
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
      <div className="flex items-center justify-between bg-stone-900 border border-stone-800 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <Link
            href="/materials"
            className="w-9 h-9 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center text-sm transition-colors"
          >
            ←
          </Link>
          <div>
            <h1 className="text-lg font-bold text-stone-100 flex items-center gap-2">
              <span>📤</span> Give Material (Outward)
            </h1>
            <p className="text-xs text-stone-400">
              Site: <span className="text-amber-400 font-semibold">{activeProject?.name || 'Select Site'}</span>
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-amber-950/90 border border-amber-800 text-amber-200 text-sm flex items-center gap-3">
          <span className="text-lg">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-400">Issue Material Details</h2>

          {/* Issue Date */}
          <div>
            <label className="block text-xs font-semibold text-stone-400 uppercase mb-1">Issue Date *</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-11 px-3 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Select Material with Live Balance */}
          <div>
            <label className="block text-xs font-semibold text-stone-400 uppercase mb-1">Select Material *</label>
            <select
              required
              value={selectedMaterialId}
              onChange={(e) => {
                setSelectedMaterialId(e.target.value);
                setError('');
              }}
              className="w-full h-12 px-3 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm focus:outline-none focus:border-blue-500 font-medium"
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
            <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between">
              <span className="text-xs text-stone-400">Available Stock Balance:</span>
              <span
                className={`text-sm font-bold ${
                  availableStock <= 0 ? 'text-red-400' : availableStock < (selectedMaterial.minStockLevel || 0) ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {availableStock} {selectedMaterial.unit}
              </span>
            </div>
          )}

          {/* Quantity Input */}
          <div>
            <label className="block text-xs font-semibold text-stone-400 uppercase mb-1">
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
              className={`w-full h-12 px-4 bg-stone-950 border text-stone-100 text-base font-bold rounded-xl placeholder-stone-600 focus:outline-none ${
                isInsufficient ? 'border-red-500 text-red-200' : 'border-stone-800 focus:border-blue-500'
              }`}
            />
          </div>

          {/* Insufficient Stock Red Guard Banner */}
          {isInsufficient && (
            <div className="p-3 rounded-xl bg-red-950/90 border border-red-800 text-red-200 text-xs font-semibold flex items-center gap-2">
              <span>🚨</span>
              <span>
                Insufficient Stock! You are trying to issue <strong>{numericQty} {selectedMaterial?.unit}</strong>, but only <strong>{availableStock} {selectedMaterial?.unit}</strong> is available.
              </span>
            </div>
          )}

          {/* Location / Work Area */}
          <div>
            <label className="block text-xs font-semibold text-stone-400 uppercase mb-1">
              Work Location / Area
            </label>
            <input
              type="text"
              placeholder="e.g. Block A — 1st Floor Slab"
              value={locationWorkArea}
              onChange={(e) => setLocationWorkArea(e.target.value)}
              className="w-full h-11 px-3 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Issued To */}
          <div>
            <label className="block text-xs font-semibold text-stone-400 uppercase mb-1">
              Issued To (Person / Contractor Team)
            </label>
            <input
              type="text"
              placeholder="e.g. Mason Team Ramesh"
              value={issuedTo}
              onChange={(e) => setIssuedTo(e.target.value)}
              className="w-full h-11 px-3 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold text-stone-400 uppercase mb-1">
              Optional Remark
            </label>
            <input
              type="text"
              placeholder="e.g. Approved for casting"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full h-11 px-3 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Primary Submit Button */}
        <button
          type="submit"
          disabled={submitting || isInsufficient || !selectedMaterialId || numericQty <= 0}
          className="w-full h-14 bg-blue-500 hover:bg-blue-400 disabled:opacity-40 text-stone-950 font-bold rounded-2xl text-base transition-colors shadow-lg flex items-center justify-center gap-2"
        >
          {submitting ? 'Issuing Material...' : '📤 Issue Material'}
        </button>
      </form>
    </div>
  );
}
