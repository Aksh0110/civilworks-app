'use client';

import React, { useState } from 'react';
import AppShell from '@/components/AppShell';
import { useProject } from '@/lib/context/ProjectContext';
import ProjectModal from '@/components/ProjectModal';

export default function ProjectsPage() {
  const { projects, activeProject, setActiveProjectId, refreshProjects, loading } = useProject();
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredProjects = projects.filter((p) => {
    if (filter === 'ALL') return true;
    return p.status === filter;
  });

  return (
    <AppShell>
      <main className="content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Projects</h1>
            <p className="subtle">Manage active construction sites & project profiles</p>
          </div>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            + New Project
          </button>
        </div>

        <div className="chip-filters">
          {(['ALL', 'ACTIVE', 'ON_HOLD', 'COMPLETED'] as const).map((f) => (
            <button
              key={f}
              className={`chip ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'ALL' ? 'All Sites' : f === 'ACTIVE' ? 'Active' : f === 'ON_HOLD' ? 'On Hold' : 'Completed'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="card loading-card">Loading project sites...</div>
        ) : filteredProjects.length === 0 ? (
          <div className="card empty-card">
            <h3>No projects found</h3>
            <p className="subtle">Click "+ New Project" to add your first construction project.</p>
          </div>
        ) : (
          <div className="grid project-list">
            {filteredProjects.map((project) => {
              const isActiveChoice = activeProject?._id === project._id;
              return (
                <div key={project._id} className={`card project-card ${isActiveChoice ? 'selected-project' : ''}`}>
                  <div className="project-card-header">
                    <div>
                      <span className="project-code-badge">{project.code}</span>
                      <h2 className="project-title">{project.name}</h2>
                    </div>
                    <span className={`status-tag ${project.status.toLowerCase()}`}>
                      {project.status === 'ACTIVE' ? 'Active' : project.status === 'ON_HOLD' ? 'On Hold' : 'Completed'}
                    </span>
                  </div>

                  {project.location && (
                    <div className="project-meta">
                      <span className="meta-icon">📍</span> {project.location}
                    </div>
                  )}

                  <div className="project-card-actions">
                    {isActiveChoice ? (
                      <span className="active-badge">✓ Current Active Site</span>
                    ) : (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setActiveProjectId(project._id)}
                      >
                        Set as Active Site
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <ProjectModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={refreshProjects}
        />
      </main>
    </AppShell>
  );
}
