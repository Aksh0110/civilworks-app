'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useProject } from '@/lib/context/ProjectContext';
import VendorModal from '@/components/VendorModal';
import MaterialModal from '@/components/MaterialModal';

interface MaterialOption {
  _id: string;
  name: string;
  category: string;
  unit: string;
  defaultRate: number;
}

interface InwardLineItem {
  materialId: string;
  materialName: string;
  quantity: string;
  unit: string;
  rate: string;
}

export default function ReceiveMaterialPage() {
  const { activeProject } = useProject();
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [vendorId, setVendorId] = useState('');
  const [vendors, setVendors] = useState<any[]>([]);
  const [materials, setMaterials] = useState<MaterialOption[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [units, setUnits] = useState<string[]>([]);

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [challanNumber, setChallanNumber] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [remarks, setRemarks] = useState('');

  const [items, setItems] = useState<InwardLineItem[]>([
    { materialId: '', materialName: '', quantity: '', unit: '', rate: '' }
  ]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);

  // Success Confirmation View State
  const [successResult, setSuccessResult] = useState<any>(null);

  useEffect(() => {
    fetch('/api/vendors')
      .then((r) => r.json())
      .then((d) => setVendors(d.data || []));

    fetch('/api/materials/categories')
      .then((r) => r.json())
      .then((d) => {
        if (d.data) {
          setCategories(d.data.categories || []);
          setUnits(d.data.units || []);
        }
      });

    if (activeProject?._id) {
      loadMaterials();
    }
  }, [activeProject?._id]);

  const loadMaterials = () => {
    if (!activeProject?._id) return;
    setLoading(true);
    fetch(`/api/materials?projectId=${activeProject._id}`)
      .then((r) => r.json())
      .then((d) => {
        setMaterials(d.data || []);
      })
      .finally(() => setLoading(false));
  };

  const handleMaterialChange = (index: number, matId: string) => {
    const selectedMat = materials.find((m) => m._id === matId);
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      materialId: matId,
      materialName: selectedMat ? selectedMat.name : '',
      unit: selectedMat ? selectedMat.unit : '',
      rate: selectedMat && selectedMat.defaultRate ? selectedMat.defaultRate.toString() : ''
    };
    setItems(newItems);
  };

  const handleItemFieldChange = (index: number, field: keyof InwardLineItem, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addLineItem = () => {
    setItems([...items, { materialId: '', materialName: '', quantity: '', unit: '', rate: '' }]);
  };

  const removeLineItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateGrandTotal = () => {
    return items.reduce((acc, item) => {
      const q = parseFloat(item.quantity) || 0;
      const r = parseFloat(item.rate) || 0;
      return acc + q * r;
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject?._id) {
      setError('Please select an active project first.');
      return;
    }

    const validItems = items.filter((i) => i.materialId && parseFloat(i.quantity) > 0);
    if (validItems.length === 0) {
      setError('Please select at least one material and enter a valid quantity.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/materials/inward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: activeProject._id,
          date,
          vendorId: vendorId || undefined,
          invoiceNumber: invoiceNumber.trim() || undefined,
          challanNumber: challanNumber.trim() || undefined,
          vehicleNumber: vehicleNumber.trim() || undefined,
          remarks: remarks.trim() || undefined,
          items: validItems.map((i) => ({
            materialId: i.materialId,
            quantity: parseFloat(i.quantity),
            rate: parseFloat(i.rate) || 0
          }))
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to record material receipt.');
      }

      setSuccessResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (successResult) {
    return (
      <div className="max-w-lg mx-auto py-6 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-[#EAF7EF] border border-[#bce6cb] p-6 rounded-2xl text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-[#087F3E] text-white rounded-full flex items-center justify-center text-3xl mx-auto font-black shadow">
            ✓
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[#056B34]">Material Received Successfully!</h2>
            <p className="text-xs text-slate-600 mt-1">
              Stock levels have been automatically updated for{' '}
              <span className="font-bold text-slate-900">{activeProject?.name}</span>.
            </p>
          </div>
        </div>

        {/* Received Summary Card */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Receipt Summary</h3>

          <div className="divide-y divide-slate-100">
            {successResult.updatedStockList?.map((item: any) => (
              <div key={item.materialId} className="py-3 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{item.materialName}</h4>
                  <span className="text-xs text-slate-500">
                    Updated Stock: <strong className="text-[#087F3E]">{item.currentStock} {item.unit}</strong>
                  </span>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                    item.status === 'GOOD'
                      ? 'bg-[#EAF7EF] text-[#056B34] border border-[#bce6cb]'
                      : item.status === 'LOW'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-500">Total Inward Value:</span>
            <span className="text-base font-black text-[#087F3E]">
              ₹{calculateGrandTotal().toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              setSuccessResult(null);
              setItems([{ materialId: '', materialName: '', quantity: '', unit: '', rate: '' }]);
            }}
            className="flex-1 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
          >
            + Receive More Material
          </button>
          <Link
            href="/materials/stock"
            className="flex-1 h-12 rounded-xl bg-[#087F3E] hover:bg-[#056B34] text-white text-xs font-bold transition-colors flex items-center justify-center shadow"
          >
            View Live Stock →
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
            href="/materials"
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-sm transition-colors font-bold"
          >
            ←
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>📥</span> Receive Material (Inward)
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
        {/* Step 1: Basic Information */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#087F3E]">1. Receipt Information</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Receipt Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-[#087F3E]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-600 uppercase">Vendor / Supplier</label>
                <button
                  type="button"
                  onClick={() => setIsVendorModalOpen(true)}
                  className="text-xs font-bold text-[#087F3E] hover:underline"
                >
                  + Add Vendor
                </button>
              </div>
              <select
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-[#087F3E]"
              >
                <option value="">-- Select Vendor / Supplier --</option>
                {vendors.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.name} {v.mobile ? `(${v.mobile})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Step 2: Received Items */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#087F3E]">2. Received Items</h2>
            <button
              type="button"
              onClick={() => setIsMaterialModalOpen(true)}
              className="text-xs font-bold text-[#087F3E] hover:underline"
            >
              + Create New Material
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, idx) => (
              <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">Item #{idx + 1}</span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLineItem(idx)}
                      className="text-xs text-red-600 hover:text-red-700 font-bold"
                    >
                      Remove Item
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-bold text-slate-600 mb-1">Material *</label>
                    <select
                      value={item.materialId}
                      onChange={(e) => handleMaterialChange(idx, e.target.value)}
                      className="w-full h-11 px-3 bg-white border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-[#087F3E]"
                    >
                      <option value="">-- Select Material --</option>
                      {materials.map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.name} ({m.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Quantity {item.unit ? `(${item.unit})` : ''} *
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      placeholder="e.g. 300"
                      value={item.quantity}
                      onChange={(e) => handleItemFieldChange(idx, 'quantity', e.target.value)}
                      className="w-full h-11 px-3 bg-white border border-slate-200 rounded-lg text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-[#087F3E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Rate / Unit (₹)</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="e.g. 410"
                      value={item.rate}
                      onChange={(e) => handleItemFieldChange(idx, 'rate', e.target.value)}
                      className="w-full h-11 px-3 bg-white border border-slate-200 rounded-lg text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-[#087F3E]"
                    />
                  </div>
                </div>

                {item.quantity && item.rate && (
                  <div className="text-right text-xs text-slate-500">
                    Subtotal: <strong className="text-[#087F3E]">₹{(parseFloat(item.quantity) * parseFloat(item.rate)).toLocaleString('en-IN')}</strong>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addLineItem}
            className="w-full py-3 bg-slate-50 border border-dashed border-slate-300 hover:border-[#087F3E] text-[#087F3E] text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <span>+</span> Add Another Material Item
          </button>
        </div>

        {/* Step 3: Optional Vehicle / Invoice Details */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#087F3E]">3. Delivery Details (Optional)</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Invoice No.</label>
              <input
                type="text"
                placeholder="INV-9821"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-[#087F3E]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Challan No.</label>
              <input
                type="text"
                placeholder="CH-540"
                value={challanNumber}
                onChange={(e) => setChallanNumber(e.target.value)}
                className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-[#087F3E]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Vehicle No.</label>
              <input
                type="text"
                placeholder="MH 12 AB 3456"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-[#087F3E]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Remarks / Notes</label>
            <input
              type="text"
              placeholder="e.g. Delivered directly near Block B site office"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-[#087F3E]"
            />
          </div>
        </div>

        {/* Primary Save Button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full h-14 bg-[#087F3E] hover:bg-[#056B34] disabled:opacity-50 text-white font-extrabold rounded-2xl text-base transition-colors shadow flex items-center justify-center gap-2"
        >
          {submitting ? 'Recording Inward...' : '📥 Receive Material'}
        </button>
      </form>

      <VendorModal
        isOpen={isVendorModalOpen}
        onClose={() => setIsVendorModalOpen(false)}
        onSuccess={(v) => {
          setVendors((prev) => [...prev, v]);
          setVendorId(v._id);
        }}
      />

      <MaterialModal
        isOpen={isMaterialModalOpen}
        onClose={() => setIsMaterialModalOpen(false)}
        onSuccess={() => loadMaterials()}
        categories={categories}
        units={units}
      />
    </div>
  );
}
