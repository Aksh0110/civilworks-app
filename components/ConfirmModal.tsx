'use client';

import React, { useState } from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  itemName?: string;
  warningText?: string;
  confirmText?: string;
  confirmVariant?: 'danger' | 'primary';
  requireReason?: boolean;
  reasonPlaceholder?: string;
  onClose: () => void;
  onConfirm: (reason?: string) => Promise<void> | void;
}

export default function ConfirmModal({
  isOpen,
  title = 'Confirm Deletion',
  message = 'Are you sure you want to delete this record? This action cannot be undone.',
  itemName,
  warningText,
  confirmText = 'Delete Entry',
  confirmVariant = 'danger',
  requireReason = false,
  reasonPlaceholder = 'e.g. Added by mistake / Duplicate entry',
  onClose,
  onConfirm
}: ConfirmModalProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (requireReason && !reason.trim()) {
      setError('Please provide a reason for this action');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onConfirm(reason.trim() || undefined);
      setReason('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred during confirmation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 pb-6 sm:pb-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 max-h-[85vh] overflow-y-auto shadow-2xl space-y-4 animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>{confirmVariant === 'danger' ? '⚠️' : '❓'}</span> {title}
          </h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {itemName && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <span className="text-slate-500 font-semibold uppercase block text-[10px]">Target Record</span>
            <span className="text-slate-900 font-extrabold text-sm">{itemName}</span>
          </div>
        )}

        <p className="text-xs text-slate-600 leading-relaxed">{message}</p>

        {warningText && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-semibold flex items-start gap-2">
            <span>⚠️</span>
            <span>{warningText}</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleConfirm} className="space-y-4">
          {requireReason && (
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Reason *
              </label>
              <input
                type="text"
                required
                placeholder={reasonPlaceholder}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-[#087F3E]"
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className={`flex-1 h-11 rounded-xl text-white text-xs font-extrabold transition-colors shadow flex items-center justify-center gap-2 ${
                confirmVariant === 'danger'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-[#087F3E] hover:bg-[#056B34]'
              }`}
            >
              {loading ? 'Processing...' : confirmText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
