'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useProject } from '@/lib/context/ProjectContext';
import ExpenseCategoryModal from '@/components/ExpenseCategoryModal';

interface CategoryOption {
  _id: string;
  name: string;
  icon: string;
}

export default function AddExpensePage() {
  const { activeProject } = useProject();
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<Array<{ id: string; label: string; icon: string }>>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [vendorPerson, setVendorPerson] = useState('');
  const [remark, setRemark] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Immediate Confirmation Result State
  const [successResult, setSuccessResult] = useState<any>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = () => {
    setLoading(true);
    fetch('/api/expenses/categories')
      .then((r) => r.json())
      .then((d) => {
        if (d.data) {
          setCategories(d.data.categories || []);
          setPaymentMethods(d.data.paymentMethods || []);
          if (d.data.categories?.length > 0 && !selectedCategoryId) {
            setSelectedCategoryId(d.data.categories[0]._id);
          }
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const selectedCategory = categories.find((c) => c._id === selectedCategoryId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject?._id) {
      setError('Please select an active project.');
      return;
    }
    if (!selectedCategoryId) {
      setError('Please select an expense category.');
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: activeProject._id,
          categoryId: selectedCategoryId,
          amount: numAmount,
          paymentMethod,
          expenseDate: date,
          vendorPerson: vendorPerson.trim() || undefined,
          remark: remark.trim() || undefined,
          referenceNumber: referenceNumber.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to save expense');
      }

      setSuccessResult(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (successResult) {
    return (
      <div className="max-w-lg mx-auto py-6 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Success Confirmation View */}
        <div className="bg-[#EAF7EF] border border-[#bce6cb] p-6 rounded-2xl text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-[#087F3E] text-white rounded-full flex items-center justify-center text-3xl mx-auto font-black shadow">
            ✓
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[#056B34]">Expense Saved Successfully!</h2>
            <p className="text-xs text-slate-600 mt-1">
              Recorded for <span className="font-bold text-slate-900">{activeProject?.name}</span>.
            </p>
          </div>
        </div>

        {/* Receipt Confirmation Summary Card */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Expense Receipt</h3>

          <div className="text-center py-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-xs text-slate-500 block">Amount Spent</span>
            <span className="text-3xl font-black text-[#087F3E]">
              ₹{Number(successResult.amount).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="divide-y divide-slate-100 text-xs space-y-2 pt-2">
            <div className="flex justify-between py-2">
              <span className="text-slate-500">Category:</span>
              <span className="font-bold text-slate-900 flex items-center gap-1">
                <span>{successResult.categoryIcon}</span> {successResult.categoryName}
              </span>
            </div>

            <div className="flex justify-between py-2">
              <span className="text-slate-500">Payment Method:</span>
              <span className="font-bold text-slate-900">{successResult.paymentMethod.replace('_', ' ')}</span>
            </div>

            <div className="flex justify-between py-2">
              <span className="text-slate-500">Date:</span>
              <span className="font-bold text-slate-900">
                {new Date(successResult.expenseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>

            {successResult.vendorPerson && (
              <div className="flex justify-between py-2">
                <span className="text-slate-500">Paid To / Vendor:</span>
                <span className="font-bold text-slate-900">{successResult.vendorPerson}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              setSuccessResult(null);
              setAmount('');
              setRemark('');
              setVendorPerson('');
            }}
            className="flex-1 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
          >
            + Add Another Expense
          </button>
          <Link
            href="/expenses"
            className="flex-1 h-12 rounded-xl bg-[#087F3E] hover:bg-[#056B34] text-white text-xs font-bold transition-colors flex items-center justify-center shadow"
          >
            Done →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-20">
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/expenses"
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-sm transition-colors font-bold"
          >
            ←
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>💸</span> Add Site Expense
            </h1>
            <p className="text-xs text-slate-500">
              Site: <span className="text-[#087F3E] font-semibold">{activeProject?.name || 'Select Site'}</span>
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-3">
          <span className="text-lg">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Category Grid Selection */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#087F3E]">1. Select Expense Category *</h2>
            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(true)}
              className="text-xs font-bold text-[#087F3E] hover:underline"
            >
              + New Category
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {categories.map((c) => {
              const isSelected = c._id === selectedCategoryId;
              return (
                <button
                  type="button"
                  key={c._id}
                  onClick={() => setSelectedCategoryId(c._id)}
                  className={`p-3 rounded-xl flex flex-col items-center justify-center text-center transition-all border ${
                    isSelected
                      ? 'bg-[#087F3E] text-white font-bold border-[#087F3E] shadow-md scale-105'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="text-xl mb-1">{c.icon}</span>
                  <span className="text-[11px] leading-tight line-clamp-2">{c.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Amount Entry (Large Keyboard Touch Input) */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-3 shadow-sm">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#087F3E]">
            2. Enter Amount Spent (₹) *
          </label>
          <div className="relative">
            <span className="absolute left-4 top-3.5 text-2xl font-bold text-[#087F3E]">₹</span>
            <input
              type="number"
              step="any"
              min="1"
              required
              placeholder="0"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError('');
              }}
              className="w-full h-16 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-3xl font-extrabold placeholder-slate-300 focus:outline-none focus:border-[#087F3E]"
            />
          </div>
        </div>

        {/* Step 3: Payment Method Selection */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-3 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#087F3E]">3. Payment Method *</h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {paymentMethods.map((pm) => {
              const isSelected = pm.id === paymentMethod;
              return (
                <button
                  type="button"
                  key={pm.id}
                  onClick={() => setPaymentMethod(pm.id)}
                  className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-[#087F3E] text-white border-[#087F3E] shadow'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span>{pm.icon}</span>
                  <span>{pm.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 4: Optional Information */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#087F3E]">4. Optional Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Expense Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-[#087F3E]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Paid To / Vendor Person</label>
              <input
                type="text"
                placeholder="e.g. Driver Ramesh / Metro Fuel Station"
                value={vendorPerson}
                onChange={(e) => setVendorPerson(e.target.value)}
                className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-[#087F3E]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Remark / Note</label>
            <input
              type="text"
              placeholder="e.g. Diesel for JCB Excavator 50 Litres"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-[#087F3E]"
            />
          </div>
        </div>

        {/* Primary Save Button */}
        <button
          type="submit"
          disabled={submitting || !selectedCategoryId || !amount || parseFloat(amount) <= 0}
          className="w-full h-14 bg-[#087F3E] hover:bg-[#056B34] disabled:opacity-40 text-white font-extrabold rounded-2xl text-base transition-colors shadow flex items-center justify-center gap-2"
        >
          {submitting ? 'Saving Expense...' : '💾 Save Expense'}
        </button>
      </form>

      <ExpenseCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSuccess={() => loadCategories()}
      />
    </div>
  );
}
