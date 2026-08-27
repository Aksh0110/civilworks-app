'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { useProject } from '@/lib/context/ProjectContext';

interface ProjectOverviewCard {
  _id: string;
  name: string;
  code: string;
  location?: string;
  status: 'ACTIVE' | 'ON_HOLD' | 'COMPLETED';
  presentWorkers: number;
  todayExpense: number;
  totalDue: number;
  lowStockCount: number;
}

export default function ProjectsListPage() {
  const { setActiveProjectId } = useProject();
  const [projects, setProjects] = useState<ProjectOverviewCard[]>([]);
  const [statusTab, setStatusTab] = useState<'ALL' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED'>('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, [statusTab]);

  const loadProjects = () => {
    setLoading(true);
    const param = statusTab !== 'ALL' ? `?status=${statusTab}` : '';
    fetch(`/api/projects${param}`)
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
    <AppShell>
      <main className="content space-y-6 pb-20 max-w-4xl mx-auto">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-900 border border-stone-800 p-5 rounded-2xl">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏗️</span>
              <h1 className="text-xl font-bold text-stone-100">Project Directory</h1>
            </div>
            <p className="text-xs text-stone-400 mt-1">
              Select or switch active site project command center.
            </p>
          </div>

          <Link
            href="/projects/create"
            className="px-5 h-12 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2 shrink-0 self-start sm:self-auto"
          >
            <span>+</span> Create Project
          </Link>
        </div>

        {/* Filter Bar */}
        <div className="bg-stone-900 border border-stone-800 p-4 rounded-2xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Status Tabs */}
            <div className="flex bg-stone-950 p-1 rounded-xl gap-1 border border-stone-800">
              {(['ALL', 'ACTIVE', 'ON_HOLD', 'COMPLETED'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setStatusTab(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    statusTab === t
                      ? 'bg-amber-500 text-stone-950 shadow'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {t.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Search */}
            <input
              type="text"
              placeholder="Search project name, code, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64 bg-stone-950 border border-stone-800 rounded-xl px-4 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Projects Cards List */}
        {loading ? (
          <div className="text-center py-12 text-xs text-stone-500">Loading site projects...</div>
        ) : filteredProjects.length === 0 ? (
          <div className="bg-stone-900 border border-stone-800 p-8 rounded-2xl text-center space-y-3">
            <div className="text-3xl">🏗️</div>
            <h3 className="text-sm font-bold text-stone-200">No projects found</h3>
            <p className="text-xs text-stone-400">Create a construction site project to start tracking attendance, materials, and expenses.</p>
            <Link
              href="/projects/create"
              className="inline-block px-4 py-2 bg-amber-500 text-stone-950 text-xs font-bold rounded-xl"
            >
              + Create Project
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredProjects.map((p) => (
              <div
                key={p._id}
                className="p-5 rounded-2xl bg-stone-900 hover:bg-stone-800/80 border border-stone-800 text-left transition-all shadow-lg flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-base font-extrabold text-stone-100 flex items-center gap-2">
                      <span>{p.name}</span>
                      <span className="text-[10px] text-amber-400 font-mono">({p.code})</span>
                    </div>
                    {p.location && <div className="text-xs text-stone-400">📍 {p.location}</div>}
                  </div>

                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase shrink-0 ${
                      p.status === 'ACTIVE'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : p.status === 'ON_HOLD'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-stone-500/20 text-stone-300 border border-stone-500/30'
                    }`}
                  >
                    {p.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Metrics Summary Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-stone-800/80 text-xs">
                  <div>
                    <span className="text-stone-500 text-[10px] block">Workers Today</span>
                    <span className="font-bold text-stone-200">👷 {p.presentWorkers}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 text-[10px] block">Expenses Today</span>
                    <span className="font-bold text-stone-200">₹{p.todayExpense.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 text-[10px] block">Payments Due</span>
                    <span className={`font-bold ${p.totalDue > 0 ? 'text-amber-400' : 'text-stone-300'}`}>
                      ₹{p.totalDue.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-500 text-[10px] block">Low Stock</span>
                    <span className={`font-bold ${p.lowStockCount > 0 ? 'text-red-400' : 'text-stone-300'}`}>
                      ⚠️ {p.lowStockCount}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-800/60 flex gap-2">
                  <Link
                    href={`/projects/${p._id}`}
                    onClick={() => setActiveProjectId(p._id)}
                    className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-xs rounded-xl text-center transition-colors shadow"
                  >
                    Open Project Command Center →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </AppShell>
  );
}
