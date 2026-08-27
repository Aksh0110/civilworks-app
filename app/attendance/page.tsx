'use client';

import React, { useEffect, useMemo, useState } from 'react';
import AppShell from '@/components/AppShell';
import { useProject } from '@/lib/context/ProjectContext';

type AttendanceStatus = 'PRESENT' | 'HALF_DAY' | 'ABSENT';

interface WorkerItem {
  _id: string;
  name: string;
  category: string;
  dailyRate: number;
  mobile?: string;
  workerIdCode?: string;
}

export default function AttendancePage() {
  const { activeProject } = useProject();
  const [activeTab, setActiveTab] = useState<'MARK' | 'HISTORY' | 'AUDIT'>('MARK');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [workers, setWorkers] = useState<WorkerItem[]>([]);
  const [statusMap, setStatusMap] = useState<Record<string, AttendanceStatus>>({});
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PRESENT' | 'HALF_DAY' | 'ABSENT'>('ALL');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [history, setHistory] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Load active workers and existing attendance for selected date & project
  const loadAttendanceData = async () => {
    if (!activeProject?._id) return;
    try {
      setLoading(true);
      setErrorMsg('');
      setSavedSuccess(false);

      // Fetch workers
      const workersRes = await fetch(`/api/workers?projectId=${activeProject._id}&status=ACTIVE`);
      const workersData = await workersRes.json();
      const list: WorkerItem[] = workersData.data || [];
      setWorkers(list);

      // Fetch existing attendance records
      const attRes = await fetch(`/api/attendance?projectId=${activeProject._id}&date=${date}`);
      const attData = await attRes.json();
      const existingRecords: any[] = attData.data || [];

      // Initialize status map: default PRESENT for workers with no record
      const initialMap: Record<string, AttendanceStatus> = {};
      list.forEach((w) => {
        initialMap[w._id] = 'PRESENT';
      });

      existingRecords.forEach((rec) => {
        const wId = typeof rec.workerId === 'object' ? rec.workerId._id : rec.workerId;
        if (wId && initialMap[wId] !== undefined) {
          initialMap[wId] = rec.status;
        }
      });

      setStatusMap(initialMap);
    } catch (err: any) {
      console.error('Error loading attendance:', err);
      setErrorMsg('Failed to load workers/attendance. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    if (!activeProject?._id) return;
    try {
      const res = await fetch(`/api/attendance/history?projectId=${activeProject._id}`);
      const data = await res.json();
      setHistory(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const res = await fetch('/api/audit?entity=Attendance&limit=20');
      const data = await res.json();
      setAuditLogs(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'MARK') {
      void loadAttendanceData();
    } else if (activeTab === 'HISTORY') {
      void loadHistory();
    } else if (activeTab === 'AUDIT') {
      void loadAuditLogs();
    }
  }, [activeProject?._id, date, activeTab]);

  // Fast Bulk Action: Mark All Present
  const markAllPresent = () => {
    const updated: Record<string, AttendanceStatus> = {};
    workers.forEach((w) => {
      updated[w._id] = 'PRESENT';
    });
    setStatusMap(updated);
  };

  // Immediate counts calculation
  const counts = useMemo(() => {
    let p = 0;
    let hd = 0;
    let a = 0;
    Object.values(statusMap).forEach((st) => {
      if (st === 'PRESENT') p++;
      else if (st === 'HALF_DAY') hd++;
      else if (st === 'ABSENT') a++;
    });
    return { PRESENT: p, HALF_DAY: hd, ABSENT: a, TOTAL: workers.length };
  }, [statusMap, workers]);

  // Real-time automatic wage calculation
  const estimatedDailyWage = useMemo(() => {
    return workers.reduce((acc, w) => {
      const st = statusMap[w._id] || 'PRESENT';
      if (st === 'PRESENT') return acc + w.dailyRate;
      if (st === 'HALF_DAY') return acc + Math.round(w.dailyRate * 0.5);
      return acc;
    }, 0);
  }, [workers, statusMap]);

  // Filter workers by search and status filter
  const displayedWorkers = useMemo(() => {
    return workers.filter((w) => {
      const st = statusMap[w._id] || 'PRESENT';
      const matchStatus = filterStatus === 'ALL' || st === filterStatus;
      const matchSearch =
        !search.trim() ||
        w.name.toLowerCase().includes(search.toLowerCase()) ||
        w.category.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [workers, statusMap, filterStatus, search]);

  // Save Attendance handler
  const handleSave = async () => {
    if (!activeProject?._id) return;
    try {
      setSaving(true);
      setErrorMsg('');
      setSavedSuccess(false);

      const recordsPayload = workers.map((w) => ({
        workerId: w._id,
        status: statusMap[w._id] || 'PRESENT'
      }));

      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: activeProject._id,
          date,
          records: recordsPayload
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to save attendance');
      }

      setSavedSuccess(true);
      if (activeTab === 'HISTORY') void loadHistory();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error saving attendance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <main className="content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Attendance Register</h1>
            <p className="subtle">
              {activeProject ? activeProject.name : 'Select project site'}
            </p>
          </div>
          <div className="date-picker-wrap">
            <input
              type="date"
              className="date-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="tab-bar">
          <button
            className={`tab-btn ${activeTab === 'MARK' ? 'active' : ''}`}
            onClick={() => setActiveTab('MARK')}
          >
            📋 Mark Daily
          </button>
          <button
            className={`tab-btn ${activeTab === 'HISTORY' ? 'active' : ''}`}
            onClick={() => setActiveTab('HISTORY')}
          >
            📜 History
          </button>
          <button
            className={`tab-btn ${activeTab === 'AUDIT' ? 'active' : ''}`}
            onClick={() => setActiveTab('AUDIT')}
          >
            🛡️ Audit Log
          </button>
        </div>

        {activeTab === 'MARK' && (
          <>
            {/* Top Summary Header */}
            <div className="summary-cards-grid">
              <div className="summary-card p-card">
                <span className="card-lbl">Present</span>
                <strong className="card-val">{counts.PRESENT}</strong>
              </div>
              <div className="summary-card hd-card">
                <span className="card-lbl">Half Day</span>
                <strong className="card-val">{counts.HALF_DAY}</strong>
              </div>
              <div className="summary-card a-card">
                <span className="card-lbl">Absent</span>
                <strong className="card-val">{counts.ABSENT}</strong>
              </div>
              <div className="summary-card wage-card">
                <span className="card-lbl">Est. Wage</span>
                <strong className="card-val">₹{estimatedDailyWage.toLocaleString('en-IN')}</strong>
              </div>
            </div>

            {/* Success Banner */}
            {savedSuccess && (
              <div className="success-banner">
                <div className="success-icon">✓</div>
                <div>
                  <strong>Attendance Saved Successfully!</strong>
                  <div className="subtle-light">
                    {counts.PRESENT} Present · {counts.HALF_DAY} Half Day · {counts.ABSENT} Absent
                    · Daily Labour Cost: ₹{estimatedDailyWage.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            )}

            {errorMsg && <div className="error-banner">{errorMsg}</div>}

            {/* Quick Bulk Action Bar & Search */}
            <div className="actions-toolbar">
              <button className="btn btn-secondary bulk-btn" onClick={markAllPresent}>
                ⚡ Mark All Present
              </button>
              <input
                type="text"
                className="search-input"
                placeholder="🔍 Search worker..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Filter Pills */}
            <div className="chip-filters">
              <button
                className={`chip ${filterStatus === 'ALL' ? 'active' : ''}`}
                onClick={() => setFilterStatus('ALL')}
              >
                All ({counts.TOTAL})
              </button>
              <button
                className={`chip ${filterStatus === 'PRESENT' ? 'active' : ''}`}
                onClick={() => setFilterStatus('PRESENT')}
              >
                Present ({counts.PRESENT})
              </button>
              <button
                className={`chip ${filterStatus === 'HALF_DAY' ? 'active' : ''}`}
                onClick={() => setFilterStatus('HALF_DAY')}
              >
                Half Day ({counts.HALF_DAY})
              </button>
              <button
                className={`chip ${filterStatus === 'ABSENT' ? 'active' : ''}`}
                onClick={() => setFilterStatus('ABSENT')}
              >
                Absent ({counts.ABSENT})
              </button>
            </div>

            {/* Worker Attendance List */}
            {!activeProject ? (
              <div className="card warning-card">
                Please select a project site from the header dropdown to mark attendance.
              </div>
            ) : loading ? (
              <div className="card loading-card">Loading site worker list...</div>
            ) : displayedWorkers.length === 0 ? (
              <div className="card empty-card">
                <h3>No workers match filter</h3>
                <p className="subtle">Add workers in the "Workers" tab or clear search filters.</p>
              </div>
            ) : (
              <div className="list attendance-list">
                {displayedWorkers.map((worker) => {
                  const currentSt = statusMap[worker._id] || 'PRESENT';
                  return (
                    <div key={worker._id} className="list-item worker-att-item">
                      <div className="worker-att-info">
                        <strong>{worker.name}</strong>
                        <div className="subtle">
                          {worker.category} · <span className="rate-text">₹{worker.dailyRate}/day</span>
                        </div>
                      </div>

                      <div className="attendance-buttons">
                        <button
                          className={`att-btn p ${currentSt === 'PRESENT' ? 'active' : ''}`}
                          onClick={() => setStatusMap({ ...statusMap, [worker._id]: 'PRESENT' })}
                          type="button"
                          aria-label={`Mark ${worker.name} Present`}
                        >
                          P
                        </button>
                        <button
                          className={`att-btn hd ${currentSt === 'HALF_DAY' ? 'active' : ''}`}
                          onClick={() => setStatusMap({ ...statusMap, [worker._id]: 'HALF_DAY' })}
                          type="button"
                          aria-label={`Mark ${worker.name} Half Day`}
                        >
                          HD
                        </button>
                        <button
                          className={`att-btn a ${currentSt === 'ABSENT' ? 'active' : ''}`}
                          onClick={() => setStatusMap({ ...statusMap, [worker._id]: 'ABSENT' })}
                          type="button"
                          aria-label={`Mark ${worker.name} Absent`}
                        >
                          A
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Sticky Save Footer */}
            {workers.length > 0 && (
              <div className="sticky-save-footer">
                <div className="footer-summary">
                  <strong>{counts.PRESENT} P · {counts.HALF_DAY} HD · {counts.ABSENT} A</strong>
                  <div className="subtle-light">Labour Cost: ₹{estimatedDailyWage.toLocaleString('en-IN')}</div>
                </div>
                <button
                  className="btn btn-primary save-att-btn"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Attendance ✓'}
                </button>
              </div>
            )}
          </>
        )}

        {/* History Tab */}
        {activeTab === 'HISTORY' && (
          <div className="grid history-list">
            {history.length === 0 ? (
              <div className="card empty-card">No past attendance records found for this project.</div>
            ) : (
              history.map((item) => (
                <div key={item._id} className="card history-card">
                  <div className="history-date">
                    <strong>📅 {new Date(item.date).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</strong>
                  </div>
                  <div className="history-stats">
                    <span className="tag p">{item.presentCount} Present</span>
                    <span className="tag hd">{item.halfDayCount} Half Day</span>
                    <span className="tag a">{item.absentCount} Absent</span>
                  </div>
                  <div className="history-cost">
                    Total Wage: <strong>₹{(item.totalWageCost || 0).toLocaleString('en-IN')}</strong>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Audit Log Tab */}
        {activeTab === 'AUDIT' && (
          <div className="grid audit-list">
            {auditLogs.length === 0 ? (
              <div className="card empty-card">No audit logs found.</div>
            ) : (
              auditLogs.map((log) => (
                <div key={log._id} className="card audit-card">
                  <div className="audit-header">
                    <strong>{log.action}</strong>
                    <span className="subtle">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="subtle">By: {log.user}</div>
                  {log.metadata && (
                    <div className="audit-meta">
                      {JSON.stringify(log.metadata)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </AppShell>
  );
}
