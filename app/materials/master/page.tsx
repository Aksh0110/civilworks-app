'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import MaterialModal from '@/components/MaterialModal';

interface MaterialMasterItem {
  _id: string;
  name: string;
  category: string;
  unit: string;
  minStockLevel: number;
  defaultRate: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export default function MaterialMasterPage() {
  const [materials, setMaterials] = useState<MaterialMasterItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [units, setUnits] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetch('/api/materials/categories')
      .then((r) => r.json())
      .then((d) => {
        if (d.data) {
          setCategories(d.data.categories || []);
          setUnits(d.data.units || []);
        }
      });

    loadMaterials();
  }, []);

  const loadMaterials = () => {
    setLoading(true);
    fetch('/api/materials?status=ACTIVE')
      .then((r) => r.json())
      .then((d) => setMaterials(d.data || []))
      .finally(() => setLoading(false));
  };

  const filteredMaterials = materials.filter((m) => {
    const matchCat = selectedCategory === 'ALL' || m.category === selectedCategory;
    const matchSearch = !search.trim() || m.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-900 border border-stone-800 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <Link
            href="/materials"
            className="w-9 h-9 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center text-sm transition-colors"
          >
            ←
          </Link>
          <div>
            <h1 className="text-lg font-bold text-stone-100 flex items-center gap-2">
              <span>⚙️</span> Material Master Catalog
            </h1>
            <p className="text-xs text-stone-400">Configure construction items, trade categories, and min stock thresholds</p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 h-11 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2"
        >
          <span>+</span> Add New Material
        </button>
      </div>

      {/* Search & Categories Filter */}
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Search materials..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-11 px-4 bg-stone-900 border border-stone-800 rounded-xl text-stone-100 text-sm focus:outline-none focus:border-amber-500"
        />

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
              selectedCategory === 'ALL' ? 'bg-amber-500 text-stone-950' : 'bg-stone-900 text-stone-400 border border-stone-800'
            }`}
          >
            All Categories ({materials.length})
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                selectedCategory === c ? 'bg-amber-500 text-stone-950' : 'bg-stone-900 text-stone-400 border border-stone-800'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Material Master Cards */}
      {loading ? (
        <div className="py-12 text-center text-stone-500 text-sm">Loading material catalog...</div>
      ) : filteredMaterials.length === 0 ? (
        <div className="bg-stone-900 border border-stone-800 p-8 rounded-2xl text-center space-y-3">
          <span className="text-3xl">📦</span>
          <h3 className="text-base font-bold text-stone-200">No Materials Found</h3>
          <p className="text-xs text-stone-500">Click &quot;+ Add New Material&quot; to define a new material.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredMaterials.map((m) => (
            <div key={m._id} className="bg-stone-900 border border-stone-800 p-4 rounded-2xl space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-stone-100">{m.name}</h3>
                  <span className="text-xs text-amber-400 font-medium">{m.category}</span>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-stone-800 text-stone-300">
                  Unit: {m.unit}
                </span>
              </div>

              <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-xs text-stone-400">
                <div>Min Warning: <strong className="text-stone-200">{m.minStockLevel || 0} {m.unit}</strong></div>
                <div>Default Rate: <strong className="text-amber-400">₹{m.defaultRate || 0}</strong></div>
              </div>
            </div>
          ))}
        </div>
      )}

      <MaterialModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => loadMaterials()}
        categories={categories}
        units={units}
      />
    </div>
  );
}
