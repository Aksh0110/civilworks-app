import { connectMongoDB } from '../mongodb';
import { Attendance } from '../models/Attendance';
import { WageEntry } from '../models/WageEntry';
import { MaterialInward } from '../models/MaterialInward';
import { MaterialIssue } from '../models/MaterialIssue';
import { Expense } from '../models/Expense';
import { Payment } from '../models/Payment';
import { VendorBill } from '../models/VendorBill';
import { WorkerModel } from '../models/Worker';
import { getStockOverview } from './materialService';
import { getVendorsWithOutstanding, roundMoney } from './paymentService';
import { getVendorLedger } from './vendorService';
import { getDailyReportData } from './progressService';
import mongoose from 'mongoose';

export async function getAttendanceReport(projectId: string, fromDate?: string, toDate?: string) {
  await connectMongoDB();
  const projId = new (mongoose.Types.ObjectId as any)(projectId);

  const query: any = { projectId: projId };
  if (fromDate || toDate) {
    query.date = {};
    if (fromDate) query.date.$gte = new Date(fromDate);
    if (toDate) query.date.$lte = new Date(toDate + 'T23:59:59.999Z');
  }

  const records = await Attendance.find(query)
    .populate('workerId', 'name category dailyRate')
    .sort({ date: -1 })
    .lean();

  const totalRecords = records.length;
  const presentCount = records.filter((r: any) => r.status === 'PRESENT').length;
  const halfDayCount = records.filter((r: any) => r.status === 'HALF_DAY').length;
  const absentCount = records.filter((r: any) => r.status === 'ABSENT').length;

  return {
    summary: { totalRecords, presentCount, halfDayCount, absentCount },
    records: records.map((r: any) => ({
      id: r._id.toString(),
      date: r.date,
      workerName: r.workerId?.name || 'Worker',
      category: r.workerId?.category || 'General',
      status: r.status,
      remarks: r.remarks
    }))
  };
}

export async function getWageReport(projectId: string, fromDate?: string, toDate?: string) {
  await connectMongoDB();
  const projId = new (mongoose.Types.ObjectId as any)(projectId);

  const wageQuery: any = { projectId: projId };
  if (fromDate || toDate) {
    wageQuery.date = {};
    if (fromDate) wageQuery.date.$gte = new Date(fromDate);
    if (toDate) wageQuery.date.$lte = new Date(toDate + 'T23:59:59.999Z');
  }

  const wageEntries = await WageEntry.find(wageQuery).sort({ date: -1 }).lean();
  const workers = await (WorkerModel as any).find({ status: 'ACTIVE' }).lean();

  // Aggregate per worker
  const workerMap: Record<string, { workerName: string; category: string; dailyRate: number; workedDays: number; halfDays: number; grossWage: number }> = {};

  for (const entry of wageEntries) {
    for (const wItem of entry.workers || []) {
      const wId = wItem.workerId?.toString();
      if (!wId) continue;

      if (!workerMap[wId]) {
        const wObj = workers.find((w: any) => w._id.toString() === wId);
        workerMap[wId] = {
          workerName: wObj?.name || 'Worker',
          category: wObj?.category || 'General',
          dailyRate: wObj?.dailyRate || 0,
          workedDays: 0,
          halfDays: 0,
          grossWage: 0
        };
      }

      if (wItem.status === 'PRESENT') workerMap[wId].workedDays += 1;
      else if (wItem.status === 'HALF_DAY') workerMap[wId].halfDays += 1;

      workerMap[wId].grossWage = roundMoney(workerMap[wId].grossWage + (wItem.wageAmount || 0));
    }
  }

  // Fetch completed payments for workers to subtract paid amounts (excluding VOIDED)
  const payments = await (Payment as any).find({
    projectId: projId,
    recipientType: 'WORKER',
    status: 'COMPLETED'
  }).lean();

  const reportList = Object.keys(workerMap).map((wId) => {
    const info = workerMap[wId];
    const workerPayments = payments.filter((p: any) => p.recipientId?.toString() === wId);

    const paidWages = roundMoney(
      workerPayments
        .filter((p: any) => p.paymentType === 'LABOUR_PAYMENT')
        .reduce((s: number, p: any) => s + (p.amount || 0), 0)
    );

    const advances = roundMoney(
      workerPayments
        .filter((p: any) => p.paymentType === 'LABOUR_ADVANCE')
        .reduce((s: number, p: any) => s + (p.amount || 0), 0)
    );

    const netOutstanding = roundMoney(Math.max(0, info.grossWage - paidWages - advances));

    return {
      workerId: wId,
      workerName: info.workerName,
      category: info.category,
      dailyRate: info.dailyRate,
      workedDays: info.workedDays,
      halfDays: info.halfDays,
      grossWage: info.grossWage,
      paidWages,
      advances,
      netOutstanding
    };
  });

  const totalGrossWage = roundMoney(reportList.reduce((s, r) => s + r.grossWage, 0));
  const totalPaidWages = roundMoney(reportList.reduce((s, r) => s + r.paidWages, 0));
  const totalAdvances = roundMoney(reportList.reduce((s, r) => s + r.advances, 0));
  const totalOutstanding = roundMoney(reportList.reduce((s, r) => s + r.netOutstanding, 0));

  return {
    summary: { totalGrossWage, totalPaidWages, totalAdvances, totalOutstanding },
    records: reportList
  };
}

export async function getMaterialStockReport(projectId: string, category?: string) {
  await connectMongoDB();
  const stockOverview = await getStockOverview(projectId, category);
  const materials = Array.isArray(stockOverview) ? stockOverview : [];

  const totalItems = materials.length;
  const goodCount = materials.filter((m: any) => (m.currentStock || m.availableQuantity || 0) > 0).length;
  const outOfStockCount = materials.filter((m: any) => (m.currentStock || m.availableQuantity || 0) <= 0).length;

  return {
    summary: { totalItems, goodCount, outOfStockCount },
    records: materials.map((m: any) => {
      const qty = m.currentStock !== undefined ? m.currentStock : m.availableQuantity || 0;
      const status: 'Available' | 'Out of Stock' = qty <= 0 ? 'Out of Stock' : 'Available';

      return {
        materialId: m.materialId || m._id?.toString(),
        materialName: m.name,
        category: m.category || 'General',
        availableQuantity: qty,
        unit: m.unit,
        status
      };
    })
  };
}

export async function getMaterialMovementReport(projectId: string, fromDate?: string, toDate?: string) {
  await connectMongoDB();
  const projId = new (mongoose.Types.ObjectId as any)(projectId);

  const query: any = { projectId: projId };
  if (fromDate || toDate) {
    query.date = {};
    if (fromDate) query.date.$gte = new Date(fromDate);
    if (toDate) query.date.$lte = new Date(toDate + 'T23:59:59.999Z');
  }

  const inward = await (MaterialInward as any).find(query).sort({ date: -1 }).lean();
  const issues = await (MaterialIssue as any).find(query).sort({ date: -1 }).lean();

  const movements: Array<{ id: string; date: Date; type: 'INWARD' | 'ISSUE'; materialName: string; quantity: number; unit: string; reference: string; notes?: string }> = [];

  for (const i of inward) {
    movements.push({
      id: i._id.toString(),
      date: new Date(i.date),
      type: 'INWARD',
      materialName: i.materialName,
      quantity: i.quantity,
      unit: i.unit,
      reference: i.supplierVendorName ? `Vendor: ${i.supplierVendorName}` : `Inv #${i.invoiceNumber || 'N/A'}`,
      notes: i.remarks
    });
  }

  for (const s of issues) {
    movements.push({
      id: s._id.toString(),
      date: new Date(s.date),
      type: 'ISSUE',
      materialName: s.materialName,
      quantity: s.quantity,
      unit: s.unit,
      reference: s.workType ? `Work: ${s.workType}` : `Location: ${s.issuedToLocation || 'Site'}`,
      notes: s.remarks
    });
  }

  movements.sort((a, b) => b.date.getTime() - a.date.getTime());

  const totalInwardCount = inward.length;
  const totalIssueCount = issues.length;

  return {
    summary: { totalInwardCount, totalIssueCount, totalMovements: movements.length },
    records: movements
  };
}

export async function getVendorOutstandingReport(projectId: string) {
  await connectMongoDB();
  const vendors = await getVendorsWithOutstanding(projectId);

  const totalOutstanding = roundMoney(vendors.reduce((s, v) => s + v.outstandingAmount, 0));
  const totalAdvances = roundMoney(vendors.reduce((s, v) => s + v.advances, 0));

  return {
    summary: { totalVendors: vendors.length, totalOutstanding, totalAdvances },
    records: vendors.sort((a, b) => b.outstandingAmount - a.outstandingAmount)
  };
}

export async function getVendorLedgerReport(vendorId: string, projectId?: string) {
  await connectMongoDB();
  const ledger = await getVendorLedger(vendorId, projectId);
  return {
    records: ledger
  };
}

export async function getExpenseReport(projectId: string, fromDate?: string, toDate?: string, category?: string) {
  await connectMongoDB();
  const projId = new (mongoose.Types.ObjectId as any)(projectId);

  const query: any = { projectId: projId, status: 'COMPLETED' };
  if (category && category !== 'ALL') query.category = category;
  if (fromDate || toDate) {
    query.expenseDate = {};
    if (fromDate) query.expenseDate.$gte = new Date(fromDate);
    if (toDate) query.expenseDate.$lte = new Date(toDate + 'T23:59:59.999Z');
  }

  const expenses = await Expense.find(query).sort({ expenseDate: -1 }).lean();

  const categoryBreakdown: Record<string, number> = {};
  const paymentMethodBreakdown: Record<string, number> = {};

  let totalAmount = 0;
  for (const exp of expenses) {
    const amt = exp.amount || 0;
    totalAmount = roundMoney(totalAmount + amt);

    const cat = exp.category || 'General';
    categoryBreakdown[cat] = roundMoney((categoryBreakdown[cat] || 0) + amt);

    const pm = exp.paymentMethod || 'CASH';
    paymentMethodBreakdown[pm] = roundMoney((paymentMethodBreakdown[pm] || 0) + amt);
  }

  return {
    summary: { totalExpensesCount: expenses.length, totalAmount, categoryBreakdown, paymentMethodBreakdown },
    records: expenses.map((e: any) => ({
      id: e._id.toString(),
      voucherNumber: e.voucherNumber,
      expenseDate: e.expenseDate,
      title: e.title,
      category: e.category,
      amount: e.amount,
      paymentMethod: e.paymentMethod,
      paidToName: e.paidToName,
      remarks: e.remarks
    }))
  };
}

export async function getPaymentRegisterReport(projectId: string, fromDate?: string, toDate?: string, type?: string) {
  await connectMongoDB();
  const projId = new (mongoose.Types.ObjectId as any)(projectId);

  const query: any = { projectId: projId, status: 'COMPLETED' };
  if (type && type !== 'ALL') query.paymentType = type;
  if (fromDate || toDate) {
    query.paymentDate = {};
    if (fromDate) query.paymentDate.$gte = new Date(fromDate);
    if (toDate) query.paymentDate.$lte = new Date(toDate + 'T23:59:59.999Z');
  }

  const payments = await (Payment as any).find(query).sort({ paymentDate: -1 }).lean();

  let totalAmount = 0;
  let totalLabourPayments = 0;
  let totalVendorPayments = 0;
  let totalAdvances = 0;

  for (const p of payments) {
    const amt = p.amount || 0;
    totalAmount = roundMoney(totalAmount + amt);

    if (p.paymentType === 'LABOUR_PAYMENT') totalLabourPayments = roundMoney(totalLabourPayments + amt);
    else if (p.paymentType === 'VENDOR_PAYMENT') totalVendorPayments = roundMoney(totalVendorPayments + amt);
    else if (p.paymentType === 'LABOUR_ADVANCE' || p.paymentType === 'VENDOR_ADVANCE') totalAdvances = roundMoney(totalAdvances + amt);
  }

  return {
    summary: { totalPaymentsCount: payments.length, totalAmount, totalLabourPayments, totalVendorPayments, totalAdvances },
    records: payments.map((p: any) => ({
      id: p._id.toString(),
      receiptId: p.receiptId,
      paymentDate: p.paymentDate,
      paymentType: p.paymentType,
      recipientName: p.recipientName,
      recipientType: p.recipientType,
      amount: p.amount,
      paymentMethod: p.paymentMethod,
      notes: p.notes
    }))
  };
}

export async function getDailyProgressReportView(projectId: string, dateStr: string) {
  await connectMongoDB();
  return getDailyReportData(projectId, dateStr);
}

export async function getProjectCostSummaryReport(projectId: string) {
  await connectMongoDB();
  const projId = new (mongoose.Types.ObjectId as any)(projectId);

  const [wageEntries, inwardList, vendorBills, expenses, payments] = await Promise.all([
    (WageEntry as any).find({ projectId: projId }).lean(),
    (MaterialInward as any).find({ projectId: projId }).lean(),
    (VendorBill as any).find({ projectId: projId }).lean(),
    (Expense as any).find({ projectId: projId, status: 'COMPLETED' }).lean(),
    (Payment as any).find({ projectId: projId, status: 'COMPLETED' }).lean()
  ]);

  const grossLabourWages = roundMoney(
    wageEntries.reduce((s: number, w: any) => s + (w.totalWage || 0), 0)
  );

  const unlinkedInward = inwardList.filter(
    (i: any) => !vendorBills.some((b: any) => b.materialInwardId && b.materialInwardId.toString() === i._id.toString())
  );

  const materialProcurementBilled = roundMoney(
    vendorBills.reduce((s: number, b: any) => s + (b.totalAmount || 0), 0) +
      unlinkedInward.reduce((s: number, i: any) => s + (i.totalAmount || 0), 0)
  );

  const operationalSiteExpenses = roundMoney(
    expenses.reduce((s: number, e: any) => s + (e.amount || 0), 0)
  );

  const labourPaymentsSettled = roundMoney(
    payments
      .filter((p: any) => p.paymentType === 'LABOUR_PAYMENT' || p.paymentType === 'LABOUR_ADVANCE')
      .reduce((s: number, p: any) => s + (p.amount || 0), 0)
  );

  const vendorPaymentsSettled = roundMoney(
    payments
      .filter((p: any) => p.paymentType === 'VENDOR_PAYMENT' || p.paymentType === 'VENDOR_ADVANCE')
      .reduce((s: number, p: any) => s + (p.amount || 0), 0)
  );

  const totalIncurredCostBasis = roundMoney(grossLabourWages + materialProcurementBilled + operationalSiteExpenses);
  const totalCashOutflow = roundMoney(labourPaymentsSettled + vendorPaymentsSettled + operationalSiteExpenses);

  return {
    summary: {
      grossLabourWages,
      materialProcurementBilled,
      operationalSiteExpenses,
      labourPaymentsSettled,
      vendorPaymentsSettled,
      totalIncurredCostBasis,
      totalCashOutflow
    },
    note: 'Incurred Cost Basis equals Gross Labour Wages + Billed Material Procurement + Operational Expenses. Total Cash Outflow reflects actual cash disbursed (Payments + Advances + Expenses).'
  };
}
