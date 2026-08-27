'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useProject } from '@/lib/context/ProjectContext';

export default function VendorProfilePage() {
  const params = useParams();
  const vendorId = params?.id as string;
  const { activeProject } = useProject();

  const [profile, setProfile] = useState<any>(null);
  const [ledger, setLedger] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'BILLS' | 'PAYMENTS' | 'LEDGER' | 'CONTACTS' | 'DOCUMENTS'>('OVERVIEW');
  const [loading, setLoading] = useState(true);

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
      <div className="max-w-4xl mx-auto py-12 text-center text-xs text-stone-500">
        Loading vendor profile...
      </div>
    );
  }

  const { vendor, financialSummary, bills, payments, contacts, documents } = profile;
  const phoneDigits = vendor.mobile ? vendor.mobile.replace(/\D/g, '') : '';

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      {/* Top Banner & Quick Contact Bar */}
      <div className="bg-stone-900 border border-stone-800 p-6 rounded-2xl space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏬</span>
              <h1 className="text-2xl font-black text-stone-100">{vendor.name}</h1>
            </div>
            <p className="text-xs text-amber-400 font-bold mt-1">
              {vendor.category || 'Supplier'} {vendor.contactPerson ? `• ${vendor.contactPerson}` : ''}
            </p>
            {vendor.address && <p className="text-xs text-stone-400 mt-1">📍 {vendor.address}</p>}
          </div>

          <Link
            href="/vendors"
            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold rounded-xl self-start sm:self-auto"
          >
            ← Back to Vendors
          </Link>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-stone-800/80">
          {phoneDigits && (
            <>
              <a
                href={`tel:${phoneDigits}`}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-emerald-400 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <span>📞</span> Call
              </a>
              <a
                href={`https://wa.me/${phoneDigits}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-emerald-400 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <span>💬</span> WhatsApp
              </a>
            </>
          )}

          <Link
            href="/payments/vendor"
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-extrabold rounded-xl flex items-center gap-1.5 transition-colors shadow"
          >
            <span>💳</span> Pay Vendor
          </Link>

          <button
            onClick={() => setShowAddBillModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-stone-950 text-xs font-extrabold rounded-xl flex items-center gap-1.5 transition-colors shadow"
          >
            <span>📄</span> + Add Bill
          </button>
        </div>
      </div>

      {/* Prominent Financial Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-stone-900 border border-stone-800 p-4 rounded-2xl">
          <span className="text-xs text-stone-400 block font-semibold">Net Outstanding</span>
          <span
            className={`text-xl font-black mt-1 block ${
              financialSummary.outstanding > 0 ? 'text-amber-400' : 'text-emerald-400'
            }`}
          >
            ₹{(financialSummary.outstanding || 0).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-stone-900 border border-stone-800 p-4 rounded-2xl">
          <span className="text-xs text-stone-400 block font-semibold">Advance Balance</span>
          <span className="text-xl font-black text-purple-400 mt-1 block">
            ₹{(financialSummary.advance || 0).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-stone-900 border border-stone-800 p-4 rounded-2xl">
          <span className="text-xs text-stone-400 block font-semibold">Purchases (This Month)</span>
          <span className="text-xl font-black text-stone-100 mt-1 block">
            ₹{(financialSummary.purchasesThisMonth || 0).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-stone-900 border border-stone-800 p-4 rounded-2xl">
          <span className="text-xs text-stone-400 block font-semibold">Payments (This Month)</span>
          <span className="text-xl font-black text-emerald-400 mt-1 block">
            ₹{(financialSummary.paymentsThisMonth || 0).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="bg-stone-900 border border-stone-800 p-2 rounded-2xl">
        <div className="flex bg-stone-950 p-1 rounded-xl gap-1 overflow-x-auto">
          {(['OVERVIEW', 'BILLS', 'PAYMENTS', 'LEDGER', 'CONTACTS', 'DOCUMENTS'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                activeTab === t
                  ? 'bg-amber-500 text-stone-950 shadow'
                  : 'text-stone-400 hover:text-stone-200'
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
          <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">Financial Snapshot</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-stone-950 rounded-xl border border-stone-800">
                <span className="text-stone-400 block">Total Billed</span>
                <span className="font-bold text-stone-100 text-sm mt-1 block">
                  ₹{(financialSummary.totalBilled || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-3 bg-stone-950 rounded-xl border border-stone-800">
                <span className="text-stone-400 block">Total Paid</span>
                <span className="font-bold text-emerald-400 text-sm mt-1 block">
                  ₹{(financialSummary.totalPaid || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-3 bg-stone-950 rounded-xl border border-stone-800">
                <span className="text-stone-400 block">Last Purchase</span>
                <span className="font-bold text-stone-200 mt-1 block">
                  {financialSummary.lastPurchaseDate
                    ? new Date(financialSummary.lastPurchaseDate).toLocaleDateString('en-IN')
                    : 'None'}
                </span>
              </div>
              <div className="p-3 bg-stone-950 rounded-xl border border-stone-800">
                <span className="text-stone-400 block">Last Payment</span>
                <span className="font-bold text-stone-200 mt-1 block">
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
        <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-100">Vendor Bills ({bills.length})</h3>
            <button
              onClick={() => setShowAddBillModal(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-stone-950 text-xs font-bold rounded-xl"
            >
              + Add Bill
            </button>
          </div>

          {bills.length === 0 ? (
            <div className="text-center py-8 text-xs text-stone-500">No bills recorded for this vendor.</div>
          ) : (
            <div className="space-y-3">
              {bills.map((b: any) => {
                const bal = (b.totalAmount || 0) - (b.paidAmount || 0);
                return (
                  <div key={b._id} className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-stone-100">INV: {b.billNumber}</span>
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                          b.status === 'SETTLED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : b.status === 'PARTIAL'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-stone-400">
                      <span>Date: {new Date(b.billDate).toLocaleDateString('en-IN')}</span>
                      <span>Total: ₹{b.totalAmount.toLocaleString('en-IN')}</span>
                      <span>Paid: ₹{(b.paidAmount || 0).toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-1 border-t border-stone-800/60">
                      <span className="text-stone-400">Remaining Balance:</span>
                      <span className="font-extrabold text-amber-400 text-sm">₹{bal.toLocaleString('en-IN')}</span>
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
        <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-100">Payment History ({payments.length})</h3>
            <Link
              href="/payments/vendor"
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-bold rounded-xl"
            >
              Pay Vendor
            </Link>
          </div>

          {payments.length === 0 ? (
            <div className="text-center py-8 text-xs text-stone-500">No payment transactions recorded.</div>
          ) : (
            <div className="space-y-3">
              {payments.map((p: any) => (
                <div key={p._id} className="p-4 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-stone-100 flex items-center gap-2">
                      <span>Receipt: {p.receiptId}</span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                        {p.paymentType.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-400">
                      Method: {p.paymentMethod} • Date: {new Date(p.paymentDate).toLocaleDateString('en-IN')}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-base font-extrabold text-emerald-400">
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
        <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-stone-100">Transaction Ledger Timeline</h3>

          {ledger.length === 0 ? (
            <div className="text-center py-8 text-xs text-stone-500">No transactions recorded in ledger.</div>
          ) : (
            <div className="space-y-3">
              {ledger.map((item: any) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          item.type === 'BILL'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {item.type}
                      </span>
                      <span className="text-xs font-bold text-stone-100">{item.label}</span>
                    </div>
                    <div className="text-[11px] text-stone-400">
                      Date: {new Date(item.date).toLocaleDateString('en-IN')}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`text-sm font-black ${
                        item.type === 'BILL' ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      {item.type === 'BILL' ? '+' : '-'}₹{item.amount.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] text-stone-400 mt-0.5">
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
        <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-100">Vendor Contacts ({contacts.length})</h3>
            <button
              onClick={() => setShowAddContactModal(true)}
              className="px-3 py-1.5 bg-amber-500 text-stone-950 text-xs font-bold rounded-xl"
            >
              + Add Contact
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {contacts.map((c: any) => (
              <div key={c._id} className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-100">{c.name}</span>
                  <span className="text-[10px] text-amber-400 font-bold">{c.role}</span>
                </div>
                {c.phone && <div className="text-xs text-stone-400">📞 {c.phone}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: DOCUMENTS */}
      {activeTab === 'DOCUMENTS' && (
        <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-100">Attached Documents ({documents.length})</h3>
            <button
              onClick={() => setShowAddDocModal(true)}
              className="px-3 py-1.5 bg-amber-500 text-stone-950 text-xs font-bold rounded-xl"
            >
              + Upload Metadata
            </button>
          </div>

          <div className="space-y-3">
            {documents.map((d: any) => (
              <div key={d._id} className="p-4 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-stone-100">{d.documentName}</div>
                  <div className="text-[11px] text-stone-400">
                    Type: {d.documentType} • Uploaded: {new Date(d.createdAt).toLocaleDateString('en-IN')}
                  </div>
                </div>
                <a
                  href={d.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-stone-800 text-amber-400 text-xs font-bold rounded-lg"
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
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 w-full max-w-md p-6 rounded-2xl space-y-4">
            <h3 className="text-lg font-bold text-stone-100">Add Vendor Bill</h3>
            <form onSubmit={handleAddBill} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">Invoice / Bill Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. INV-1289"
                  value={billNumber}
                  onChange={(e) => setBillNumber(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">Total Bill Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Enter total amount..."
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">Remarks (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 500 bags Cement"
                  value={billRemarks}
                  onChange={(e) => setBillRemarks(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddBillModal(false)}
                  className="px-4 py-2 bg-stone-800 text-stone-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBill}
                  className="px-4 py-2 bg-blue-600 text-stone-950 text-xs font-extrabold rounded-xl"
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
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 w-full max-w-md p-6 rounded-2xl space-y-4">
            <h3 className="text-lg font-bold text-stone-100">Add Vendor Contact</h3>
            <form onSubmit={handleAddContact} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">Contact Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ravi Verma"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">Role / Designation</label>
                <input
                  type="text"
                  placeholder="e.g. Sales Executive"
                  value={contactRole}
                  onChange={(e) => setContactRole(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddContactModal(false)}
                  className="px-4 py-2 bg-stone-800 text-stone-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 text-stone-950 text-xs font-extrabold rounded-xl"
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
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 w-full max-w-md p-6 rounded-2xl space-y-4">
            <h3 className="text-lg font-bold text-stone-100">Attach Document Metadata</h3>
            <form onSubmit={handleAddDoc} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">Document Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vendor Agreement 2026"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">Document Type</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100"
                >
                  <option value="BILL">Bill</option>
                  <option value="QUOTATION">Quotation</option>
                  <option value="AGREEMENT">Agreement</option>
                  <option value="RECEIPT">Receipt</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">Document URL / Storage Path *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. https://storage.civilworks.app/docs/agreement.pdf"
                  value={docUrl}
                  onChange={(e) => setDocUrl(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddDocModal(false)}
                  className="px-4 py-2 bg-stone-800 text-stone-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 text-stone-950 text-xs font-extrabold rounded-xl"
                >
                  Save Attachment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
