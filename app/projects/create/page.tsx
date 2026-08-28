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
          <div className="bg-[#EAF7EF] border border-[#bce6cb] p-6 rounded-2xl text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 bg-[#087F3E] text-white rounded-full flex items-center justify-center text-3xl mx-auto font-black shadow">
              ✓
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-[#056B34]">Project Created Successfully ✓</h2>
              <p className="text-xs text-slate-600 mt-1">{successProject.name} ({successProject.code})</p>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-2 text-left text-xs shadow-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Code:</span>
                <span className="font-semibold text-slate-900">{successProject.code}</span>
              </div>
              {successProject.location && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Location:</span>
                  <span className="font-semibold text-slate-900">{successProject.location}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="font-semibold text-[#087F3E]">{successProject.status}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href={`/projects/${successProject._id}`}
                className="flex-1 py-3 bg-[#087F3E] hover:bg-[#056B34] text-white font-extrabold text-xs rounded-xl transition-colors text-center shadow"
              >
                Open Project Command Center →
              </Link>
              <Link
                href="/projects"
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors text-center"
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">➕</span>
              <h1 className="text-xl font-bold text-slate-900">Create Site Project</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">Setup a new construction site or project location.</p>
          </div>

          <Link
            href="/projects"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
          >
            ← Back
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 p-6 rounded-2xl space-y-5 shadow-sm">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-bold">
              {error}
            </div>
          )}

          {/* Project Name & Code */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Project Name <span className="text-red-500">*</span>
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
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#087F3E]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Project Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. GH-01"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-[#087F3E] uppercase focus:outline-none focus:border-[#087F3E]"
              />
            </div>
          </div>

          {/* Location & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Location / Address</label>
              <input
                type="text"
                placeholder="e.g. Sector 62, Gurgaon"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#087F3E]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#087F3E]"
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#087F3E]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Expected End Date (Optional)</label>
              <input
                type="date"
                value={expectedEndDate}
                onChange={(e) => setExpectedEndDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#087F3E]"
              />
            </div>
          </div>

          {/* Contacts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Site Contact Phone</label>
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                value={siteContact}
                onChange={(e) => setSiteContact(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#087F3E]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Project Manager Name</label>
              <input
                type="text"
                placeholder="e.g. Rajesh Kumar"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#087F3E]"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Scope (Optional)</label>
            <textarea
              rows={2}
              placeholder="e.g. Residential G+14 structure, 120 flats"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-[#087F3E]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-[#087F3E] hover:bg-[#056B34] text-white text-base font-extrabold rounded-xl transition-all shadow text-center disabled:opacity-50"
          >
            {submitting ? 'Creating Project...' : 'Save & Create Project ✓'}
          </button>
        </form>
      </main>
    </AppShell>
  );
}
