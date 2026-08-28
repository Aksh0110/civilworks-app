'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useProject } from '@/lib/context/ProjectContext';
import WorkTypeModal from '@/components/WorkTypeModal';

interface WorkTypeOption {
  _id: string;
  name: string;
  defaultUnit: string;
  icon: string;
}

interface DraftWorkItem {
  id: string;
  workTypeId: string;
  workTypeName: string;
  workTypeIcon: string;
  quantity: string;
  unit: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';
  location: string;
  remark: string;
}

interface DraftIssue {
  id: string;
  issueType: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
}

interface DraftPhoto {
  id: string;
  url: string;
  caption: string;
}

export default function WorkUpdatePage() {
  const { activeProject } = useProject();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [weather, setWeather] = useState('Sunny / Clear');
  const [workTypes, setWorkTypes] = useState<WorkTypeOption[]>([]);
  const [units, setUnits] = useState<string[]>([]);
  
  // Auto-populated metrics
  const [workforceCount, setWorkforceCount] = useState<number>(0);
  const [labourCost, setLabourCost] = useState<number>(0);

  // Form Draft Lists
  const [workItems, setWorkItems] = useState<DraftWorkItem[]>([]);
  const [issues, setIssues] = useState<DraftIssue[]>([]);
  const [photos, setPhotos] = useState<DraftPhoto[]>([]);

  // Modals & UI States
  const [isWorkTypeModalOpen, setIsWorkTypeModalOpen] = useState(false);
  const [isWorkTypeSelectOpen, setIsWorkTypeSelectOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copyLoading, setCopyLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successResult, setSuccessResult] = useState<any>(null);

  useEffect(() => {
    loadCatalog();
  }, []);

  useEffect(() => {
    if (!activeProject?._id || !date) return;
    loadAttendanceMetrics();
    loadExistingProgress();
  }, [activeProject?._id, date]);

  const loadCatalog = () => {
    setLoading(true);
    fetch('/api/progress/work-types')
      .then((r) => r.json())
      .then((d) => {
        if (d.data) {
          setWorkTypes(d.data.workTypes || []);
          setUnits(d.data.units || []);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const loadAttendanceMetrics = () => {
    if (!activeProject?._id || !date) return;
    fetch(`/api/attendance/summary?projectId=${activeProject._id}&date=${date}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.data) {
          setWorkforceCount(d.data.presentCount || 0);
          setLabourCost(d.data.totalWageCost || 0);
        }
      })
      .catch((err) => console.error(err));
  };

  const loadExistingProgress = () => {
    if (!activeProject?._id || !date) return;
    fetch(`/api/progress?projectId=${activeProject._id}&date=${date}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.data && d.data.workItems?.length > 0) {
          setWeather(d.data.weather || 'Sunny / Clear');
          setWorkItems(
            d.data.workItems.map((item: any, idx: number) => ({
              id: `existing-${idx}-${Date.now()}`,
              workTypeId: item.workTypeId,
              workTypeName: item.workTypeName,
              workTypeIcon: item.workTypeIcon || '🏗️',
              quantity: String(item.quantity),
              unit: item.unit,
              status: item.status,
              location: item.location || '',
              remark: item.remark || ''
            }))
          );
          if (d.data.issues) {
            setIssues(
              d.data.issues.map((iss: any, idx: number) => ({
                id: `iss-${idx}`,
                issueType: iss.issueType,
                severity: iss.severity,
                description: iss.description
              }))
            );
          }
          if (d.data.photos) {
            setPhotos(
              d.data.photos.map((ph: any, idx: number) => ({
                id: `ph-${idx}`,
                url: ph.url,
                caption: ph.caption || ''
              }))
            );
          }
        }
      })
      .catch((err) => console.error(err));
  };

  const handleCopyYesterday = async () => {
    if (!activeProject?._id) return;
    setCopyLoading(true);
    setError('');

    try {
      const res = await fetch('/api/progress/copy-previous', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: activeProject._id, date })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to copy yesterday');

      if (!data.data?.draftWorkItems || data.data.draftWorkItems.length === 0) {
        setError('No previous work items found for yesterday.');
        return;
      }

      const copiedDrafts = data.data.draftWorkItems.map((item: any, idx: number) => ({
        id: `copied-${idx}-${Date.now()}`,
        workTypeId: item.workTypeId,
        workTypeName: item.workTypeName,
        workTypeIcon: item.workTypeIcon || '🏗️',
        quantity: String(item.quantity),
        unit: item.unit,
        status: item.status,
        location: item.location || '',
        remark: item.remark || ''
      }));

      setWorkItems((prev) => [...prev, ...copiedDrafts]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCopyLoading(false);
    }
  };

  const addWorkItem = (wt: WorkTypeOption) => {
    setWorkItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        workTypeId: wt._id,
        workTypeName: wt.name,
        workTypeIcon: wt.icon || '🏗️',
        quantity: '',
        unit: wt.defaultUnit,
        status: 'IN_PROGRESS',
        location: '',
        remark: ''
      }
    ]);
    setIsWorkTypeSelectOpen(false);
  };

  const updateWorkItem = (id: string, field: keyof DraftWorkItem, value: any) => {
    setWorkItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const removeWorkItem = (id: string) => {
    setWorkItems((prev) => prev.filter((item) => item.id !== id));
  };

  const addIssue = () => {
    setIssues((prev) => [
      ...prev,
      {
        id: `iss-${Date.now()}`,
        issueType: 'Material Delay',
        severity: 'MEDIUM',
        description: ''
      }
    ]);
  };

  const updateIssue = (id: string, field: keyof DraftIssue, value: any) => {
    setIssues((prev) =>
      prev.map((iss) => (iss.id === id ? { ...iss, [field]: value } : iss))
    );
  };

  const removeIssue = (id: string) => {
    setIssues((prev) => prev.filter((iss) => iss.id !== id));
  };

  const addPhoto = () => {
    setPhotos((prev) => [
      ...prev,
      {
        id: `ph-${Date.now()}`,
        url: '',
        caption: ''
      }
    ]);
  };

  const updatePhoto = (id: string, field: keyof DraftPhoto, value: string) => {
    setPhotos((prev) =>
      prev.map((ph) => (ph.id === id ? { ...ph, [field]: value } : ph))
    );
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((ph) => ph.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject?._id) {
      setError('Please select an active project.');
      return;
    }

    if (workItems.length === 0) {
      setError('Please add at least one work item before saving.');
      return;
    }

    // Validate quantities
    for (const item of workItems) {
      const q = parseFloat(item.quantity);
      if (isNaN(q) || q <= 0) {
        setError(`Please enter a valid positive quantity for "${item.workTypeName}".`);
        return;
      }
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        projectId: activeProject._id,
        date,
        weather,
        workforceCount,
        labourCost,
        workItems: workItems.map((item) => ({
          workTypeId: item.workTypeId,
          quantity: parseFloat(item.quantity),
          unit: item.unit,
          status: item.status,
          location: item.location.trim() || undefined,
          remark: item.remark.trim() || undefined
        })),
        issues: issues
          .filter((iss) => iss.description.trim())
          .map((iss) => ({
            issueType: iss.issueType,
            severity: iss.severity,
            description: iss.description.trim()
          })),
        photos: photos
          .filter((ph) => ph.url.trim())
          .map((ph) => ({
            url: ph.url.trim(),
            caption: ph.caption.trim() || undefined
          }))
      };

      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save daily progress');

      setSuccessResult(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (successResult) {
    const completedCount = successResult.workItems?.filter((i: any) => i.status === 'COMPLETED').length || 0;
    const inProgressCount = successResult.workItems?.filter((i: any) => i.status === 'IN_PROGRESS').length || 0;

    return (
      <div className="max-w-lg mx-auto py-6 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Success Confirmation Banner */}
        <div className="bg-[#EAF7EF] border border-[#bce6cb] p-6 rounded-2xl text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-[#087F3E] text-white rounded-full flex items-center justify-center text-3xl mx-auto font-black shadow">
            ✓
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[#056B34]">Daily Update Saved Successfully!</h2>
            <p className="text-xs text-slate-600 mt-1">
              Recorded for <span className="font-bold text-slate-900">{activeProject?.name}</span> on{' '}
              {new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}.
            </p>
          </div>
        </div>

        {/* Compact Review Card */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Summary Breakdown</h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-xs text-slate-500">Work Items</span>
              <span className="text-xl font-black text-[#087F3E] block">
                {successResult.workItems?.length || 0} Items
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-xs text-slate-500">Status</span>
              <span className="text-xs font-extrabold text-[#056B34] block">
                {completedCount} Done · {inProgressCount} In Progress
              </span>
            </div>
          </div>

          {successResult.issues?.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold">
              ⚠️ {successResult.issues.length} Site Issues Reported
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Link
            href={`/progress/report?date=${date}`}
            className="flex-1 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center justify-center"
          >
            View Daily Report →
          </Link>
          <Link
            href="/progress"
            className="flex-1 h-12 rounded-xl bg-[#087F3E] hover:bg-[#056B34] text-white text-xs font-bold transition-colors flex items-center justify-center shadow"
          >
            Done ✓
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/progress"
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-sm transition-colors font-bold"
          >
            ←
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>✏️</span> Work Update Entry
            </h1>
            <p className="text-xs text-slate-500">
              Site: <span className="text-[#087F3E] font-semibold">{activeProject?.name || 'Select Site'}</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopyYesterday}
          disabled={copyLoading}
          className="px-3 py-2 bg-[#EAF7EF] hover:bg-[#d5edd9] text-[#056B34] border border-[#bce6cb] text-xs font-bold rounded-xl transition-colors shadow flex items-center gap-1.5 shrink-0"
        >
          <span>📋</span> {copyLoading ? 'Copying...' : 'Copy Yesterday'}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-3">
          <span className="text-lg">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Auto-populated Summary Header Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-sm">
          <span className="text-[11px] text-slate-500 uppercase font-bold block">Date</span>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full mt-1 bg-transparent text-slate-900 text-xs font-bold focus:outline-none"
          />
        </div>

        <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-sm">
          <span className="text-[11px] text-slate-500 uppercase font-bold block">Workforce Present</span>
          <span className="text-sm font-black text-[#087F3E] mt-1 block">
            {workforceCount} Workers
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-sm col-span-2 sm:col-span-1">
          <span className="text-[11px] text-slate-500 uppercase font-bold block">Weather</span>
          <select
            value={weather}
            onChange={(e) => setWeather(e.target.value)}
            className="w-full mt-1 bg-transparent text-slate-900 text-xs font-bold focus:outline-none"
          >
            {['Sunny / Clear', 'Cloudy', 'Rain / Monsoon', 'Hot / Extreme'].map((w) => (
              <option key={w} value={w} className="bg-white text-slate-900">
                {w}
              </option>
            ))}
          </select>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Work Items Section */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#087F3E]">
                Daily Work Items * ({workItems.length})
              </h2>
              <p className="text-[11px] text-slate-500">Record structured quantity, unit, status & location</p>
            </div>

            <button
              type="button"
              onClick={() => setIsWorkTypeSelectOpen(true)}
              className="px-3 py-1.5 bg-[#087F3E] hover:bg-[#056B34] text-white text-xs font-bold rounded-xl transition-colors shadow flex items-center gap-1"
            >
              <span>+</span> Add Work
            </button>
          </div>

          {workItems.length === 0 ? (
            <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-2">
              <span className="text-2xl">🏗️</span>
              <p className="text-xs text-slate-500">No work items added yet.</p>
              <button
                type="button"
                onClick={() => setIsWorkTypeSelectOpen(true)}
                className="text-xs text-[#087F3E] font-bold underline"
              >
                Click "+ Add Work" or use "Copy Yesterday"
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {workItems.map((item, index) => (
                <div
                  key={item.id}
                  className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3 relative"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <span className="text-base">{item.workTypeIcon}</span>
                      <span>
                        #{index + 1} {item.workTypeName}
                      </span>
                    </span>

                    <button
                      type="button"
                      onClick={() => removeWorkItem(item.id)}
                      className="text-slate-400 hover:text-red-600 text-sm"
                    >
                      🗑️
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Quantity Input */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                        Quantity Completed *
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0.01"
                        required
                        placeholder="e.g. 420"
                        value={item.quantity}
                        onChange={(e) => updateWorkItem(item.id, 'quantity', e.target.value)}
                        className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-base font-extrabold focus:outline-none focus:border-[#087F3E]"
                      />
                    </div>

                    {/* Unit Selector */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                        Unit *
                      </label>
                      <select
                        value={item.unit}
                        onChange={(e) => updateWorkItem(item.id, 'unit', e.target.value)}
                        className="w-full h-11 px-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs font-bold focus:outline-none focus:border-[#087F3E]"
                      >
                        {units.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Status Selection Buttons */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Status *
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'COMPLETED', label: 'Completed ✓', style: 'bg-[#087F3E] text-white font-bold border-[#087F3E]' },
                        { id: 'IN_PROGRESS', label: 'In Progress ⏳', style: 'bg-amber-500 text-slate-950 font-bold border-amber-400' },
                        { id: 'PENDING', label: 'Pending ⏸️', style: 'bg-slate-200 text-slate-800 font-bold border-slate-300' }
                      ].map((st) => (
                        <button
                          type="button"
                          key={st.id}
                          onClick={() => updateWorkItem(item.id, 'status', st.id as any)}
                          className={`h-9 rounded-lg border text-xs transition-all ${
                            item.status === st.id
                              ? st.style
                              : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Location & Remark */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                        Location / Block / Floor
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Block A / First Floor"
                        value={item.location}
                        onChange={(e) => updateWorkItem(item.id, 'location', e.target.value)}
                        className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-[#087F3E]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                        Remark / Note
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Curing in progress"
                        value={item.remark}
                        onChange={(e) => updateWorkItem(item.id, 'remark', e.target.value)}
                        className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-[#087F3E]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Issues Section */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#087F3E]">
                Site Issues / Delays (Optional)
              </h2>
              <p className="text-[11px] text-slate-500">Log material, labour, or equipment bottlenecks</p>
            </div>

            <button
              type="button"
              onClick={addIssue}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors flex items-center gap-1"
            >
              <span>+</span> Add Issue
            </button>
          </div>

          {issues.map((iss) => (
            <div key={iss.id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <select
                  value={iss.issueType}
                  onChange={(e) => updateIssue(iss.id, 'issueType', e.target.value)}
                  className="bg-white border border-slate-200 text-slate-900 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none"
                >
                  {[
                    'Material Delay',
                    'Labour Shortage',
                    'Equipment Problem',
                    'Weather',
                    'Access Problem',
                    'Quality Issue',
                    'Safety Issue',
                    'Client/Approval Delay',
                    'Other'
                  ].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => removeIssue(iss.id)}
                  className="text-slate-400 hover:text-red-600 text-xs"
                >
                  Remove ✕
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Severity</label>
                <div className="flex gap-2">
                  {[
                    { id: 'HIGH', label: 'High 🔴', style: 'bg-red-100 text-red-800 border-red-200 font-bold' },
                    { id: 'MEDIUM', label: 'Medium 🟡', style: 'bg-amber-100 text-amber-800 border-amber-200 font-bold' },
                    { id: 'LOW', label: 'Low 🟢', style: 'bg-[#EAF7EF] text-[#056B34] border-[#bce6cb] font-bold' }
                  ].map((sev) => (
                    <button
                      type="button"
                      key={sev.id}
                      onClick={() => updateIssue(iss.id, 'severity', sev.id as any)}
                      className={`px-3 py-1 rounded-lg border text-xs font-bold transition-all ${
                        iss.severity === sev.id ? sev.style : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      {sev.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Describe the site issue or delay reason..."
                  value={iss.description}
                  onChange={(e) => updateIssue(iss.id, 'description', e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-[#087F3E]"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Photo Attachment Section */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#087F3E]">
                Site Progress Photos (Optional)
              </h2>
              <p className="text-[11px] text-slate-500">Attach photo links to document physical site progress</p>
            </div>

            <button
              type="button"
              onClick={addPhoto}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors flex items-center gap-1"
            >
              <span>📷</span> Add Photo
            </button>
          </div>

          {photos.map((ph) => (
            <div key={ph.id} className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex gap-3 items-center">
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  placeholder="Photo URL (e.g. /uploads/slab-concrete-26aug.jpg)"
                  value={ph.url}
                  onChange={(e) => updatePhoto(ph.id, 'url', e.target.value)}
                  className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-[#087F3E]"
                />
              </div>

              <button
                type="button"
                onClick={() => removePhoto(ph.id)}
                className="text-slate-400 hover:text-red-600 text-xs shrink-0"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* Primary Submit Button */}
        <button
          type="submit"
          disabled={submitting || workItems.length === 0}
          className="w-full h-14 bg-[#087F3E] hover:bg-[#056B34] disabled:opacity-40 text-white font-extrabold rounded-2xl text-base transition-colors shadow flex items-center justify-center gap-2"
        >
          {submitting ? 'Saving Update...' : '💾 Save Today\'s Update'}
        </button>
      </form>

      {/* Work Type Selection Modal */}
      {isWorkTypeSelectOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-lg bg-white border border-slate-200 rounded-t-2xl sm:rounded-2xl p-6 max-h-[80vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>🏗️</span> Select Work Type
              </h3>
              <button
                onClick={() => setIsWorkTypeSelectOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 py-4 overflow-y-auto">
              {workTypes.map((wt) => (
                <button
                  type="button"
                  key={wt._id}
                  onClick={() => addWorkItem(wt)}
                  className="p-3 bg-slate-50 hover:bg-[#EAF7EF] border border-slate-200 rounded-xl text-center flex flex-col items-center justify-center transition-all group"
                >
                  <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">{wt.icon}</span>
                  <span className="text-xs font-bold text-slate-900 line-clamp-1">{wt.name}</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">{wt.defaultUnit}</span>
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  setIsWorkTypeSelectOpen(false);
                  setIsWorkTypeModalOpen(true);
                }}
                className="text-xs font-bold text-[#087F3E] hover:underline"
              >
                + Custom Work Type
              </button>
              <button
                type="button"
                onClick={() => setIsWorkTypeSelectOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <WorkTypeModal
        isOpen={isWorkTypeModalOpen}
        onClose={() => setIsWorkTypeModalOpen(false)}
        onSuccess={() => loadCatalog()}
      />
    </div>
  );
}
