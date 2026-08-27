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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-stone-900 border border-stone-800 rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-stone-800">
          <h2 className="text-lg font-bold text-stone-100 flex items-center gap-2">
            <span>🏗️</span> Add Work Type
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-amber-950/80 border border-amber-800/80 text-amber-200 text-sm flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-400 uppercase mb-1">
              Work Type Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Gypsum False Ceiling"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-11 px-3 bg-stone-950 border border-stone-800 rounded-lg text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-400 uppercase mb-1">
              Default Measurement Unit *
            </label>
            <select
              value={defaultUnit}
              onChange={(e) => setDefaultUnit(e.target.value)}
              className="w-full h-11 px-3 bg-stone-950 border border-stone-800 rounded-lg text-stone-100 focus:outline-none focus:border-amber-500 text-sm"
            >
              {['Sq.ft', 'Cu.m', 'Rft', 'Kg', 'MT', 'Floor', 'Nos', 'm', 'Item', 'Bags'].map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-400 uppercase mb-1">
              Emoji Icon
            </label>
            <div className="flex gap-2">
              {['🏗️', '🧱', '📐', '🎨', '⚡', '🚰', '🪨', '🚪'].map((e) => (
                <button
                  type="button"
                  key={e}
                  onClick={() => setIcon(e)}
                  className={`w-10 h-10 rounded-lg text-lg flex items-center justify-center transition-colors ${
                    icon === e ? 'bg-amber-500 text-stone-950 font-bold' : 'bg-stone-950 border border-stone-800 text-stone-300'
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
              className="flex-1 h-11 rounded-lg border border-stone-800 text-stone-300 text-sm font-medium hover:bg-stone-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-11 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-stone-950 text-sm font-bold transition-colors flex items-center justify-center gap-2"
            >
              {loading ? 'Saving...' : 'Add Work Type'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
