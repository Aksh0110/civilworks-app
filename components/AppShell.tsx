'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import BottomNav from './BottomNav';
import { useProject } from '@/lib/context/ProjectContext';
import { useAuth } from '@/lib/context/AuthContext';
import ProjectModal from './ProjectModal';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { projects, activeProject, setActiveProjectId, loading } = useProject();
  const { user, logout } = useAuth();
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

        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2">

              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-black text-slate-800">{user.name}</span>
                <span className="text-[10px] font-bold text-[#087F3E] uppercase">{user.role}</span>
              </div>
              <button
                onClick={() => logout()}
                className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-[11px] font-bold rounded-lg transition-colors"
                title={`Logged in as ${user.email}`}
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-3 py-1 bg-[#087F3E] text-white text-xs font-bold rounded-lg"
            >
              Sign In
            </Link>
          )}

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
      </div>
    </header>

      {children}

      <BottomNav />

      <ProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
