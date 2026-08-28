'use client';

import React, { useEffect, useState, useMemo } from 'react';
import AppShell from '@/components/AppShell';
import { useProject } from '@/lib/context/ProjectContext';
import WorkerModal from '@/components/WorkerModal';
import ConfirmModal from '@/components/ConfirmModal';

export default function WorkersPage() {
  const { activeProject } = useProject();
  const [workers, setWorkers] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'INACTIVE' | 'ALL'>('ACTIVE');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [workerToEdit, setWorkerToEdit] = useState<any | null>(null);
  const [workerToDelete, setWorkerToDelete] = useState<any | null>(null);

  const fetchWorkers = async () => {
    if (!activeProject?._id) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/workers?projectId=${activeProject._id}&status=${statusFilter === 'ALL' ? '' : statusFilter}`);
      const data = await res.json();
      setWorkers(data.data || []);
    } catch (err) {
      console.error('Error loading workers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWorker = async () => {
    if (!workerToDelete) return;
    const res = await fetch(`/api/workers/${workerToDelete._id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Failed to delete worker');
    }
    fetchWorkers();
  };

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setCategories(data.data);
      });
  }, []);

  useEffect(() => {
    void fetchWorkers();
  }, [activeProject?._id, statusFilter]);

  const filteredWorkers = useMemo(() => {
    return workers.filter((w) => {
      const matchCat = selectedCategory === 'ALL' || w.category === selectedCategory;
      const matchSearch =
        !search.trim() ||
        w.name.toLowerCase().includes(search.toLowerCase()) ||
        w.category.toLowerCase().includes(search.toLowerCase()) ||
        (w.mobile && w.mobile.includes(search));
      return matchCat && matchSearch;
    });
  }, [workers, selectedCategory, search]);

  return (
    <AppShell>
      <main className="content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Workers</h1>
            <p className="subtle">
              {activeProject ? activeProject.name : 'Select a project'} ({workers.length} registered)
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => {
              setWorkerToEdit(null);
              setIsModalOpen(true);
            }}
            disabled={!activeProject}
          >
            + Add Worker
          </button>
        </div>

        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Search worker name or mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="chip-filters">
          <button
            className={`chip ${selectedCategory === 'ALL' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('ALL')}
          >
            All Trades ({workers.length})
          </button>
          {categories.map((cat) => {
            const count = workers.filter((w) => w.category === cat).length;
            return (
              <button
                key={cat}
                className={`chip ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        {!activeProject ? (
          <div className="card warning-card">
            Please select an active project site from the top header dropdown to manage workers.
          </div>
        ) : loading ? (
          <div className="card loading-card">Loading worker master list...</div>
        ) : filteredWorkers.length === 0 ? (
          <div className="card empty-card">
            <h3>No workers found</h3>
            <p className="subtle">Tap "+ Add Worker" to add masons, helpers, and tradespeople.</p>
          </div>
        ) : (
          <div className="list worker-list">
            {filteredWorkers.map((worker) => (
              <div key={worker._id} className="list-item worker-master-item">
                <div className="worker-info">
                  <div className="worker-main-line">
                    <strong>{worker.name}</strong>
                    {worker.workerIdCode && <span className="worker-id-badge">{worker.workerIdCode}</span>}
                  </div>
                  <div className="subtle">
                    {worker.category} · <span className="rate-text">₹{worker.dailyRate}/day</span>
                    {worker.mobile && ` · 📞 ${worker.mobile}`}
                  </div>
                </div>
                <div className="worker-actions flex gap-2">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setWorkerToEdit(worker);
                      setIsModalOpen(true);
                    }}
                  >
                    Edit
                  </button>

                  <button
                    className="btn btn-secondary btn-sm text-red-600 hover:bg-red-50"
                    onClick={() => setWorkerToDelete(worker)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <WorkerModal
          isOpen={isModalOpen}
          workerToEdit={workerToEdit}
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchWorkers}
        />

        <ConfirmModal
          isOpen={!!workerToDelete}
          title="Delete Worker Profile"
          message={`Are you sure you want to delete worker "${workerToDelete?.name}"?`}
          itemName={workerToDelete ? `${workerToDelete.name} (${workerToDelete.category})` : undefined}
          warningText="Worker profile will be deleted from master list."
          confirmText="Delete Worker"
          onClose={() => setWorkerToDelete(null)}
          onConfirm={handleDeleteWorker}
        />
      </main>
    </AppShell>
  );
}

