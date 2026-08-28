'use client';

import React, { useState } from 'react';
import { useProject } from '@/lib/context/ProjectContext';

interface ProjectModalProps {
  isOpen: boolean;
  projectToEdit?: any | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ProjectModal({ isOpen, projectToEdit, onClose, onSuccess }: ProjectModalProps) {
  const { refreshProjects, setActiveProjectId } = useProject();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [siteContact, setSiteContact] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (projectToEdit) {
      setName(projectToEdit.name || '');
      setCode(projectToEdit.code || '');
      setLocation(projectToEdit.location || '');
      setStatus(projectToEdit.status || 'ACTIVE');
      setSiteContact(projectToEdit.siteContact || '');
    } else {
      setName('');
      setCode('');
      setLocation('');
      setStatus('ACTIVE');
      setSiteContact('');
    }
  }, [projectToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      setError('Project name and code are required');
      return;
    }

    try {
      setSaving(true);
      setError('');
      const url = projectToEdit ? `/api/projects/${projectToEdit._id}` : '/api/projects';
      const method = projectToEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim().toUpperCase(),
          location: location.trim(),
          status,
          siteContact: siteContact.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || `Failed to ${projectToEdit ? 'update' : 'create'} project`);
      }

      await refreshProjects();
      if (!projectToEdit && data.data?._id) {
        setActiveProjectId(data.data._id);
      }

      setName('');
      setCode('');
      setLocation('');
      setSiteContact('');
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
          <h3>{projectToEdit ? 'Edit Project' : 'Create New Project'}</h3>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          {error && <div className="error-banner">{error}</div>}

          <div className="field">
            <label>Project Name *</label>
            <input
              type="text"
              placeholder="e.g. Green Heights Apartment"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label>Project Code *</label>
            <input
              type="text"
              placeholder="e.g. GH-001"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label>Site Location</label>
            <input
              type="text"
              placeholder="e.g. MG Road, Sector 4"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Site Contact / Supervisor</label>
            <input
              type="text"
              placeholder="e.g. Rajesh Sharma (+91 9876543210)"
              value={siteContact}
              onChange={(e) => setSiteContact(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="ACTIVE">Active</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : projectToEdit ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
