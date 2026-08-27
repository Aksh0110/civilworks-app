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
        <div className="bg-amber-950/90 border border-amber-800/80 p-6 rounded-2xl text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full flex items-center justify-center text-3xl mx-auto">
            ✓
          </div>
          <div>
            <h2 className="text-xl font-bold text-amber-100">Expense Saved Successfully!</h2>
            <p className="text-xs text-amber-300/80 mt-1">
              Recorded for <span className="font-semibold text-white">{activeProject?.name}</span>.
            </p>
          </div>
        </div>

        {/* Receipt Confirmation Summary Card */}
        <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Expense Receipt</h3>

          <div className="text-center py-3 bg-stone-950 border border-stone-800 rounded-xl space-y-1">
            <span className="text-xs text-stone-400 block">Amount Spent</span>
            <span className="text-3xl font-extrabold text-amber-400">
              ₹{Number(successResult.amount).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="divide-y divide-stone-800 text-xs space-y-2 pt-2">
            <div className="flex justify-between py-2">
              <span className="text-stone-400">Category:</span>
              <span className="font-bold text-stone-200 flex items-center gap-1">
                <span>{successResult.categoryIcon}</span> {successResult.categoryName}
              </span>
            </div>

            <div className="flex justify-between py-2">
              <span className="text-stone-400">Payment Method:</span>
              <span className="font-bold text-stone-200">{successResult.paymentMethod.replace('_', ' ')}</span>
            </div>

            <div className="flex justify-between py-2">
              <span className="text-stone-400">Date:</span>
              <span className="font-bold text-stone-200">
                {new Date(successResult.expenseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>

            {successResult.vendorPerson && (
              <div className="flex justify-between py-2">
                <span className="text-stone-400">Paid To / Vendor:</span>
                <span className="font-bold text-stone-200">{successResult.vendorPerson}</span>
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
            className="flex-1 h-12 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-sm font-bold transition-colors"
          >
            + Add Another Expense
          </button>
          <Link
            href="/expenses"
            className="flex-1 h-12 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-sm font-bold transition-colors flex items-center justify-center"
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
      <div className="flex items-center justify-between bg-stone-900 border border-stone-800 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <Link
            href="/expenses"
            className="w-9 h-9 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center text-sm transition-colors"
          >
            ←
          </Link>
          <div>
            <h1 className="text-lg font-bold text-stone-100 flex items-center gap-2">
              <span>💸</span> Add Site Expense
            </h1>
            <p className="text-xs text-stone-400">
              Site: <span className="text-amber-400 font-semibold">{activeProject?.name || 'Select Site'}</span>
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-amber-950/90 border border-amber-800 text-amber-200 text-sm flex items-center gap-3">
          <span className="text-lg">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Category Grid Selection */}
        <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400">1. Select Expense Category *</h2>
            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(true)}
              className="text-xs font-bold text-amber-400 hover:underline"
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
                      ? 'bg-amber-500 text-stone-950 font-bold border-amber-400 shadow-md scale-105'
                      : 'bg-stone-950 border-stone-800 text-stone-300 hover:border-stone-700'
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
        <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-amber-400">
            2. Enter Amount Spent (₹) *
          </label>
          <div className="relative">
            <span className="absolute left-4 top-3.5 text-2xl font-bold text-amber-400">₹</span>
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
              className="w-full h-16 pl-10 pr-4 bg-stone-950 border border-stone-800 rounded-2xl text-stone-100 text-3xl font-extrabold placeholder-stone-700 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Step 3: Payment Method Selection */}
        <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400">3. Payment Method *</h2>

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
                      ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md'
                      : 'bg-stone-950 border-stone-800 text-stone-300 hover:border-stone-700'
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
        <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400">4. Optional Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-400 uppercase mb-1">Expense Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-11 px-3 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-400 uppercase mb-1">Paid To / Vendor Person</label>
              <input
                type="text"
                placeholder="e.g. Driver Ramesh / Metro Fuel Station"
                value={vendorPerson}
                onChange={(e) => setVendorPerson(e.target.value)}
                className="w-full h-11 px-3 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-400 uppercase mb-1">Remark / Note</label>
            <input
              type="text"
              placeholder="e.g. Diesel for JCB Excavator 50 Litres"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              className="w-full h-11 px-3 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Primary Save Button */}
        <button
          type="submit"
          disabled={submitting || !selectedCategoryId || !amount || parseFloat(amount) <= 0}
          className="w-full h-14 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-950 font-bold rounded-2xl text-base transition-colors shadow-lg flex items-center justify-center gap-2"
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
