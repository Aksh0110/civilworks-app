import { connectMongoDB } from '../mongodb';
import { Payment, IPayment, PaymentType, PaymentMethod } from '../models/Payment';
import { PaymentAllocation } from '../models/PaymentAllocation';
import { VendorBill } from '../models/VendorBill';
import { WorkerModel } from '../models/Worker';
import { VendorModel } from '../models/Vendor';
import { Attendance } from '../models/Attendance';
import { MaterialInward } from '../models/MaterialInward';
import { Project } from '../models/Project';
import { logAuditAction } from './auditService';
import mongoose from 'mongoose';

// Helper for exact currency rounding (2 decimals)
export function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

// Generate unique receipt ID format: PAY-YYMMDD-XXXXX
export async function generateReceiptId(): Promise<string> {
  await connectMongoDB();
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const prefix = `PAY-${yy}${mm}${dd}-`;

  const count = await (Payment as any).countDocuments({
    receiptId: new RegExp(`^${prefix}`)
  });

  const seq = String(count + 1).padStart(5, '0');
  return `${prefix}${seq}`;
}

// ----------------------------------------------------
// LABOUR PAYMENTS & WAGE DUE
// ----------------------------------------------------

export interface WorkerWageDueItem {
  workerId: string;
  workerIdCode?: string;
  name: string;
  category: string;
  dailyRate: number;
  mobile?: string;
  presentDays: number;
  halfDays: number;
  workedDays: number;
  grossWage: number;
  advances: number;
  previousPaid: number;
  amountDue: number;
}

export async function getWorkersWithDue(projectId: string): Promise<WorkerWageDueItem[]> {
  await connectMongoDB();
  const projId = new (mongoose.Types.ObjectId as any)(projectId);

  const workers = await (WorkerModel as any).find({ projectId: projId, status: 'ACTIVE' }).lean();

  const results: WorkerWageDueItem[] = [];

  for (const worker of workers) {
    const workerId = worker._id.toString();

    // 1. Fetch attendance records
    const attendanceRecords = await (Attendance as any).find({
      projectId: projId,
      workerId: worker._id
    }).lean();

    let presentDays = 0;
    let halfDays = 0;

    for (const att of attendanceRecords) {
      if (att.status === 'PRESENT') presentDays++;
      else if (att.status === 'HALF_DAY') halfDays++;
    }

    const workedDays = presentDays * 1.0 + halfDays * 0.5;
    const grossWage = roundMoney(workedDays * worker.dailyRate);

    // 2. Fetch completed labour payments
    const completedPayments = await (Payment as any).find({
      projectId: projId,
      recipientId: worker._id,
      paymentType: 'LABOUR_PAYMENT',
      status: 'COMPLETED'
    }).lean();

    const previousPaid = roundMoney(
      completedPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
    );

    // 3. Fetch completed labour advances
    const completedAdvances = await (Payment as any).find({
      projectId: projId,
      recipientId: worker._id,
      paymentType: 'LABOUR_ADVANCE',
      status: 'COMPLETED'
    }).lean();

    const advances = roundMoney(
      completedAdvances.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
    );

    const amountDue = roundMoney(Math.max(0, grossWage - advances - previousPaid));

    results.push({
      workerId,
      workerIdCode: worker.workerIdCode,
      name: worker.name,
      category: worker.category,
      dailyRate: worker.dailyRate,
      mobile: worker.mobile,
      presentDays,
      halfDays,
      workedDays,
      grossWage,
      advances,
      previousPaid,
      amountDue
    });
  }

  // Sort workers with amountDue > 0 first, then by name
  return results.sort((a, b) => b.amountDue - a.amountDue || a.name.localeCompare(b.name));
}

export async function getWorkerWageDetail(
  projectId: string,
  workerId: string
): Promise<WorkerWageDueItem | null> {
  const list = await getWorkersWithDue(projectId);
  return list.find((w) => w.workerId === workerId) || null;
}

export interface CreateLabourPaymentInput {
  projectId: string;
  workerId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate?: Date;
  notes?: string;
  idempotencyKey?: string;
  user?: string;
}

export async function createLabourPayment(input: CreateLabourPaymentInput) {
  await connectMongoDB();

  if (input.idempotencyKey) {
    const existing = await (Payment as any).findOne({ idempotencyKey: input.idempotencyKey }).lean();
    if (existing) return existing;
  }

  const worker = await (WorkerModel as any).findById(input.workerId).lean();
  if (!worker) throw new Error('Worker not found');

  const roundedAmount = roundMoney(input.amount);
  if (roundedAmount <= 0) throw new Error('Payment amount must be greater than zero');

  const receiptId = await generateReceiptId();

  const payment = await (Payment as any).create({
    projectId: input.projectId,
    paymentType: 'LABOUR_PAYMENT',
    recipientType: 'WORKER',
    recipientId: input.workerId,
    recipientName: worker.name,
    amount: roundedAmount,
    paymentMethod: input.paymentMethod || 'CASH',
    paymentDate: input.paymentDate || new Date(),
    receiptId,
    status: 'COMPLETED',
    idempotencyKey: input.idempotencyKey,
    notes: input.notes,
    createdBy: input.user || 'Site Supervisor'
  });

  await (PaymentAllocation as any).create({
    paymentId: payment._id,
    sourceType: 'WAGE',
    sourceId: input.workerId,
    allocatedAmount: roundedAmount
  });

  await logAuditAction({
    user: input.user || 'Site Supervisor',
    action: 'PAYMENT_LABOUR_CREATED',
    entity: 'Payment',
    entityId: payment._id.toString(),
    metadata: {
      receiptId,
      workerId: input.workerId,
      workerName: worker.name,
      amount: roundedAmount,
      paymentMethod: input.paymentMethod
    }
  });

  return payment.toObject ? payment.toObject() : payment;
}

export async function createLabourAdvance(input: CreateLabourPaymentInput) {
  await connectMongoDB();

  if (input.idempotencyKey) {
    const existing = await (Payment as any).findOne({ idempotencyKey: input.idempotencyKey }).lean();
    if (existing) return existing;
  }

  const worker = await (WorkerModel as any).findById(input.workerId).lean();
  if (!worker) throw new Error('Worker not found');

  const roundedAmount = roundMoney(input.amount);
  if (roundedAmount <= 0) throw new Error('Advance amount must be greater than zero');

  const receiptId = await generateReceiptId();

  const payment = await (Payment as any).create({
    projectId: input.projectId,
    paymentType: 'LABOUR_ADVANCE',
    recipientType: 'WORKER',
    recipientId: input.workerId,
    recipientName: worker.name,
    amount: roundedAmount,
    paymentMethod: input.paymentMethod || 'CASH',
    paymentDate: input.paymentDate || new Date(),
    receiptId,
    status: 'COMPLETED',
    idempotencyKey: input.idempotencyKey,
    notes: input.notes,
    createdBy: input.user || 'Site Supervisor'
  });

  await (PaymentAllocation as any).create({
    paymentId: payment._id,
    sourceType: 'ADVANCE',
    sourceId: input.workerId,
    allocatedAmount: roundedAmount
  });

  await logAuditAction({
    user: input.user || 'Site Supervisor',
    action: 'PAYMENT_LABOUR_ADVANCE_CREATED',
    entity: 'Payment',
    entityId: payment._id.toString(),
    metadata: {
      receiptId,
      workerId: input.workerId,
      workerName: worker.name,
      amount: roundedAmount,
      paymentMethod: input.paymentMethod
    }
  });

  return payment.toObject ? payment.toObject() : payment;
}

// ----------------------------------------------------
// VENDOR PAYMENTS & OUTSTANDING
// ----------------------------------------------------

export interface VendorOutstandingItem {
  vendorId: string;
  name: string;
  mobile?: string;
  category?: string;
  totalBilled: number;
  previousPaid: number;
  advances: number;
  outstandingAmount: number;
  openBillsCount: number;
}

export async function getVendorsWithOutstanding(projectId: string): Promise<VendorOutstandingItem[]> {
  await connectMongoDB();
  const projId = new (mongoose.Types.ObjectId as any)(projectId);

  const vendors = await (VendorModel as any).find({ status: 'ACTIVE' }).lean();
  const results: VendorOutstandingItem[] = [];

  for (const vendor of vendors) {
    const vendorId = vendor._id.toString();

    // 1. Calculate total billed from MaterialInward and VendorBill
    const inwardRecords = await (MaterialInward as any).find({
      projectId: projId,
      vendorId: vendor._id
    }).lean();

    const inwardTotal = inwardRecords.reduce((s: number, i: any) => s + (i.totalAmount || 0), 0);

    const vendorBills = await (VendorBill as any).find({
      projectId: projId,
      vendorId: vendor._id
    }).lean();

    const billsTotal = vendorBills.reduce((s: number, b: any) => s + (b.totalAmount || 0), 0);
    const openBillsCount = vendorBills.filter((b: any) => b.status !== 'SETTLED').length;

    const totalBilled = roundMoney(inwardTotal + billsTotal);

    // 2. Fetch completed vendor payments
    const payments = await (Payment as any).find({
      projectId: projId,
      recipientId: vendor._id,
      paymentType: 'VENDOR_PAYMENT',
      status: 'COMPLETED'
    }).lean();

    const previousPaid = roundMoney(payments.reduce((s: number, p: any) => s + (p.amount || 0), 0));

    // 3. Fetch completed vendor advances
    const advancesRecords = await (Payment as any).find({
      projectId: projId,
      recipientId: vendor._id,
      paymentType: 'VENDOR_ADVANCE',
      status: 'COMPLETED'
    }).lean();

    const advances = roundMoney(advancesRecords.reduce((s: number, p: any) => s + (p.amount || 0), 0));
    const outstandingAmount = roundMoney(Math.max(0, totalBilled - previousPaid - advances));

    results.push({
      vendorId,
      name: vendor.name,
      mobile: vendor.mobile,
      category: vendor.category,
      totalBilled,
      previousPaid,
      advances,
      outstandingAmount,
      openBillsCount
    });
  }

  return results.sort((a, b) => b.outstandingAmount - a.outstandingAmount || a.name.localeCompare(b.name));
}

export async function getVendorDetail(projectId: string, vendorId: string) {
  await connectMongoDB();
  const projId = new (mongoose.Types.ObjectId as any)(projectId);
  const vId = new (mongoose.Types.ObjectId as any)(vendorId);

  const vendor = await (VendorModel as any).findById(vId).lean();
  if (!vendor) throw new Error('Vendor not found');

  const summaryList = await getVendorsWithOutstanding(projectId);
  const summary = summaryList.find((v) => v.vendorId === vendorId);

  const bills = await (VendorBill as any).find({ projectId: projId, vendorId: vId })
    .sort({ billDate: -1 })
    .lean();

  const inward = await (MaterialInward as any).find({ projectId: projId, vendorId: vId })
    .sort({ date: -1 })
    .lean();

  const recentPayments = await (Payment as any).find({
    projectId: projId,
    recipientId: vId,
    recipientType: 'VENDOR'
  })
    .sort({ paymentDate: -1 })
    .limit(10)
    .lean();

  return {
    vendor,
    summary,
    bills,
    inward,
    recentPayments
  };
}

export interface CreateVendorPaymentInput {
  projectId: string;
  vendorId: string;
  billId?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate?: Date;
  notes?: string;
  idempotencyKey?: string;
  user?: string;
}

export async function createVendorPayment(input: CreateVendorPaymentInput) {
  await connectMongoDB();

  if (input.idempotencyKey) {
    const existing = await (Payment as any).findOne({ idempotencyKey: input.idempotencyKey }).lean();
    if (existing) return existing;
  }

  const vendor = await (VendorModel as any).findById(input.vendorId).lean();
  if (!vendor) throw new Error('Vendor not found');

  const roundedAmount = roundMoney(input.amount);
  if (roundedAmount <= 0) throw new Error('Payment amount must be greater than zero');

  const receiptId = await generateReceiptId();

  const payment = await (Payment as any).create({
    projectId: input.projectId,
    paymentType: 'VENDOR_PAYMENT',
    recipientType: 'VENDOR',
    recipientId: input.vendorId,
    recipientName: vendor.name,
    amount: roundedAmount,
    paymentMethod: input.paymentMethod || 'CASH',
    paymentDate: input.paymentDate || new Date(),
    receiptId,
    status: 'COMPLETED',
    idempotencyKey: input.idempotencyKey,
    notes: input.notes,
    createdBy: input.user || 'Site Supervisor'
  });

  if (input.billId) {
    const bill = await (VendorBill as any).findById(input.billId);
    if (bill) {
      bill.paidAmount = roundMoney((bill.paidAmount || 0) + roundedAmount);
      bill.status = bill.paidAmount >= bill.totalAmount ? 'SETTLED' : 'PARTIAL';
      await bill.save();

      await (PaymentAllocation as any).create({
        paymentId: payment._id,
        sourceType: 'VENDOR_BILL',
        sourceId: bill._id,
        allocatedAmount: roundedAmount
      });
    }
  }

  await logAuditAction({
    user: input.user || 'Site Supervisor',
    action: 'PAYMENT_VENDOR_CREATED',
    entity: 'Payment',
    entityId: payment._id.toString(),
    metadata: {
      receiptId,
      vendorId: input.vendorId,
      vendorName: vendor.name,
      amount: roundedAmount,
      paymentMethod: input.paymentMethod,
      billId: input.billId
    }
  });

  return payment.toObject ? payment.toObject() : payment;
}

export async function createVendorAdvance(input: CreateVendorPaymentInput) {
  await connectMongoDB();

  if (input.idempotencyKey) {
    const existing = await (Payment as any).findOne({ idempotencyKey: input.idempotencyKey }).lean();
    if (existing) return existing;
  }

  const vendor = await (VendorModel as any).findById(input.vendorId).lean();
  if (!vendor) throw new Error('Vendor not found');

  const roundedAmount = roundMoney(input.amount);
  if (roundedAmount <= 0) throw new Error('Advance amount must be greater than zero');

  const receiptId = await generateReceiptId();

  const payment = await (Payment as any).create({
    projectId: input.projectId,
    paymentType: 'VENDOR_ADVANCE',
    recipientType: 'VENDOR',
    recipientId: input.vendorId,
    recipientName: vendor.name,
    amount: roundedAmount,
    paymentMethod: input.paymentMethod || 'CASH',
    paymentDate: input.paymentDate || new Date(),
    receiptId,
    status: 'COMPLETED',
    idempotencyKey: input.idempotencyKey,
    notes: input.notes,
    createdBy: input.user || 'Site Supervisor'
  });

  await (PaymentAllocation as any).create({
    paymentId: payment._id,
    sourceType: 'ADVANCE',
    sourceId: input.vendorId,
    allocatedAmount: roundedAmount
  });

  await logAuditAction({
    user: input.user || 'Site Supervisor',
    action: 'PAYMENT_VENDOR_ADVANCE_CREATED',
    entity: 'Payment',
    entityId: payment._id.toString(),
    metadata: {
      receiptId,
      vendorId: input.vendorId,
      vendorName: vendor.name,
      amount: roundedAmount,
      paymentMethod: input.paymentMethod
    }
  });

  return payment.toObject ? payment.toObject() : payment;
}

// ----------------------------------------------------
// PAYMENT HISTORY, RECEIPTS, VOIDING & SUMMARIES
// ----------------------------------------------------

export interface PaymentHistoryFilter {
  projectId?: string;
  type?: string; // 'LABOUR_PAYMENT' | 'VENDOR_PAYMENT' | 'LABOUR_ADVANCE' | 'VENDOR_ADVANCE' | 'ALL'
  recipientType?: string;
  recipientId?: string;
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export async function getPaymentHistory(filter: PaymentHistoryFilter) {
  await connectMongoDB();

  const query: any = {};

  if (filter.projectId) query.projectId = filter.projectId;

  if (filter.type && filter.type !== 'ALL') {
    if (filter.type === 'LABOUR') {
      query.paymentType = { $in: ['LABOUR_PAYMENT', 'LABOUR_ADVANCE'] };
    } else if (filter.type === 'VENDOR') {
      query.paymentType = { $in: ['VENDOR_PAYMENT', 'VENDOR_ADVANCE'] };
    } else if (filter.type === 'ADVANCES') {
      query.paymentType = { $in: ['LABOUR_ADVANCE', 'VENDOR_ADVANCE'] };
    } else {
      query.paymentType = filter.type;
    }
  }

  if (filter.recipientId) query.recipientId = filter.recipientId;
  if (filter.status) query.status = filter.status;

  if (filter.search) {
    query.$or = [
      { recipientName: new RegExp(filter.search, 'i') },
      { receiptId: new RegExp(filter.search, 'i') },
      { notes: new RegExp(filter.search, 'i') }
    ];
  }

  if (filter.startDate || filter.endDate) {
    query.paymentDate = {};
    if (filter.startDate) query.paymentDate.$gte = new Date(filter.startDate);
    if (filter.endDate) query.paymentDate.$lte = new Date(filter.endDate + 'T23:59:59.999Z');
  }

  const page = filter.page || 1;
  const limit = filter.limit || 20;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    (Payment as any).find(query).sort({ paymentDate: -1 }).skip(skip).limit(limit).lean(),
    (Payment as any).countDocuments(query)
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
}

export async function getPaymentReceipt(paymentId: string) {
  await connectMongoDB();

  const payment = await (Payment as any).findById(paymentId).lean();
  if (!payment) throw new Error('Payment record not found');

  const project = await (Project as any).findById(payment.projectId).lean();

  return {
    receiptId: payment.receiptId,
    paymentId: payment._id.toString(),
    projectName: project?.name || 'Site Project',
    projectCode: project?.code || '',
    recipientName: payment.recipientName,
    recipientType: payment.recipientType,
    paymentType: payment.paymentType,
    amount: payment.amount,
    paymentMethod: payment.paymentMethod,
    paymentDate: payment.paymentDate,
    status: payment.status,
    notes: payment.notes,
    createdBy: payment.createdBy || 'Site Supervisor',
    createdAt: payment.createdAt
  };
}

export async function voidPayment(paymentId: string, voidReason: string, user?: string) {
  await connectMongoDB();

  if (!voidReason || !voidReason.trim()) {
    throw new Error('Void reason is required');
  }

  const payment = await (Payment as any).findById(paymentId);
  if (!payment) throw new Error('Payment not found');

  if (payment.status === 'VOIDED') {
    throw new Error('Payment is already voided');
  }

  payment.status = 'VOIDED';
  payment.voidReason = voidReason.trim();
  payment.voidedAt = new Date();
  payment.voidedBy = user || 'Site Supervisor';
  await payment.save();

  // Reverse allocations to vendor bills if applicable
  const allocations = await (PaymentAllocation as any).find({ paymentId: payment._id }).lean();
  for (const alloc of allocations) {
    if (alloc.sourceType === 'VENDOR_BILL') {
      const bill = await (VendorBill as any).findById(alloc.sourceId);
      if (bill) {
        bill.paidAmount = roundMoney(Math.max(0, (bill.paidAmount || 0) - alloc.allocatedAmount));
        bill.status = bill.paidAmount <= 0 ? 'OPEN' : 'PARTIAL';
        await bill.save();
      }
    }
  }

  await logAuditAction({
    user: user || 'Site Supervisor',
    action: 'PAYMENT_VOIDED',
    entity: 'Payment',
    entityId: payment._id.toString(),
    metadata: {
      receiptId: payment.receiptId,
      amount: payment.amount,
      voidReason: voidReason.trim()
    }
  });

  return payment.toObject ? payment.toObject() : payment;
}

export async function getProjectPaymentSummary(projectId: string) {
  await connectMongoDB();
  const projId = new (mongoose.Types.ObjectId as any)(projectId);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  // Today Labour Paid
  const todayLabour = await (Payment as any).aggregate([
    {
      $match: {
        projectId: projId,
        paymentType: 'LABOUR_PAYMENT',
        status: 'COMPLETED',
        paymentDate: { $gte: startOfDay, $lte: endOfDay }
      }
    },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  // Today Vendor Paid
  const todayVendor = await (Payment as any).aggregate([
    {
      $match: {
        projectId: projId,
        paymentType: 'VENDOR_PAYMENT',
        status: 'COMPLETED',
        paymentDate: { $gte: startOfDay, $lte: endOfDay }
      }
    },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  // Aggregate total labour due & vendor outstanding
  const workers = await getWorkersWithDue(projectId);
  const labourDueTotal = roundMoney(workers.reduce((s, w) => s + w.amountDue, 0));

  const vendors = await getVendorsWithOutstanding(projectId);
  const vendorDueTotal = roundMoney(vendors.reduce((s, v) => s + v.outstandingAmount, 0));

  return {
    todayLabourPaid: roundMoney(todayLabour[0]?.total || 0),
    todayVendorPaid: roundMoney(todayVendor[0]?.total || 0),
    outstandingLabourDue: labourDueTotal,
    outstandingVendorDue: vendorDueTotal
  };
}
