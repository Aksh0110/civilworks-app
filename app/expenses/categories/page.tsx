'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ExpenseCategoryModal from '@/components/ExpenseCategoryModal';

interface CategoryItem {
  _id: string;
  name: string;
  icon: string;
  status: 'ACTIVE' | 'INACTIVE';
  isDefault?: boolean;
}

export default function ExpenseCategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = () => {
    setLoading(true);
    fetch('/api/expenses/categories')
      .then((r) => r.json())
      .then((d) => {
        if (d.data?.categories) setCategories(d.data.categories);
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/expenses"
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-sm transition-colors font-bold"
          >
            ←
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>🏷️</span> Expense Categories
            </h1>
            <p className="text-xs text-slate-500">Configure trade and site operational expense types</p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 h-10 bg-[#087F3E] hover:bg-[#056B34] text-white text-xs font-bold rounded-xl transition-colors shadow flex items-center gap-1"
        >
          <span>+</span> Category
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500 text-sm">Loading expense categories...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {categories.map((c) => (
            <div
              key={c._id}
              className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{c.icon || '💸'}</span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{c.name}</h3>
                  <span className="text-[11px] text-slate-500">{c.isDefault ? 'Default Category' : 'Custom Category'}</span>
                </div>
              </div>

              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#EAF7EF] text-[#056B34] border border-[#bce6cb]">
                ACTIVE
              </span>
            </div>
          ))}
        </div>
      )}

      <ExpenseCategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => loadCategories()}
      />
    </div>
  );
}
