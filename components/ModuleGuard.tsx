'use client';

import React from 'react';
import Link from 'next/link';
import { useModules } from '@/lib/context/ModuleContext';
import { useProject } from '@/lib/context/ProjectContext';
import { IProjectModules } from '@/lib/models/Project';

interface ModuleGuardProps {
  module: keyof IProjectModules;
  moduleName?: string;
  children: React.ReactNode;
}

export default function ModuleGuard({ module, moduleName, children }: ModuleGuardProps) {
  const { isModuleEnabled } = useModules();
  const { activeProject } = useProject();

  if (isModuleEnabled(module)) {
    return <>{children}</>;
  }

  const displayName = moduleName || module.charAt(0).toUpperCase() + module.slice(1);

  return (
    <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-5">
      <div className="w-16 h-16 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-sm">
        🔒
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-slate-900">{displayName} Module Disabled</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          The <span className="font-semibold text-slate-700">{displayName}</span> feature module is currently turned off for{' '}
          <span className="font-bold text-[#087F3E]">{activeProject?.name || 'this project'}</span>.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
        <Link
          href="/"
          className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
        >
          ← Back to Dashboard
        </Link>
        <Link
          href="/settings/modules"
          className="w-full sm:w-auto px-5 py-2.5 bg-[#087F3E] hover:bg-[#056B34] text-white text-xs font-extrabold rounded-xl shadow transition-colors"
        >
          ⚙️ Open Module Control Panel
        </Link>
      </div>
    </div>
  );
}
