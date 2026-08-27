'use client';

import React, { useEffect, useState } from 'react';
import { useProject } from '@/lib/context/ProjectContext';

interface WorkerModalProps {
  isOpen: boolean;
  workerToEdit?: any | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function WorkerModal({ isOpen, workerToEdit, onClose, onSuccess }: WorkerModalProps) {
  const { activeProject } = useProject();
  const [categories, setCategories] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('General Labour');
  const [mobile, setMobile] = useState('');
  const [dailyRate, setDailyRate] = useState('700');
  const [workerIdCode, setWorkerIdCode] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setCategories(data.data);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (workerToEdit) {
      setName(workerToEdit.name || '');
      setCategory(workerToEdit.category || 'General Labour');
      setMobile(workerToEdit.mobile || '');
      setDailyRate(String(workerToEdit.dailyRate || '700'));
      setWorkerIdCode(workerToEdit.workerIdCode || '');
      setStatus(workerToEdit.status || 'ACTIVE');
      setNotes(workerToEdit.notes || '');
    } else {
      setName('');
      setCategory('General Labour');
      setMobile('');
      setDailyRate('700');
      setWorkerIdCode('');
      setStatus('ACTIVE');
      setNotes('');
    }
  }, [workerToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject?._id) {
      setError('Please select an active project first.');
      return;
    }
    if (!name.trim() || !category || !dailyRate) {
      setError('Worker name, category, and daily wage rate are required.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const url = workerToEdit ? `/api/workers/${workerToEdit._id}` : '/api/workers';
      const method = workerToEdit ? 'PUT' : 'POST';

      const body = {
        projectId: activeProject._id,
        name: name.trim(),
        category,
        mobile: mobile.trim(),
        dailyRate: Number(dailyRate),
        workerIdCode: workerIdCode.trim(),
        status,
        notes: notes.trim()
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to save worker');
      }

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <h3>{workerToEdit ? 'Edit Worker' : 'Add New Worker'}</h3>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          {error && <div className="error-banner">{error}</div>}

          <div className="field">
            <label>Worker Full Name *</label>
            <input
              type="text"
              placeholder="e.g. Ramesh Kumar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label>Worker Category *</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Daily Rate (₹/day) *</label>
            <input
              type="number"
              inputMode="numeric"
              placeholder="e.g. 800"
              value={dailyRate}
              onChange={(e) => setDailyRate(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label>Mobile Number</label>
            <input
              type="tel"
              inputMode="tel"
              placeholder="e.g. 9876543210"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Worker ID Code (Optional)</label>
            <input
              type="text"
              placeholder="e.g. W-102"
              value={workerIdCode}
              onChange={(e) => setWorkerIdCode(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div className="field">
            <label>Notes (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Skilled in tile fitting"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : workerToEdit ? 'Save Changes' : 'Add Worker'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
