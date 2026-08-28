'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { useProject } from './ProjectContext';
import { IProjectModules } from '../models/Project';

export const DEFAULT_MODULES: IProjectModules = {
  workers: true,
  attendance: true,
  materials: true,
  expenses: true,
  vendors: true,
  progress: true,
  payments: true,
  documents: true,
  reports: true
};

interface ModuleContextType {
  enabledModules: IProjectModules;
  isModuleEnabled: (key: keyof IProjectModules) => boolean;
  updateModules: (newSettings: Partial<IProjectModules>) => Promise<void>;
}

const ModuleContext = createContext<ModuleContextType>({
  enabledModules: DEFAULT_MODULES,
  isModuleEnabled: () => true,
  updateModules: async () => {}
});

export function ModuleProvider({ children }: { children: React.ReactNode }) {
  const { activeProject, refreshProjects } = useProject();

  const enabledModules = useMemo<IProjectModules>(() => {
    if (!activeProject?.modules) return DEFAULT_MODULES;
    return {
      ...DEFAULT_MODULES,
      ...activeProject.modules
    };
  }, [activeProject?.modules]);

  const isModuleEnabled = (key: keyof IProjectModules): boolean => {
    return enabledModules[key] !== false;
  };

  const updateModules = async (newSettings: Partial<IProjectModules>) => {
    if (!activeProject?._id) return;
    const merged = { ...enabledModules, ...newSettings };
    const res = await fetch(`/api/projects/${activeProject._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modules: merged })
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Failed to update module settings');
    }

    await refreshProjects();
  };

  return (
    <ModuleContext.Provider value={{ enabledModules, isModuleEnabled, updateModules }}>
      {children}
    </ModuleContext.Provider>
  );
}

export function useModules() {
  return useContext(ModuleContext);
}
