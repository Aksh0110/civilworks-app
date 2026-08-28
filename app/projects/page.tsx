'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useProject } from '@/lib/context/ProjectContext';

interface ProjectListItem {
  _id: string;
  name: string;
  code: string;
  location?: string;
  status: 'ACTIVE' | 'ON_HOLD' | 'COMPLETED';
  startDate: string;
  presentWorkers: number;
  todayExpense: number;
  totalDue: number;
  lowStockCount: number;
}

export default function ProjectsDirectoryPage() {
  const { setActiveProjectId } = useProject();

  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED'>('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, [activeTab]);

  const loadProjects = () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (activeTab !== 'ALL') query.set('statusTab', activeTab);

    fetch(`/api/projects?${query.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.data) setProjects(d.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const filteredProjects = projects.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      (p.location && p.location.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏗️</span>
            <h1 className="text-xl font-bold text-slate-900">Project Directory</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Construction site command center overview & site project switcher.
          </p>
        </div>

        <Link
          href="/projects/create"
          className="px-5 h-12 bg-[#087F3E] hover:bg-[#056B34] text-white text-xs font-bold rounded-xl transition-colors shadow flex items-center justify-center gap-2 shrink-0 self-start sm:self-auto"
        >
          <span>+</span> Create Project
        </Link>
      </div>

      {/* Filter Bar & Status Tabs */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-3 shadow-sm">
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1 border border-slate-200">
          {(['ALL', 'ACTIVE', 'ON_HOLD', 'COMPLETED'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === t
                  ? 'bg-[#087F3E] text-white shadow'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search project name, code, or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#087F3E]"
        />
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="text-center py-12 text-xs text-slate-500">Loading site projects...</div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white border border-slate-200 p-8 rounded-2xl text-center space-y-3 shadow-sm">
          <div className="text-3xl">🏗️</div>
          <h3 className="text-sm font-bold text-slate-900">No projects found</h3>
          <p className="text-xs text-slate-500">Create a construction project to start tracking site operations.</p>
          <Link
            href="/projects/create"
            className="inline-block px-4 py-2 bg-[#087F3E] text-white text-xs font-bold rounded-xl"
          >
            + Create Project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredProjects.map((p) => (
            <div
              key={p._id}
              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-[#087F3E] transition-all shadow-sm flex flex-col justify-between space-y-4 group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-base font-extrabold text-slate-900 group-hover:text-[#087F3E] transition-colors">
                    {p.name}
                  </div>
                  <div className="text-xs font-semibold text-slate-500">
                    Code: <span className="text-slate-800">{p.code}</span>
                    {p.location ? ` • ${p.location}` : ''}
                  </div>
                </div>

                <span
                  className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase shrink-0 ${
                    p.status === 'ACTIVE'
                      ? 'bg-[#EAF7EF] text-[#056B34] border border-[#bce6cb]'
                      : p.status === 'ON_HOLD'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {p.status}
                </span>
              </div>

              {/* Metrics Bar */}
              <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-100 text-center">
                <div className="bg-slate-50 p-2 rounded-xl">
                  <span className="text-[10px] text-slate-500 block font-semibold">Workers</span>
                  <span className="text-xs font-black text-slate-900">{p.presentWorkers}</span>
                </div>

                <div className="bg-slate-50 p-2 rounded-xl">
                  <span className="text-[10px] text-slate-500 block font-semibold">Expense</span>
                  <span className="text-xs font-black text-slate-900">₹{p.todayExpense}</span>
                </div>

                <div className="bg-slate-50 p-2 rounded-xl">
                  <span className="text-[10px] text-slate-500 block font-semibold">Total Due</span>
                  <span className="text-xs font-black text-amber-600">₹{p.totalDue.toLocaleString('en-IN')}</span>
                </div>

                <div className="bg-slate-50 p-2 rounded-xl">
                  <span className="text-[10px] text-slate-500 block font-semibold">Low Stock</span>
                  <span className={`text-xs font-black ${p.lowStockCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                    {p.lowStockCount}
                  </span>
                </div>
              </div>

              {/* Actions Bar */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => {
                    setActiveProjectId(p._id);
                  }}
                  className="px-3.5 py-1.5 bg-[#EAF7EF] hover:bg-[#d5edd9] text-[#056B34] font-bold text-xs rounded-xl transition-colors"
                >
                  Set Active Site ✓
                </button>

                <Link
                  href={`/projects/${p._id}`}
                  className="px-3.5 py-1.5 bg-[#087F3E] hover:bg-[#056B34] text-white font-bold text-xs rounded-xl transition-colors shadow"
                >
                  Command Center →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
