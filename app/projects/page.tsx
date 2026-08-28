'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useProject } from '@/lib/context/ProjectContext';
import { useAuth } from '@/lib/context/AuthContext';
import { isFeatureEnabled } from '@/lib/config/features';

import ProjectModal from '@/components/ProjectModal';
import ConfirmModal from '@/components/ConfirmModal';

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
  outOfStockCount: number;
  siteContact?: string;
}

export default function ProjectsDirectoryPage() {
  const { activeProject, setActiveProjectId, refreshProjects } = useProject();
  const { user, isAdmin } = useAuth();

  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showWorkers = isFeatureEnabled('workers');

  // Edit / Delete State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<ProjectListItem | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<ProjectListItem | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = () => {
    setLoading(true);
    fetch('/api/projects')
      .then((r) => r.json())
      .then((d) => {
        if (d.data) setProjects(d.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleSelectProject = (p: ProjectListItem) => {
    setActiveProjectId(p._id);
    setToastMessage(`✅ Active site switched to "${p.name}"`);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    const res = await fetch(`/api/projects/${projectToDelete._id}`, { method: 'DELETE' });
    if (!res.ok) {
      const d = await res.json();
      throw new Error(d.message || 'Failed to delete project');
    }
    await refreshProjects();
    loadProjects();
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
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#087F3E] text-white px-5 py-2.5 rounded-2xl shadow-xl font-bold text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top">
          {toastMessage}
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏗️</span>
            <h1 className="text-xl font-bold text-slate-900">Project Directory</h1>
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
              isAdmin ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-emerald-50 text-[#056B34] border-[#bce6cb]'
            }`}>
              {isAdmin ? '🌐 All Sites (Admin)' : `🔒 Authorized Sites (${projects.length})`}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Current site:{' '}
            <span className="text-[#087F3E] font-extrabold">{activeProject?.name || 'None Selected'}</span>. Click any site to switch workspace.
          </p>
        </div>

        <button
          onClick={() => {
            setProjectToEdit(null);
            setIsEditModalOpen(true);
          }}
          className="px-5 h-12 bg-[#087F3E] hover:bg-[#056B34] text-white text-xs font-bold rounded-xl transition-colors shadow flex items-center justify-center gap-2 shrink-0 self-start sm:self-auto"
        >
          <span>+</span> Create Project
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
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
          <button
            onClick={() => {
              setProjectToEdit(null);
              setIsEditModalOpen(true);
            }}
            className="inline-block px-4 py-2 bg-[#087F3E] text-white text-xs font-bold rounded-xl"
          >
            + Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredProjects.map((p) => {
            const isActive = activeProject?._id === p._id;

            return (
              <div
                key={p._id}
                className={`p-5 rounded-2xl transition-all shadow-sm flex flex-col justify-between space-y-4 group ${
                  isActive
                    ? 'bg-emerald-50/30 border-2 border-[#087F3E] shadow-md'
                    : 'bg-white border border-slate-200 hover:border-slate-300'
                }`}
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

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setProjectToEdit(p);
                        setIsEditModalOpen(true);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-700 text-xs font-bold"
                      title="Edit Project"
                    >
                      ✏️
                    </button>

                    <button
                      onClick={() => setProjectToDelete(p)}
                      className="p-1 text-slate-400 hover:text-red-600 text-xs font-bold"
                      title="Delete Project"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Metrics Bar */}
                <div className={`grid ${showWorkers ? 'grid-cols-4' : 'grid-cols-3'} gap-2 pt-3 border-t border-slate-100 text-center`}>
                  {showWorkers && (
                    <div className="bg-white border border-slate-100 p-2 rounded-xl">
                      <span className="text-[10px] text-slate-500 block font-semibold">Workers</span>
                      <span className="text-xs font-black text-slate-900">{p.presentWorkers}</span>
                    </div>
                  )}

                  <div className="bg-white border border-slate-100 p-2 rounded-xl">
                    <span className="text-[10px] text-slate-500 block font-semibold">Today Expense</span>
                    <span className="text-xs font-black text-slate-900">₹{p.todayExpense}</span>
                  </div>

                  <div className="bg-white border border-slate-100 p-2 rounded-xl">
                    <span className="text-[10px] text-slate-500 block font-semibold">Total Due</span>
                    <span className="text-xs font-black text-amber-600">₹{p.totalDue.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="bg-white border border-slate-100 p-2 rounded-xl">
                    <span className="text-[10px] text-slate-500 block font-semibold">Out of Stock</span>
                    <span className={`text-xs font-black ${p.outOfStockCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                      {p.outOfStockCount || 0}
                    </span>
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => handleSelectProject(p)}
                    className={`px-4 py-2 rounded-xl font-extrabold text-xs transition-colors shadow-xs ${
                      isActive
                        ? 'bg-[#087F3E] text-white border border-[#087F3E]'
                        : 'bg-[#EAF7EF] hover:bg-[#d5edd9] text-[#056B34] border border-[#bce6cb]'
                    }`}
                  >
                    {isActive ? '✓ Selected Site' : 'Select Site'}
                  </button>

                  <Link
                    href={`/projects/${p._id}`}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors shadow"
                  >
                    Overview →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Project Create/Edit Modal */}
      <ProjectModal
        isOpen={isEditModalOpen}
        projectToEdit={projectToEdit}
        onClose={() => {
          setIsEditModalOpen(false);
          setProjectToEdit(null);
        }}
        onSuccess={loadProjects}
      />

      {/* Confirmation Modal for Project Deletion */}
      <ConfirmModal
        isOpen={!!projectToDelete}
        title="Delete Project Site"
        message={`Are you sure you want to delete "${projectToDelete?.name}" (${projectToDelete?.code})?`}
        itemName={projectToDelete ? `${projectToDelete.name} [Code: ${projectToDelete.code}]` : undefined}
        warningText="Deleting this project will permanently remove site configuration metadata."
        confirmText="Delete Project"
        onClose={() => setProjectToDelete(null)}
        onConfirm={handleDeleteProject}
      />
    </div>
  );
}
