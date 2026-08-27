'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface ProjectSummary {
  _id: string;
  name: string;
  code: string;
  location?: string;
  status: string;
}

interface ProjectContextType {
  projects: ProjectSummary[];
  activeProject: ProjectSummary | null;
  loading: boolean;
  setActiveProjectId: (id: string) => void;
  refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType>({
  projects: [],
  activeProject: null,
  loading: true,
  setActiveProjectId: () => {},
  refreshProjects: async () => {}
});

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [activeProject, setActiveProject] = useState<ProjectSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error('Failed to fetch projects');
      const data = await res.json();
      const list: ProjectSummary[] = data.data || [];
      setProjects(list);

      const savedId = typeof window !== 'undefined' ? localStorage.getItem('civilworks_active_project') : null;
      let matched = list.find((p) => p._id === savedId);
      if (!matched && list.length > 0) {
        matched = list[0];
      }

      if (matched) {
        setActiveProject(matched);
        if (typeof window !== 'undefined') {
          localStorage.setItem('civilworks_active_project', matched._id);
        }
      } else {
        setActiveProject(null);
      }
    } catch (err) {
      console.error('ProjectContext fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchProjects();
  }, []);

  const handleSelectProject = (id: string) => {
    const matched = projects.find((p) => p._id === id);
    if (matched) {
      setActiveProject(matched);
      if (typeof window !== 'undefined') {
        localStorage.setItem('civilworks_active_project', matched._id);
      }
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
        loading,
        setActiveProjectId: handleSelectProject,
        refreshProjects: fetchProjects
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  return useContext(ProjectContext);
}
