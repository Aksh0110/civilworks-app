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
  const [localOverrides, setLocalOverrides] = React.useState<Record<string, Partial<IProjectModules>>>({});

  const enabledModules = useMemo<IProjectModules>(() => {
    const pId = activeProject?._id;
    const baseModules = activeProject?.modules || DEFAULT_MODULES;
    const override = pId ? localOverrides[pId] : null;

    return {
      ...DEFAULT_MODULES,
      ...baseModules,
      ...(override || {})
    };
  }, [activeProject?._id, activeProject?.modules, localOverrides]);

  const isModuleEnabled = (key: keyof IProjectModules): boolean => {
    return enabledModules[key] !== false;
  };

  const updateModules = async (newSettings: Partial<IProjectModules>) => {
    if (!activeProject?._id) {
      throw new Error('Please select an active project site first to configure module settings.');
    }
    const pId = activeProject._id;
    const merged = { ...enabledModules, ...newSettings };

    // Optimistically apply state change immediately
    setLocalOverrides((prev) => ({
      ...prev,
      [pId]: merged
    }));

    try {
      const res = await fetch(`/api/projects/${pId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modules: merged })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to update module settings');
      }

      await refreshProjects();
    } catch (err) {
      // Revert optimistic override if API call fails
      setLocalOverrides((prev) => {
        const copy = { ...prev };
        delete copy[pId];
        return copy;
      });
      throw err;
    }
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
