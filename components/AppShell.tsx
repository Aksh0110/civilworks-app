'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import BottomNav from './BottomNav';
import { useProject } from '@/lib/context/ProjectContext';
import ProjectModal from './ProjectModal';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { projects, activeProject, setActiveProjectId, loading } = useProject();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="brand">
            <span className="brand-icon">🏗️</span> CivilWorks
          </div>
        </Link>

        <div className="project-selector-wrapper">
          <button
            className="project-pill"
            onClick={() => setShowDropdown(!showDropdown)}
            aria-label="Switch project"
          >
            <span className="project-name">
              {loading
                ? 'Loading...'
                : activeProject
                ? activeProject.name
                : 'Select Project'}
            </span>
            <span className="caret">▾</span>
          </button>

          {showDropdown && (
            <div className="project-dropdown">
              <div className="dropdown-title">Select Active Project</div>
              {projects.map((proj) => (
                <button
                  key={proj._id}
                  className={`dropdown-item ${activeProject?._id === proj._id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveProjectId(proj._id);
                    setShowDropdown(false);
                  }}
                >
                  <div>
                    <strong>{proj.name}</strong>
                    <div className="subtle" style={{ fontSize: '11px' }}>
                      {proj.code} {proj.location ? `· ${proj.location}` : ''}
                    </div>
                  </div>
                  {activeProject?._id === proj._id && <span className="check">✓</span>}
                </button>
              ))}

              {activeProject && (
                <>
                  <div className="dropdown-divider" />
                  <button
                    className="dropdown-item text-red-600 font-bold"
                    onClick={() => {
                      setActiveProjectId(null);
                      setShowDropdown(false);
                    }}
                  >
                    <span>🚫</span> Clear Active Selection
                  </button>
                </>
              )}

              <div className="dropdown-divider" />
              <button
                className="dropdown-item add-btn"
                onClick={() => {
                  setShowDropdown(false);
                  setIsModalOpen(true);
                }}
              >
                <span>➕</span> Create New Project
              </button>
            </div>
          )}
        </div>
      </header>

      {children}

      <BottomNav />

      <ProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
