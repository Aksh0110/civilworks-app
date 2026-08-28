'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useProject } from '@/lib/context/ProjectContext';
import VendorModal from '@/components/VendorModal';
import ConfirmModal from '@/components/ConfirmModal';

export default function VendorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = params?.id as string;
  const { activeProject } = useProject();

  const [profile, setProfile] = useState<any>(null);
  const [ledger, setLedger] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'BILLS' | 'PAYMENTS' | 'LEDGER' | 'CONTACTS' | 'DOCUMENTS'>('OVERVIEW');
  const [loading, setLoading] = useState(true);

  // Edit / Delete Vendor State
  const [isEditVendorModalOpen, setIsEditVendorModalOpen] = useState(false);
  const [isDeleteVendorConfirmOpen, setIsDeleteVendorConfirmOpen] = useState(false);

  // Edit / Delete Bill State
  const [billToDelete, setBillToDelete] = useState<any | null>(null);

  // Delete Contact State
  const [contactToDelete, setContactToDelete] = useState<any | null>(null);

  // Modals state
  const [showAddBillModal, setShowAddBillModal] = useState(false);
  const [billNumber, setBillNumber] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [billRemarks, setBillRemarks] = useState('');
  const [submittingBill, setSubmittingBill] = useState(false);

  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactRole, setContactRole] = useState('Manager');
  const [contactPhone, setContactPhone] = useState('');

  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('BILL');
  const [docUrl, setDocUrl] = useState('');

  useEffect(() => {
    if (!vendorId) return;
    loadProfileData();
  }, [vendorId, activeProject?._id]);

  const loadProfileData = () => {
    setLoading(true);
    const projQuery = activeProject?._id ? `?projectId=${activeProject._id}` : '';

    Promise.all([
      fetch(`/api/vendors/${vendorId}${projQuery}`).then((r) => r.json()),
      fetch(`/api/vendors/${vendorId}/ledger${projQuery}`).then((r) => r.json())
    ])
      .then(([profRes, ledgRes]) => {
        if (profRes.data) setProfile(profRes.data);
        if (ledgRes.data) setLedger(ledgRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleDeleteVendor = async () => {
    const res = await fetch(`/api/vendors/${vendorId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete vendor');
    router.push('/vendors');
  };

  const handleDeleteBill = async () => {
    if (!billToDelete) return;
    const res = await fetch(`/api/vendors/bills/${billToDelete._id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete bill');
    loadProfileData();
  };

  const handleDeleteContact = async () => {
    if (!contactToDelete) return;
    const res = await fetch(`/api/vendors/${vendorId}/contacts/${contactToDelete._id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete contact');
    loadProfileData();
  };

  const handleAddBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject?._id || !billNumber.trim() || !billAmount) return;

    try {
      setSubmittingBill(true);
      const res = await fetch('/api/vendors/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: activeProject._id,
          vendorId,
          billNumber: billNumber.trim(),
          totalAmount: parseFloat(billAmount),
          remarks: billRemarks.trim() || undefined,
          user: 'Site Supervisor'
        })
      });

      if (!res.ok) throw new Error('Failed to create bill');
      setShowAddBillModal(false);
      setBillNumber('');
      setBillAmount('');
      setBillRemarks('');
      loadProfileData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingBill(false);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim()) return;

    try {
      const res = await fetch(`/api/vendors/${vendorId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName.trim(),
          role: contactRole.trim(),
          phone: contactPhone.trim() || undefined
        })
      });
      if (!res.ok) throw new Error('Failed to add contact');
      setShowAddContactModal(false);
      setContactName('');
      setContactPhone('');
      loadProfileData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim() || !docUrl.trim()) return;

    try {
      const res = await fetch(`/api/vendors/${vendorId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentName: docName.trim(),
          documentType: docType,
          fileUrl: docUrl.trim(),
          projectId: activeProject?._id
        })
      });
      if (!res.ok) throw new Error('Failed to add document');
      setShowAddDocModal(false);
      setDocName('');
      setDocUrl('');
      loadProfileData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading || !profile) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-xs text-slate-500">
        Loading vendor profile...
      </div>
    );
  }

  const { vendor, financialSummary, bills, payments, contacts, documents } = profile;
  const phoneDigits = vendor.mobile ? vendor.mobile.replace(/\D/g, '') : '';

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      {/* Top Banner & Quick Contact Bar */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏬</span>
              <h1 className="text-2xl font-extrabold text-slate-900">{vendor.name}</h1>
            </div>
            <p className="text-xs text-[#087F3E] font-bold mt-1">
              {vendor.category || 'Supplier'} {vendor.contactPerson ? `• ${vendor.contactPerson}` : ''}
            </p>
            {vendor.address && <p className="text-xs text-slate-500 mt-1">📍 {vendor.address}</p>}
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setIsEditVendorModalOpen(true)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
            >
              ✏️ Edit
            </button>

            <button
              onClick={() => setIsDeleteVendorConfirmOpen(true)}
              className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-xl transition-colors"
            >
              🗑️ Delete
            </button>

            <Link
              href="/vendors"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
            >
              ← Back to Vendors
            </Link>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          {phoneDigits && (
            <>
              <a
                href={`tel:${phoneDigits}`}
                className="px-4 py-2 bg-[#EAF7EF] hover:bg-[#d5edd9] text-[#056B34] text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors border border-[#bce6cb]"
              >
                <span>📞</span> Call
              </a>
              <a
                href={`https://wa.me/${phoneDigits}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-[#EAF7EF] hover:bg-[#d5edd9] text-[#056B34] text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors border border-[#bce6cb]"
              >
                <span>💬</span> WhatsApp
              </a>
            </>
          )}

          <Link
            href="/payments/vendor"
            className="px-4 py-2 bg-[#087F3E] hover:bg-[#056B34] text-white text-xs font-extrabold rounded-xl flex items-center gap-1.5 transition-colors shadow"
          >
            <span>💳</span> Pay Vendor
          </Link>

          <button
            onClick={() => setShowAddBillModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl flex items-center gap-1.5 transition-colors shadow"
          >
            <span>📄</span> + Add Bill
          </button>
        </div>
      </div>

      {/* Prominent Financial Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <span className="text-xs text-slate-500 block font-semibold">Net Outstanding</span>
          <span
            className={`text-xl font-black mt-1 block ${
              financialSummary.outstanding > 0 ? 'text-amber-600' : 'text-[#087F3E]'
            }`}
          >
            ₹{(financialSummary.outstanding || 0).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <span className="text-xs text-slate-500 block font-semibold">Advance Balance</span>
          <span className="text-xl font-black text-purple-700 mt-1 block">
            ₹{(financialSummary.advance || 0).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <span className="text-xs text-slate-500 block font-semibold">Purchases (This Month)</span>
          <span className="text-xl font-black text-slate-900 mt-1 block">
            ₹{(financialSummary.purchasesThisMonth || 0).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <span className="text-xs text-slate-500 block font-semibold">Payments (This Month)</span>
          <span className="text-xl font-black text-[#087F3E] mt-1 block">
            ₹{(financialSummary.paymentsThisMonth || 0).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="bg-white border border-slate-200 p-2 rounded-2xl shadow-sm">
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1 overflow-x-auto">
          {(['OVERVIEW', 'BILLS', 'PAYMENTS', 'LEDGER', 'CONTACTS', 'DOCUMENTS'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                activeTab === t
                  ? 'bg-[#087F3E] text-white shadow'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-3 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#087F3E]">Financial Snapshot</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">Total Billed</span>
                <span className="font-bold text-slate-900 text-sm mt-1 block">
                  ₹{(financialSummary.totalBilled || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">Total Paid</span>
                <span className="font-bold text-[#087F3E] text-sm mt-1 block">
                  ₹{(financialSummary.totalPaid || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">Last Purchase</span>
                <span className="font-bold text-slate-900 mt-1 block">
                  {financialSummary.lastPurchaseDate
                    ? new Date(financialSummary.lastPurchaseDate).toLocaleDateString('en-IN')
                    : 'None'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">Last Payment</span>
                <span className="font-bold text-slate-900 mt-1 block">
                  {financialSummary.lastPaymentDate
                    ? new Date(financialSummary.lastPaymentDate).toLocaleDateString('en-IN')
                    : 'None'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BILLS */}
      {activeTab === 'BILLS' && (
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Vendor Bills ({bills.length})</h3>
            <button
              onClick={() => setShowAddBillModal(true)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow"
            >
              + Add Bill
            </button>
          </div>

          {bills.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">No bills recorded for this vendor.</div>
          ) : (
            <div className="space-y-3">
              {bills.map((b: any) => {
                const bal = (b.totalAmount || 0) - (b.paidAmount || 0);
                return (
                  <div key={b._id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900">INV: {b.billNumber}</span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                            b.status === 'SETTLED'
                              ? 'bg-[#EAF7EF] text-[#056B34] border border-[#bce6cb]'
                              : b.status === 'PARTIAL'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {b.status}
                        </span>

                        <button
                          onClick={() => setBillToDelete(b)}
                          className="p-1 text-slate-400 hover:text-red-600 text-xs font-bold"
                          title="Delete Bill"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Date: {new Date(b.billDate).toLocaleDateString('en-IN')}</span>
                      <span>Total: ₹{b.totalAmount.toLocaleString('en-IN')}</span>
                      <span>Paid: ₹{(b.paidAmount || 0).toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200">
                      <span className="text-slate-500">Remaining Balance:</span>
                      <span className="font-black text-amber-700 text-sm">₹{bal.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PAYMENTS */}
      {activeTab === 'PAYMENTS' && (
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Payment History ({payments.length})</h3>
            <Link
              href="/payments/vendor"
              className="px-3.5 py-1.5 bg-[#087F3E] hover:bg-[#056B34] text-white text-xs font-bold rounded-xl shadow"
            >
              Pay Vendor
            </Link>
          </div>

          {payments.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">No payment transactions recorded.</div>
          ) : (
            <div className="space-y-3">
              {payments.map((p: any) => (
                <div key={p._id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <span>Receipt: {p.receiptId}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EAF7EF] text-[#056B34] border border-[#bce6cb] uppercase">
                        {p.paymentType.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Method: {p.paymentMethod} • Date: {new Date(p.paymentDate).toLocaleDateString('en-IN')}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-base font-black text-[#087F3E]">
                      ₹{p.amount.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: LEDGER */}
      {activeTab === 'LEDGER' && (
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900">Transaction Ledger Timeline</h3>

          {ledger.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">No transactions recorded in ledger.</div>
          ) : (
            <div className="space-y-3">
              {ledger.map((item: any) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          item.type === 'BILL'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-[#EAF7EF] text-[#056B34] border border-[#bce6cb]'
                        }`}
                      >
                        {item.type}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{item.label}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Date: {new Date(item.date).toLocaleDateString('en-IN')}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`text-sm font-black ${
                        item.type === 'BILL' ? 'text-amber-700' : 'text-[#087F3E]'
                      }`}
                    >
                      {item.type === 'BILL' ? '+' : '-'}₹{item.amount.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Balance: ₹{item.balanceAfter.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: CONTACTS */}
      {activeTab === 'CONTACTS' && (
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Vendor Contacts ({contacts.length})</h3>
            <button
              onClick={() => setShowAddContactModal(true)}
              className="px-3.5 py-1.5 bg-[#087F3E] hover:bg-[#056B34] text-white text-xs font-bold rounded-xl shadow"
            >
              + Add Contact
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {contacts.map((c: any) => (
              <div key={c._id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{c.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#087F3E] font-bold">{c.role}</span>
                    <button
                      onClick={() => setContactToDelete(c)}
                      className="p-1 text-slate-400 hover:text-red-600 text-xs font-bold"
                      title="Delete Contact"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                {c.phone && <div className="text-xs text-slate-500">📞 {c.phone}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: DOCUMENTS */}
      {activeTab === 'DOCUMENTS' && (
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Attached Documents ({documents.length})</h3>
            <button
              onClick={() => setShowAddDocModal(true)}
              className="px-3.5 py-1.5 bg-[#087F3E] hover:bg-[#056B34] text-white text-xs font-bold rounded-xl shadow"
            >
              + Upload Metadata
            </button>
          </div>

          <div className="space-y-3">
            {documents.map((d: any) => (
              <div key={d._id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">{d.documentName}</div>
                  <div className="text-[11px] text-slate-500">
                    Type: {d.documentType} • Uploaded: {new Date(d.createdAt).toLocaleDateString('en-IN')}
                  </div>
                </div>
                <a
                  href={d.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-slate-200 text-slate-800 text-xs font-bold rounded-lg hover:bg-slate-300"
                >
                  View Attachment
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Bill Modal */}
      {showAddBillModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md p-6 rounded-2xl space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Add Vendor Bill</h3>
            <form onSubmit={handleAddBill} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Invoice / Bill Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. INV-1289"
                  value={billNumber}
                  onChange={(e) => setBillNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#087F3E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Total Bill Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Enter total amount..."
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#087F3E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Remarks (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 500 bags Cement"
                  value={billRemarks}
                  onChange={(e) => setBillRemarks(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#087F3E]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddBillModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBill}
                  className="px-4 py-2 bg-[#087F3E] hover:bg-[#056B34] text-white text-xs font-extrabold rounded-xl shadow"
                >
                  Save Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddContactModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md p-6 rounded-2xl space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Add Vendor Contact</h3>
            <form onSubmit={handleAddContact} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Contact Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ravi Verma"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#087F3E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Role / Designation</label>
                <input
                  type="text"
                  placeholder="e.g. Sales Executive"
                  value={contactRole}
                  onChange={(e) => setContactRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#087F3E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#087F3E]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddContactModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#087F3E] hover:bg-[#056B34] text-white text-xs font-extrabold rounded-xl shadow"
                >
                  Add Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Document Metadata Modal */}
      {showAddDocModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md p-6 rounded-2xl space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Attach Document Metadata</h3>
            <form onSubmit={handleAddDoc} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Document Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vendor Agreement 2026"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#087F3E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Document Type</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#087F3E]"
                >
                  <option value="BILL">Bill</option>
                  <option value="QUOTATION">Quotation</option>
                  <option value="AGREEMENT">Agreement</option>
                  <option value="RECEIPT">Receipt</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Document URL / Storage Path *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. https://storage.civilworks.app/docs/agreement.pdf"
                  value={docUrl}
                  onChange={(e) => setDocUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#087F3E]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddDocModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#087F3E] hover:bg-[#056B34] text-white text-xs font-extrabold rounded-xl shadow"
                >
                  Save Attachment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vendor Edit Modal */}
      <VendorModal
        isOpen={isEditVendorModalOpen}
        vendorToEdit={vendor}
        onClose={() => setIsEditVendorModalOpen(false)}
        onSuccess={loadProfileData}
      />

      {/* Delete Vendor Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteVendorConfirmOpen}
        title="Delete Vendor Profile"
        message={`Are you sure you want to delete vendor "${vendor?.name}"?`}
        itemName={vendor?.name}
        warningText="Vendor profile and linked contacts will be permanently deleted."
        confirmText="Delete Vendor"
        onClose={() => setIsDeleteVendorConfirmOpen(false)}
        onConfirm={handleDeleteVendor}
      />

      {/* Delete Vendor Bill Confirmation Modal */}
      <ConfirmModal
        isOpen={!!billToDelete}
        title="Delete Vendor Bill"
        message={`Are you sure you want to delete bill #${billToDelete?.billNumber}?`}
        itemName={billToDelete ? `Bill #${billToDelete.billNumber} - ₹${billToDelete.totalAmount}` : undefined}
        warningText="Deleting this bill will recalculate vendor outstanding balance."
        confirmText="Delete Bill"
        onClose={() => setBillToDelete(null)}
        onConfirm={handleDeleteBill}
      />

      {/* Delete Vendor Contact Confirmation Modal */}
      <ConfirmModal
        isOpen={!!contactToDelete}
        title="Delete Vendor Contact"
        message={`Are you sure you want to delete contact "${contactToDelete?.name}"?`}
        itemName={contactToDelete?.name}
        confirmText="Delete Contact"
        onClose={() => setContactToDelete(null)}
        onConfirm={handleDeleteContact}
      />
    </div>
  );
}
