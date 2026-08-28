'use client';

import { useState } from 'react';

interface WorkTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function WorkTypeModal({ isOpen, onClose, onSuccess }: WorkTypeModalProps) {
  const [name, setName] = useState('');
  const [defaultUnit, setDefaultUnit] = useState('Sq.ft');
  const [icon, setIcon] = useState('🏗️');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Work type name is required');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/progress/work-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          defaultUnit,
          icon
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to add work type');
      }

      setName('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-white border border-slate-200 rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>🏗️</span> Add Work Type
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
              Work Type Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Gypsum False Ceiling"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#087F3E] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
              Default Measurement Unit *
            </label>
            <select
              value={defaultUnit}
              onChange={(e) => setDefaultUnit(e.target.value)}
              className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#087F3E] text-sm"
            >
              {['Sq.ft', 'Cu.m', 'Rft', 'Kg', 'MT', 'Floor', 'Nos', 'm', 'Item', 'Bags'].map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
              Emoji Icon
            </label>
            <div className="flex gap-2">
              {['🏗️', '🧱', '📐', '🎨', '⚡', '🚰', '🪨', '🚪'].map((e) => (
                <button
                  type="button"
                  key={e}
                  onClick={() => setIcon(e)}
                  className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center transition-colors ${
                    icon === e ? 'bg-[#087F3E] text-white font-bold shadow' : 'bg-slate-50 border border-slate-200 text-slate-700'
                  }`}
                >
                  {e}
                </button>
              ))}
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
              {loading ? 'Saving...' : 'Add Work Type'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
