'use client';

import { useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { useProject } from '@/lib/context/ProjectContext';

export default function CreateProjectPage() {
  const { setActiveProjectId, refreshProjects } = useProject();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'ON_HOLD' | 'COMPLETED'>('ACTIVE');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedEndDate, setExpectedEndDate] = useState('');
  const [siteContact, setSiteContact] = useState('');
  const [managerName, setManagerName] = useState('');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successProject, setSuccessProject] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      setError('Project name and code are required.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim().toUpperCase(),
          location: location.trim() || undefined,
          status,
          startDate,
          expectedEndDate: expectedEndDate || undefined,
          siteContact: siteContact.trim() || undefined,
          managerName: managerName.trim() || undefined,
          notes: notes.trim() || undefined,
          user: 'Site Supervisor'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create project.');
      }

      await refreshProjects();
      setActiveProjectId(data.data._id);
      setSuccessProject(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (successProject) {
    return (
      <AppShell>
        <main className="content max-w-lg mx-auto py-6 space-y-6">
          <div className="bg-emerald-950/80 border border-emerald-800/80 p-6 rounded-2xl text-center space-y-4 shadow-xl">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center text-3xl mx-auto">
              ✓
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-emerald-100">Project Created Successfully ✓</h2>
              <p className="text-xs text-emerald-300/80 mt-1">{successProject.name} ({successProject.code})</p>
            </div>

            <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl space-y-2 text-left text-xs">
              <div className="flex justify-between">
                <span className="text-stone-400">Code:</span>
                <span className="font-semibold text-stone-200">{successProject.code}</span>
              </div>
              {successProject.location && (
                <div className="flex justify-between">
                  <span className="text-stone-400">Location:</span>
                  <span className="font-semibold text-stone-200">{successProject.location}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-stone-400">Status:</span>
                <span className="font-semibold text-emerald-400">{successProject.status}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href={`/projects/${successProject._id}`}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-xs rounded-xl transition-colors text-center"
              >
                Open Project Command Center →
              </Link>
              <Link
                href="/projects"
                className="flex-1 py-3 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs rounded-xl transition-colors text-center"
              >
                Done
              </Link>
            </div>
          </div>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="content space-y-6 pb-20 max-w-2xl mx-auto">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-900 border border-stone-800 p-5 rounded-2xl">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">➕</span>
              <h1 className="text-xl font-bold text-stone-100">Create Site Project</h1>
            </div>
            <p className="text-xs text-stone-400 mt-1">Setup a new construction site or project location.</p>
          </div>

          <Link
            href="/projects"
            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold rounded-xl"
          >
            ← Back
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="bg-stone-900 border border-stone-800 p-6 rounded-2xl space-y-5">
          {error && (
            <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          {/* Project Name & Code */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-stone-300 mb-1">
                Project Name <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Green Heights Residential Tower"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!code) setCode(e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase());
                }}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-sm font-bold text-stone-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-300 mb-1">
                Project Code <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. GH-01"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-sm font-bold text-amber-400 uppercase focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Location & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-300 mb-1">Location / Address</label>
              <input
                type="text"
                placeholder="e.g. Sector 62, Gurgaon"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-300 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
              >
                <option value="ACTIVE">Active Site</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-300 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-300 mb-1">Expected End Date (Optional)</label>
              <input
                type="date"
                value={expectedEndDate}
                onChange={(e) => setExpectedEndDate(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Contacts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-300 mb-1">Site Contact Phone</label>
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                value={siteContact}
                onChange={(e) => setSiteContact(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-300 mb-1">Project Manager Name</label>
              <input
                type="text"
                placeholder="e.g. Rajesh Kumar"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-stone-300 mb-1">Notes / Scope (Optional)</label>
            <textarea
              rows={2}
              placeholder="e.g. Residential G+14 structure, 120 flats"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-stone-950 text-base font-extrabold rounded-xl transition-all shadow-lg text-center disabled:opacity-50"
          >
            {submitting ? 'Creating Project...' : 'Save & Create Project ✓'}
          </button>
        </form>
      </main>
    </AppShell>
  );
}
