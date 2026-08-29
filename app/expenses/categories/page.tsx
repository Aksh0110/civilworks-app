'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ExpenseCategoryModal from '@/components/ExpenseCategoryModal';
import ConfirmModal from '@/components/ConfirmModal';

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
  const [categoryToEdit, setCategoryToEdit] = useState<CategoryItem | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryItem | null>(null);

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

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    const res = await fetch(`/api/expenses/categories/${categoryToDelete._id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Failed to delete expense category');
    }
    loadCategories();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-3 pb-20">
      {/* Header */}
      <div className="flex flex-row items-center justify-between gap-2 bg-white border border-slate-200 p-3 rounded-xl shadow-2xs">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg">🏷️</span>
            <h1 className="text-base font-extrabold text-slate-900">Expense Categories</h1>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Manage operational cost categories</p>
        </div>

        <button
          onClick={() => {
            setCategoryToEdit(null);
            setIsModalOpen(true);
          }}
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
              className="bg-[#FFFFFF] border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{c.icon || '💸'}</span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{c.name}</h3>
                  <span className="text-[11px] text-slate-500">{c.isDefault ? 'Default Category' : 'Custom Category'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setCategoryToEdit(c);
                    setIsModalOpen(true);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-700 text-xs font-bold"
                  title="Edit Category"
                >
                  ✏️
                </button>

                <button
                  onClick={() => setCategoryToDelete(c)}
                  className="p-1.5 text-slate-400 hover:text-red-600 text-xs font-bold"
                  title="Delete Category"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ExpenseCategoryModal
        isOpen={isModalOpen}
        categoryToEdit={categoryToEdit}
        onClose={() => {
          setIsModalOpen(false);
          setCategoryToEdit(null);
        }}
        onSuccess={() => loadCategories()}
      />

      <ConfirmModal
        isOpen={!!categoryToDelete}
        title="Delete Expense Category"
        message={`Are you sure you want to delete category "${categoryToDelete?.name}"?`}
        itemName={categoryToDelete?.name}
        warningText="Category will be removed from future expense entries."
        confirmText="Delete Category"
        onClose={() => setCategoryToDelete(null)}
        onConfirm={handleDeleteCategory}
      />
    </div>
  );
}
