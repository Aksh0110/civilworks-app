import { connectMongoDB } from '../mongodb';
import { VendorModel, IVendor } from '../models/Vendor';
import { DEFAULT_VENDOR_CATEGORIES } from '../constants/vendorCategories';
import { VendorContact } from '../models/VendorContact';
import { VendorDocument } from '../models/VendorDocument';
import { VendorBill } from '../models/VendorBill';
import { MaterialInward } from '../models/MaterialInward';
import { Payment } from '../models/Payment';
import { logAuditAction } from './auditService';
import { getVendorsWithOutstanding, getVendorDetail, roundMoney } from './paymentService';
import mongoose from 'mongoose';

export { DEFAULT_VENDOR_CATEGORIES };

export function normalizeVendorName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function normalizePhone(phone?: string): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

export async function checkDuplicateVendor(name: string, mobile?: string, excludeId?: string) {
  await connectMongoDB();
  const normName = normalizeVendorName(name);
  const normPhone = normalizePhone(mobile);

  const query: any = {
    $or: [{ normalizedName: normName }]
  };

  if (normPhone && normPhone.length >= 7) {
    query.$or.push({ normalizedPhone: normPhone });
  }

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const existing = await (VendorModel as any).findOne(query).lean();
  return existing;
}

export interface CreateVendorInput {
  name: string;
  contactPerson?: string;
  mobile?: string;
  email?: string;
  category?: string;
  gstNumber?: string;
  address?: string;
  notes?: string;
  user?: string;
}

export async function createVendor(input: CreateVendorInput) {
  await connectMongoDB();

  if (!input.name || !input.name.trim()) {
    throw new Error('Vendor name is required');
  }

  const normName = normalizeVendorName(input.name);
  const normPhone = normalizePhone(input.mobile);

  const duplicate = await checkDuplicateVendor(input.name, input.mobile);
  if (duplicate) {
    throw new Error(`A vendor with name "${duplicate.name}" already exists.`);
  }

  const vendor = await (VendorModel as any).create({
    name: input.name.trim(),
    contactPerson: input.contactPerson?.trim(),
    mobile: input.mobile?.trim(),
    email: input.email?.trim().toLowerCase(),
    category: input.category?.trim() || 'Other',
    status: 'ACTIVE',
    gstNumber: input.gstNumber?.trim().toUpperCase(),
    address: input.address?.trim(),
    notes: input.notes?.trim(),
    normalizedName: normName,
    normalizedPhone: normPhone
  });

  // Create primary contact if contact person provided
  if (input.contactPerson || input.mobile) {
    await (VendorContact as any).create({
      vendorId: vendor._id,
      name: input.contactPerson?.trim() || input.name.trim(),
      phone: input.mobile?.trim(),
      email: input.email?.trim(),
      role: 'Primary Contact',
      isPrimary: true
    });
  }

  await logAuditAction({
    user: input.user || 'Site Supervisor',
    action: 'VENDOR_CREATED',
    entity: 'Vendor',
    entityId: vendor._id.toString(),
    metadata: { name: vendor.name, category: vendor.category }
  });

  return vendor.toObject ? vendor.toObject() : vendor;
}

export async function updateVendor(id: string, input: Partial<CreateVendorInput>) {
  await connectMongoDB();

  const vendor = await (VendorModel as any).findById(id);
  if (!vendor) throw new Error('Vendor not found');

  if (input.name) {
    const duplicate = await checkDuplicateVendor(input.name, input.mobile, id);
    if (duplicate) {
      throw new Error(`A vendor with name "${duplicate.name}" already exists.`);
    }
    vendor.name = input.name.trim();
    vendor.normalizedName = normalizeVendorName(input.name);
  }

  if (input.contactPerson !== undefined) vendor.contactPerson = input.contactPerson.trim();
  if (input.mobile !== undefined) {
    vendor.mobile = input.mobile.trim();
    vendor.normalizedPhone = normalizePhone(input.mobile);
  }
  if (input.email !== undefined) vendor.email = input.email.trim().toLowerCase();
  if (input.category !== undefined) vendor.category = input.category.trim();
  if (input.gstNumber !== undefined) vendor.gstNumber = input.gstNumber.trim().toUpperCase();
  if (input.address !== undefined) vendor.address = input.address.trim();
  if (input.notes !== undefined) vendor.notes = input.notes.trim();

  await vendor.save();

  await logAuditAction({
    user: input.user || 'Site Supervisor',
    action: 'VENDOR_UPDATED',
    entity: 'Vendor',
    entityId: vendor._id.toString(),
    metadata: { name: vendor.name }
  });

  return vendor.toObject ? vendor.toObject() : vendor;
}

export interface GetVendorsFilter {
  projectId?: string;
  search?: string;
  category?: string;
  statusTab?: 'ALL' | 'DUE' | 'ADVANCE' | 'SETTLED';
}

export async function getVendorsList(filter: GetVendorsFilter) {
  await connectMongoDB();

  const query: any = { status: 'ACTIVE' };

  if (filter.category && filter.category !== 'ALL') {
    query.category = filter.category;
  }

  if (filter.search) {
    query.$or = [
      { name: new RegExp(filter.search, 'i') },
      { contactPerson: new RegExp(filter.search, 'i') },
      { mobile: new RegExp(filter.search, 'i') },
      { category: new RegExp(filter.search, 'i') }
    ];
  }

  const vendors = await (VendorModel as any).find(query).sort({ name: 1 }).lean();

  // Attach live financial numbers using paymentService
  const financialSummaryList = filter.projectId
    ? await getVendorsWithOutstanding(filter.projectId)
    : [];

  const results = vendors.map((v: any) => {
    const vId = v._id.toString();
    const fin = financialSummaryList.find((f) => f.vendorId === vId);

    const outstanding = fin ? fin.outstandingAmount : 0;
    const advances = fin ? fin.advances : 0;
    const totalBilled = fin ? fin.totalBilled : 0;
    const previousPaid = fin ? fin.previousPaid : 0;

    let vendorStatus: 'DUE' | 'ADVANCE' | 'SETTLED' = 'SETTLED';
    if (outstanding > 0) vendorStatus = 'DUE';
    else if (advances > 0) vendorStatus = 'ADVANCE';

    return {
      _id: vId,
      name: v.name,
      contactPerson: v.contactPerson,
      mobile: v.mobile,
      category: v.category || 'Other',
      address: v.address,
      gstNumber: v.gstNumber,
      totalBilled,
      previousPaid,
      outstandingAmount: outstanding,
      advanceAmount: advances,
      vendorStatus
    };
  });

  // Apply Status Tab filter
  if (filter.statusTab && filter.statusTab !== 'ALL') {
    return results.filter((r: any) => r.vendorStatus === filter.statusTab);
  }

  return results.sort((a: any, b: any) => b.outstandingAmount - a.outstandingAmount || a.name.localeCompare(b.name));
}

export async function getVendorProfile(vendorId: string, projectId?: string) {
  await connectMongoDB();
  const vId = new (mongoose.Types.ObjectId as any)(vendorId);

  const vendor = await (VendorModel as any).findById(vId).lean();
  if (!vendor) throw new Error('Vendor not found');

  const contacts = await (VendorContact as any).find({ vendorId: vId }).lean();
  const documents = await (VendorDocument as any).find({ vendorId: vId }).sort({ createdAt: -1 }).lean();

  // Financial summary query
  const billQuery: any = { vendorId: vId };
  const paymentQuery: any = { recipientId: vId, recipientType: 'VENDOR', status: 'COMPLETED' };

  if (projectId) {
    const projId = new (mongoose.Types.ObjectId as any)(projectId);
    billQuery.projectId = projId;
    paymentQuery.projectId = projId;
  }

  const bills = await (VendorBill as any).find(billQuery).sort({ billDate: -1 }).lean();
  const inward = await (MaterialInward as any).find(billQuery).sort({ date: -1 }).lean();
  const payments = await (Payment as any).find(paymentQuery).sort({ paymentDate: -1 }).lean();

  const totalBilled = roundMoney(
    bills.reduce((s: number, b: any) => s + (b.totalAmount || 0), 0) +
      inward.reduce((s: number, i: any) => s + (i.totalAmount || 0), 0)
  );

  const vendorPayments = payments.filter((p: any) => p.paymentType === 'VENDOR_PAYMENT');
  const totalPaid = roundMoney(vendorPayments.reduce((s: number, p: any) => s + (p.amount || 0), 0));

  const vendorAdvances = payments.filter((p: any) => p.paymentType === 'VENDOR_ADVANCE');
  const totalAdvances = roundMoney(vendorAdvances.reduce((s: number, p: any) => s + (p.amount || 0), 0));

  const outstanding = roundMoney(Math.max(0, totalBilled - totalPaid - totalAdvances));

  // Current Month Calculations
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const purchasesThisMonth = roundMoney(
    bills
      .filter((b: any) => new Date(b.billDate) >= startOfMonth)
      .reduce((s: number, b: any) => s + (b.totalAmount || 0), 0) +
      inward
        .filter((i: any) => new Date(i.date) >= startOfMonth)
        .reduce((s: number, i: any) => s + (i.totalAmount || 0), 0)
  );

  const paymentsThisMonth = roundMoney(
    vendorPayments
      .filter((p: any) => new Date(p.paymentDate) >= startOfMonth)
      .reduce((s: number, p: any) => s + (p.amount || 0), 0)
  );

  const lastPurchase = [...bills, ...inward].sort(
    (a, b) => new Date(b.billDate || b.date).getTime() - new Date(a.billDate || a.date).getTime()
  )[0];

  const lastPayment = vendorPayments[0];

  return {
    vendor,
    contacts,
    documents,
    bills,
    inward,
    payments,
    financialSummary: {
      outstanding,
      advance: totalAdvances,
      totalBilled,
      totalPaid,
      purchasesThisMonth,
      paymentsThisMonth,
      lastPurchaseDate: lastPurchase ? lastPurchase.billDate || lastPurchase.date : null,
      lastPaymentDate: lastPayment ? lastPayment.paymentDate : null
    }
  };
}

export interface LedgerEntry {
  id: string;
  date: Date;
  type: 'BILL' | 'PAYMENT' | 'ADVANCE';
  label: string;
  referenceNumber: string;
  amount: number;
  balanceAfter: number;
  notes?: string;
}

export async function getVendorLedger(vendorId: string, projectId?: string): Promise<LedgerEntry[]> {
  await connectMongoDB();
  const vId = new (mongoose.Types.ObjectId as any)(vendorId);

  const billQuery: any = { vendorId: vId };
  const paymentQuery: any = { recipientId: vId, recipientType: 'VENDOR', status: 'COMPLETED' };

  if (projectId) {
    const projId = new (mongoose.Types.ObjectId as any)(projectId);
    billQuery.projectId = projId;
    paymentQuery.projectId = projId;
  }

  const bills = await (VendorBill as any).find(billQuery).lean();
  const inward = await (MaterialInward as any).find(billQuery).lean();
  const payments = await (Payment as any).find(paymentQuery).lean();

  const rawEntries: Array<{ date: Date; type: 'BILL' | 'PAYMENT' | 'ADVANCE'; label: string; referenceNumber: string; amount: number; notes?: string }> = [];

  for (const b of bills) {
    rawEntries.push({
      date: new Date(b.billDate),
      type: 'BILL',
      label: `Bill #${b.billNumber}`,
      referenceNumber: b.billNumber,
      amount: b.totalAmount,
      notes: b.remarks
    });
  }

  for (const i of inward) {
    if (i.invoiceNumber || i.challanNumber) {
      rawEntries.push({
        date: new Date(i.date),
        type: 'BILL',
        label: `Material Inward (${i.invoiceNumber || i.challanNumber})`,
        referenceNumber: i.invoiceNumber || i.challanNumber || '',
        amount: i.totalAmount,
        notes: i.remarks
      });
    }
  }

  for (const p of payments) {
    if (p.paymentType === 'VENDOR_PAYMENT') {
      rawEntries.push({
        date: new Date(p.paymentDate),
        type: 'PAYMENT',
        label: `Vendor Payment (${p.paymentMethod})`,
        referenceNumber: p.receiptId,
        amount: -p.amount,
        notes: p.notes
      });
    } else if (p.paymentType === 'VENDOR_ADVANCE') {
      rawEntries.push({
        date: new Date(p.paymentDate),
        type: 'ADVANCE',
        label: `Vendor Advance (${p.paymentMethod})`,
        referenceNumber: p.receiptId,
        amount: -p.amount,
        notes: p.notes
      });
    }
  }

  // Sort chronological ascending to calculate running balance
  rawEntries.sort((a, b) => a.date.getTime() - b.date.getTime());

  let runningBalance = 0;
  const ledger: LedgerEntry[] = [];

  for (let i = 0; i < rawEntries.length; i++) {
    const item = rawEntries[i];
    runningBalance = roundMoney(runningBalance + item.amount);

    ledger.push({
      id: `ledg-${i}-${item.referenceNumber}`,
      date: item.date,
      type: item.type,
      label: item.label,
      referenceNumber: item.referenceNumber,
      amount: Math.abs(item.amount),
      balanceAfter: runningBalance,
      notes: item.notes
    });
  }

  // Return descending for display
  return ledger.reverse();
}

// ----------------------------------------------------
// CONTACTS & DOCUMENTS MANAGEMENT
// ----------------------------------------------------

export async function addVendorContact(vendorId: string, input: { name: string; role?: string; phone?: string; email?: string; isPrimary?: boolean }) {
  await connectMongoDB();
  const contact = await (VendorContact as any).create({
    vendorId,
    name: input.name.trim(),
    role: input.role?.trim() || 'Contact',
    phone: input.phone?.trim(),
    email: input.email?.trim().toLowerCase(),
    isPrimary: !!input.isPrimary
  });
  return contact.toObject ? contact.toObject() : contact;
}

export async function deleteVendorContact(contactId: string) {
  await connectMongoDB();
  await (VendorContact as any).findByIdAndDelete(contactId);
  return { success: true };
}

export async function addVendorDocument(vendorId: string, input: { documentName: string; documentType: any; fileUrl: string; projectId?: string; remarks?: string; user?: string }) {
  await connectMongoDB();
  const doc = await (VendorDocument as any).create({
    vendorId,
    projectId: input.projectId || undefined,
    documentName: input.documentName.trim(),
    documentType: input.documentType || 'OTHER',
    fileUrl: input.fileUrl.trim(),
    uploadedBy: input.user || 'Site Supervisor',
    remarks: input.remarks?.trim()
  });

  await logAuditAction({
    user: input.user || 'Site Supervisor',
    action: 'VENDOR_DOCUMENT_ADDED',
    entity: 'VendorDocument',
    entityId: doc._id.toString(),
    metadata: { vendorId, documentName: input.documentName }
  });

  return doc.toObject ? doc.toObject() : doc;
}

export async function createVendorBillService(input: {
  projectId: string;
  vendorId: string;
  billNumber: string;
  billDate?: Date;
  totalAmount: number;
  remarks?: string;
  user?: string;
}) {
  await connectMongoDB();

  const vendor = await (VendorModel as any).findById(input.vendorId).lean();
  if (!vendor) throw new Error('Vendor not found');

  const roundedTotal = roundMoney(input.totalAmount);
  if (roundedTotal <= 0) throw new Error('Bill total must be greater than zero');

  const bill = await (VendorBill as any).create({
    projectId: input.projectId,
    vendorId: input.vendorId,
    vendorName: vendor.name,
    billNumber: input.billNumber.trim(),
    billDate: input.billDate || new Date(),
    totalAmount: roundedTotal,
    paidAmount: 0,
    status: 'OPEN',
    remarks: input.remarks?.trim()
  });

  await logAuditAction({
    user: input.user || 'Site Supervisor',
    action: 'VENDOR_BILL_CREATED',
    entity: 'VendorBill',
    entityId: bill._id.toString(),
    metadata: { vendorId: input.vendorId, billNumber: input.billNumber, totalAmount: roundedTotal }
  });

  return bill.toObject ? bill.toObject() : bill;
}

export async function deleteVendor(id: string, user?: string) {
  await connectMongoDB();
  const vendor = await (VendorModel as any).findById(id);
  if (!vendor) throw new Error('Vendor not found');

  await (VendorModel as any).findByIdAndDelete(id);

  await logAuditAction({
    user: user || 'Site Supervisor',
    action: 'VENDOR_DELETED',
    entity: 'Vendor',
    entityId: id,
    metadata: { name: vendor.name }
  });

  return { ok: true, id };
}

export async function updateVendorContact(contactId: string, input: { name?: string; role?: string; phone?: string; email?: string; isPrimary?: boolean }) {
  await connectMongoDB();
  const contact = await (VendorContact as any).findById(contactId);
  if (!contact) throw new Error('Vendor contact not found');

  if (input.name) contact.name = input.name.trim();
  if (input.role !== undefined) contact.role = input.role.trim();
  if (input.phone !== undefined) contact.phone = input.phone.trim();
  if (input.email !== undefined) contact.email = input.email.trim().toLowerCase();
  if (input.isPrimary !== undefined) contact.isPrimary = !!input.isPrimary;

  await contact.save();
  return contact.toObject ? contact.toObject() : contact;
}

export async function updateVendorBillService(billId: string, input: { billNumber?: string; billDate?: Date; totalAmount?: number; remarks?: string }, user?: string) {
  await connectMongoDB();
  const bill = await (VendorBill as any).findById(billId);
  if (!bill) throw new Error('Vendor bill not found');

  if (input.billNumber) bill.billNumber = input.billNumber.trim();
  if (input.billDate) bill.billDate = new Date(input.billDate);
  if (input.totalAmount !== undefined) {
    const rounded = roundMoney(input.totalAmount);
    if (rounded <= 0) throw new Error('Bill total must be greater than zero');
    bill.totalAmount = rounded;
  }
  if (input.remarks !== undefined) bill.remarks = input.remarks.trim();

  await bill.save();

  await logAuditAction({
    user: user || 'Site Supervisor',
    action: 'VENDOR_BILL_UPDATED',
    entity: 'VendorBill',
    entityId: billId,
    metadata: { billNumber: bill.billNumber, totalAmount: bill.totalAmount }
  });

  return bill.toObject ? bill.toObject() : bill;
}

export async function deleteVendorBillService(billId: string, user?: string) {
  await connectMongoDB();
  const bill = await (VendorBill as any).findById(billId);
  if (!bill) throw new Error('Vendor bill not found');

  await (VendorBill as any).findByIdAndDelete(billId);

  await logAuditAction({
    user: user || 'Site Supervisor',
    action: 'VENDOR_BILL_DELETED',
    entity: 'VendorBill',
    entityId: billId,
    metadata: { billNumber: bill.billNumber }
  });

  return { ok: true, id: billId };
}

