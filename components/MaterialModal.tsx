'use client';

import { useState, useEffect } from 'react';

interface MaterialModalProps {
  isOpen: boolean;
  materialToEdit?: any | null;
  onClose: () => void;
  onSuccess: () => void;
  categories: string[];
  units: string[];
}

export default function MaterialModal({ isOpen, materialToEdit, onClose, onSuccess, categories, units }: MaterialModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(categories[0] || 'Cement');
  const [unit, setUnit] = useState(units[0] || 'Bags');
  const [minStockLevel, setMinStockLevel] = useState('50');
  const [defaultRate, setDefaultRate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (materialToEdit) {
      setName(materialToEdit.name || '');
      setCategory(materialToEdit.category || categories[0] || 'Cement');
      setUnit(materialToEdit.unit || units[0] || 'Bags');
      setMinStockLevel(String(materialToEdit.minStockLevel ?? 50));
      setDefaultRate(String(materialToEdit.defaultRate ?? ''));
    } else {
      setName('');
      setCategory(categories[0] || 'Cement');
      setUnit(units[0] || 'Bags');
      setMinStockLevel('50');
      setDefaultRate('');
    }
  }, [materialToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Material name is required');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const url = materialToEdit ? `/api/materials/${materialToEdit._id}` : '/api/materials';
      const method = materialToEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          category,
          unit,
          minStockLevel: Number(minStockLevel) || 0,
          defaultRate: Number(defaultRate) || 0
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || `Failed to ${materialToEdit ? 'update' : 'add'} material`);
      }

      setName('');
      setMinStockLevel('50');
      setDefaultRate('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-4 pb-6 sm:pb-4">
      <div className="w-full sm:max-w-md bg-white border border-slate-200 rounded-2xl p-6 max-h-[85vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>📦</span> {materialToEdit ? 'Edit Material' : 'Add New Material'}
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors font-bold"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
              Material Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. OPC 53 Grade Cement"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#087F3E] text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-[#087F3E]"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                Unit *
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-[#087F3E]"
              >
                {units.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                Min Stock Warning
              </label>
              <input
                type="number"
                min="0"
                placeholder="50"
                value={minStockLevel}
                onChange={(e) => setMinStockLevel(e.target.value)}
                className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#087F3E] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                Default Rate (₹)
              </label>
              <input
                type="number"
                min="0"
                placeholder="410"
                value={defaultRate}
                onChange={(e) => setDefaultRate(e.target.value)}
                className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#087F3E] text-sm"
              />
            </div>
          </div>

          <div className="pt-3 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-11 rounded-xl bg-[#087F3E] hover:bg-[#056B34] disabled:opacity-50 text-white text-sm font-extrabold transition-colors flex items-center justify-center gap-2 shadow"
            >
              {loading ? 'Saving...' : 'Add Material'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
