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
    <div className="space-y-3 pb-20 max-w-4xl mx-auto">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-[#087F3E] text-white px-4 py-2 rounded-xl shadow-lg font-bold text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top">
          {toastMessage}
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-row items-center justify-between gap-2 bg-white border border-slate-200 p-3 rounded-xl shadow-2xs">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-lg">🏗️</span>
            <h1 className="text-base font-extrabold text-slate-900">Project Directory</h1>
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
              isAdmin ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-emerald-50 text-[#056B34] border-[#bce6cb]'
            }`}>
              {isAdmin ? 'All Sites' : `${projects.length} Sites`}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Active: <span className="text-[#087F3E] font-extrabold">{activeProject?.name || 'None Selected'}</span>. Click site to switch.
          </p>
        </div>

        <button
          onClick={() => {
            setProjectToEdit(null);
            setIsEditModalOpen(true);
          }}
          className="px-3 h-8 bg-[#087F3E] hover:bg-[#056B34] text-white text-[11px] font-bold rounded-lg transition-colors shadow-2xs flex items-center justify-center gap-1 shrink-0"
        >
          <span>+</span> Create Project
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-white border border-slate-200 p-2 rounded-xl shadow-2xs">
        <input
          type="text"
          placeholder="Search project name, code, or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#087F3E]"
        />
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="text-center py-8 text-xs text-slate-500">Loading site projects...</div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white border border-slate-200 p-6 rounded-xl text-center space-y-2 shadow-2xs">
          <div className="text-2xl">🏗️</div>
          <h3 className="text-xs font-bold text-slate-900">No projects found</h3>
          <p className="text-[11px] text-slate-500">Create a construction project to start tracking site operations.</p>
          <button
            onClick={() => {
              setProjectToEdit(null);
              setIsEditModalOpen(true);
            }}
            className="inline-block px-3 py-1.5 bg-[#087F3E] text-white text-xs font-bold rounded-lg"
          >
            + Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {filteredProjects.map((p) => {
            const isActive = activeProject?._id === p._id;

            return (
              <div
                key={p._id}
                className={`p-2.5 rounded-xl transition-all shadow-2xs flex flex-col gap-1.5 ${
                  isActive
                    ? 'bg-emerald-50/40 border-2 border-[#087F3E]'
                    : 'bg-white border border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Header Row */}
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <button
                      onClick={() => handleSelectProject(p)}
                      className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] shrink-0 transition-colors ${
                        isActive
                          ? 'bg-[#087F3E] text-white'
                          : 'bg-[#EAF7EF] hover:bg-[#d5edd9] text-[#056B34] border border-[#bce6cb]'
                      }`}
                    >
                      {isActive ? '✓ Active' : 'Select'}
                    </button>
                    <span className="text-xs font-extrabold text-slate-900 truncate">{p.name}</span>
                    <span className="text-[10px] text-slate-500 font-semibold shrink-0">({p.code})</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setProjectToEdit(p);
                        setIsEditModalOpen(true);
                      }}
                      className="p-0.5 text-slate-400 hover:text-slate-700 text-xs font-bold"
                      title="Edit Project"
                    >
                      ✏️
                    </button>

                    <button
                      onClick={() => setProjectToDelete(p)}
                      className="p-0.5 text-slate-400 hover:text-red-600 text-xs font-bold"
                      title="Delete Project"
                    >
                      🗑️
                    </button>

                    <Link
                      href={`/projects/${p._id}`}
                      className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] rounded-md transition-colors"
                    >
                      Overview →
                    </Link>
                  </div>
                </div>

                {/* Subtext Location */}
                {p.location && (
                  <div className="text-[10px] text-slate-500 truncate -mt-0.5">
                    📍 {p.location}
                  </div>
                )}

                {/* Single-line Inline Metrics Bar */}
                <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100/80 text-[10px]">
                  {showWorkers && (
                    <div className="truncate">
                      <span className="text-slate-400 font-medium">Workers:</span>{' '}
                      <strong className="text-slate-800">{p.presentWorkers}</strong>
                    </div>
                  )}
                  <div className="truncate">
                    <span className="text-slate-400 font-medium">Expense:</span>{' '}
                    <strong className="text-slate-800">₹{p.todayExpense}</strong>
                  </div>
                  <div className="truncate">
                    <span className="text-slate-400 font-medium">Due:</span>{' '}
                    <strong className="text-amber-600">₹{p.totalDue.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="truncate">
                    <span className="text-slate-400 font-medium">Stock Alert:</span>{' '}
                    <strong className={p.outOfStockCount > 0 ? 'text-red-600 font-extrabold' : 'text-slate-800'}>
                      {p.outOfStockCount || 0}
                    </strong>
                  </div>
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
