'use client';

import { useState, useEffect } from 'react';

interface ExpenseCategoryModalProps {
  isOpen: boolean;
  categoryToEdit?: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ExpenseCategoryModal({ isOpen, categoryToEdit, onClose, onSuccess }: ExpenseCategoryModalProps) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('💸');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (categoryToEdit) {
      setName(categoryToEdit.name || '');
      setIcon(categoryToEdit.icon || '💸');
    } else {
      setName('');
      setIcon('💸');
    }
  }, [categoryToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category name is required');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const url = categoryToEdit ? `/api/expenses/categories/${categoryToEdit._id}` : '/api/expenses/categories';
      const method = categoryToEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          icon: icon.trim() || '💸'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || `Failed to ${categoryToEdit ? 'update' : 'add'} category`);
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
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-4 pb-6 sm:pb-4">
      <div className="w-full sm:max-w-md bg-white border border-slate-200 rounded-2xl p-6 max-h-[85vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>🏷️</span> {categoryToEdit ? 'Edit Expense Category' : 'Add Expense Category'}
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
              Category Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Site Refreshments"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#087F3E] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
              Category Emoji / Icon
            </label>
            <div className="flex gap-2">
              {['💸', '☕', '⛽', '🚚', '🛠️', '💧', '📦', '🏗️'].map((emoji) => (
                <button
                  type="button"
                  key={emoji}
                  onClick={() => setIcon(emoji)}
                  className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center transition-colors ${
                    icon === emoji ? 'bg-[#087F3E] text-white font-bold shadow' : 'bg-slate-50 border border-slate-200 text-slate-700'
                  }`}
                >
                  {emoji}
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
              {loading ? 'Saving...' : 'Add Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
