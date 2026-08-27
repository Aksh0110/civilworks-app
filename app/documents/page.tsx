'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useProject } from '@/lib/context/ProjectContext';

interface DocumentItem {
  _id: string;
  documentName: string;
  documentType: string;
  fileUrl: string;
  uploadedBy?: string;
  remarks?: string;
  createdAt: string;
}

export default function DocumentsHubPage() {
  const { activeProject } = useProject();

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Add Document Modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('BILLS');
  const [docUrl, setDocUrl] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, [activeProject?._id, activeTab]);

  const loadDocuments = () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (activeProject?._id) query.set('projectId', activeProject._id);
    if (activeTab !== 'ALL') query.set('type', activeTab);

    fetch(`/api/documents?${query.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.data) setDocuments(d.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim() || !docUrl.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentName: docName.trim(),
          documentType: docType,
          fileUrl: docUrl.trim(),
          projectId: activeProject?._id,
          remarks: remarks.trim() || undefined,
          user: 'Site Supervisor'
        })
      });

      if (!res.ok) throw new Error('Failed to upload document metadata');

      setShowUploadModal(false);
      setDocName('');
      setDocUrl('');
      setRemarks('');
      loadDocuments();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document attachment?')) return;
    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete document');
      loadDocuments();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredDocs = documents.filter((d) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      d.documentName.toLowerCase().includes(q) ||
      (d.remarks && d.remarks.toLowerCase().includes(q)) ||
      (d.uploadedBy && d.uploadedBy.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-900 border border-stone-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📂</span>
            <h1 className="text-xl font-bold text-stone-100">Document Management</h1>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Centralized file repository, receipts, bills & agreements for{' '}
            <span className="text-amber-400 font-semibold">{activeProject?.name || 'All Sites'}</span>.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="px-5 h-12 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2 shrink-0 self-start sm:self-auto"
        >
          <span>+</span> Add Document
        </button>
      </div>

      {/* Filter Bar & Tabs */}
      <div className="bg-stone-900 border border-stone-800 p-4 rounded-2xl space-y-3">
        <div className="flex bg-stone-950 p-1 rounded-xl gap-1 overflow-x-auto border border-stone-800">
          {(['ALL', 'BILLS', 'RECEIPTS', 'QUOTATIONS', 'AGREEMENTS', 'DRAWINGS', 'PHOTOS', 'OTHER'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                activeTab === t
                  ? 'bg-amber-500 text-stone-950 shadow'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search document name, remarks, or uploader..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Document Cards List */}
      {loading ? (
        <div className="text-center py-12 text-xs text-stone-500">Loading document repository...</div>
      ) : filteredDocs.length === 0 ? (
        <div className="bg-stone-900 border border-stone-800 p-8 rounded-2xl text-center space-y-3">
          <div className="text-3xl">📂</div>
          <h3 className="text-sm font-bold text-stone-200">No documents found</h3>
          <p className="text-xs text-stone-400">Attach site drawings, bills, vouchers, or agreement documents.</p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-block px-4 py-2 bg-amber-500 text-stone-950 text-xs font-bold rounded-xl"
          >
            + Add Document
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredDocs.map((d) => (
            <div
              key={d._id}
              className="p-5 rounded-2xl bg-stone-900 border border-stone-800 transition-all shadow-lg flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-sm font-extrabold text-stone-100 flex items-center gap-2">
                    <span>📄</span>
                    <span>{d.documentName}</span>
                  </div>
                  {d.remarks && <p className="text-xs text-stone-400">{d.remarks}</p>}
                  <div className="text-[11px] text-stone-500">
                    Uploaded by {d.uploadedBy || 'Site Supervisor'} • {new Date(d.createdAt).toLocaleDateString('en-IN')}
                  </div>
                </div>

                <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase shrink-0">
                  {d.documentType}
                </span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-stone-800/80">
                <a
                  href={d.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-xs rounded-xl transition-colors shadow"
                >
                  View Attachment ↗
                </a>

                <button
                  onClick={() => handleDeleteDoc(d._id)}
                  className="px-3 py-2 bg-stone-800 hover:bg-red-950 hover:text-red-300 text-stone-400 text-xs font-bold rounded-xl transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 w-full max-w-md p-6 rounded-2xl space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-stone-100">Add Document Metadata</h3>
            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">Document Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Structural Drawing Rev-02"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">Document Category</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100"
                >
                  <option value="BILLS">Bills</option>
                  <option value="RECEIPTS">Receipts</option>
                  <option value="QUOTATIONS">Quotations</option>
                  <option value="AGREEMENTS">Agreements</option>
                  <option value="DRAWINGS">Drawings</option>
                  <option value="PHOTOS">Photos</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">File URL / Storage Link *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. https://storage.civilworks.app/docs/drawing.pdf"
                  value={docUrl}
                  onChange={(e) => setDocUrl(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">Description / Remarks (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Approved by structural engineer"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-stone-800 text-stone-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-amber-500 text-stone-950 text-xs font-extrabold rounded-xl"
                >
                  {submitting ? 'Saving...' : 'Save Document ✓'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
