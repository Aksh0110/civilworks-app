import { connectMongoDB } from '../mongodb';
import { Expense, IExpense, ExpenseStatus } from '../models/Expense';
import { ExpenseCategory, DEFAULT_EXPENSE_CATEGORIES, PAYMENT_METHODS, PaymentMethodId } from '../models/ExpenseCategory';
import { logAuditAction } from './auditService';
import mongoose from 'mongoose';

/**
 * ANTI-DUPLICATE BUSINESS RULE DOCUMENTATION:
 * Material purchases recorded through Material Inward / Vendor Bills must NOT be entered as Expenses.
 * Operational site expenses (fuel, food, transport, small tools) are kept strictly separate from
 * material procurement to prevent double-counting project costs.
 */

export async function getExpenseCategories() {
  await connectMongoDB();
  const query: any = { status: 'ACTIVE' };
  let categories = await ExpenseCategory.find(query).sort({ sortOrder: 1, name: 1 }).exec();

  if (categories.length === 0) {
    // Seed default categories
    const seedOps = DEFAULT_EXPENSE_CATEGORIES.map((cat) => ({
      name: cat.name,
      icon: cat.icon,
      sortOrder: cat.sortOrder,
      isDefault: true,
      status: 'ACTIVE' as const
    }));
    await (ExpenseCategory as any).insertMany(seedOps);
    categories = await ExpenseCategory.find(query).sort({ sortOrder: 1, name: 1 }).exec();
  }

  return JSON.parse(JSON.stringify(categories));
}

export async function createExpenseCategory(data: { name: string; icon?: string; sortOrder?: number }, user?: string) {
  await connectMongoDB();
  if (!data.name?.trim()) {
    throw new Error('Category name is required.');
  }

  const query: any = { name: data.name.trim() };
  const existing = await ExpenseCategory.findOne(query).exec();
  if (existing) {
    throw new Error(`Category "${data.name}" already exists.`);
  }

  const cat = await ExpenseCategory.create({
    name: data.name.trim(),
    icon: data.icon?.trim() || '💸',
    sortOrder: Number(data.sortOrder || 99),
    status: 'ACTIVE',
    isDefault: false
  });

  await logAuditAction({
    user,
    action: 'EXPENSE_CATEGORY_CREATED',
    entity: 'ExpenseCategory',
    entityId: cat._id.toString(),
    metadata: { name: cat.name }
  });

  return JSON.parse(JSON.stringify(cat));
}

export async function updateExpenseCategory(id: string, data: { name?: string; icon?: string }, user?: string) {
  await connectMongoDB();
  const cat = await (ExpenseCategory as any).findById(id).exec();
  if (!cat) throw new Error('Expense category not found.');

  if (data.name?.trim()) cat.name = data.name.trim();
  if (data.icon?.trim()) cat.icon = data.icon.trim();

  await cat.save();

  await logAuditAction({
    user,
    action: 'EXPENSE_CATEGORY_UPDATED',
    entity: 'ExpenseCategory',
    entityId: id,
    metadata: { updates: data }
  });

  return JSON.parse(JSON.stringify(cat));
}

export async function deleteExpenseCategory(id: string, user?: string) {
  await connectMongoDB();
  const cat = await (ExpenseCategory as any).findById(id).exec();
  if (!cat) throw new Error('Expense category not found.');

  await (ExpenseCategory as any).findByIdAndDelete(id).exec();

  await logAuditAction({
    user,
    action: 'EXPENSE_CATEGORY_DELETED',
    entity: 'ExpenseCategory',
    entityId: id,
    metadata: { name: cat.name }
  });

  return { ok: true, id };
}

export async function updateExpense(id: string, projectId: string, payload: Partial<CreateExpensePayload>, user?: string) {
  await connectMongoDB();
  const expense = await (Expense as any).findOne({ _id: id, projectId }).exec();
  if (!expense) throw new Error('Expense record not found.');

  if (payload.amount !== undefined) {
    const amt = Number(payload.amount);
    if (isNaN(amt) || amt <= 0) throw new Error('Expense amount must be a positive number.');
    expense.amount = Math.round(amt * 100) / 100;
  }

  if (payload.categoryId) {
    const catDoc = await (ExpenseCategory as any).findById(payload.categoryId).exec();
    if (catDoc) {
      expense.categoryId = payload.categoryId;
      expense.categoryName = catDoc.name;
      expense.categoryIcon = catDoc.icon || '💸';
    }
  }

  if (payload.paymentMethod) expense.paymentMethod = payload.paymentMethod;
  if (payload.expenseDate) expense.expenseDate = new Date(payload.expenseDate);
  if (payload.vendorPerson !== undefined) expense.vendorPerson = payload.vendorPerson.trim();
  if (payload.referenceNumber !== undefined) expense.referenceNumber = payload.referenceNumber.trim();
  if (payload.remark !== undefined) expense.remark = payload.remark.trim();

  await expense.save();

  await logAuditAction({
    user,
    action: 'EXPENSE_UPDATED',
    entity: 'Expense',
    entityId: expense._id.toString(),
    metadata: { updates: payload }
  });

  return JSON.parse(JSON.stringify(expense));
}


export interface CreateExpensePayload {
  projectId: string;
  categoryId: string;
  amount: number;
  paymentMethod: PaymentMethodId;
  expenseDate: string;
  vendorPerson?: string;
  referenceNumber?: string;
  remark?: string;
  photoUrl?: string;
}

export async function createExpense(payload: CreateExpensePayload, user?: string) {
  await connectMongoDB();

  if (!mongoose.isValidObjectId(payload.projectId)) {
    throw new Error('Invalid projectId.');
  }
  if (!mongoose.isValidObjectId(payload.categoryId)) {
    throw new Error('Invalid categoryId.');
  }

  const amountNum = Number(payload.amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    throw new Error('Expense amount must be a positive number greater than 0.');
  }

  const validPaymentMethods: PaymentMethodId[] = ['CASH', 'UPI_ONLINE', 'BANK_TRANSFER', 'ADVANCE', 'OTHER'];
  if (!validPaymentMethods.includes(payload.paymentMethod)) {
    throw new Error('Invalid payment method selected.');
  }

  if (!payload.expenseDate) {
    throw new Error('Expense date is required.');
  }

  const catDoc = await (ExpenseCategory as any).findById(payload.categoryId).exec();
  if (!catDoc || catDoc.status !== 'ACTIVE') {
    throw new Error('Selected expense category is invalid or inactive.');
  }

  const roundedAmount = Math.round(amountNum * 100) / 100;

  const expense = await Expense.create({
    projectId: payload.projectId,
    categoryId: payload.categoryId,
    categoryName: catDoc.name,
    categoryIcon: catDoc.icon || '💸',
    amount: roundedAmount,
    paymentMethod: payload.paymentMethod,
    expenseDate: new Date(payload.expenseDate),
    vendorPerson: payload.vendorPerson?.trim(),
    referenceNumber: payload.referenceNumber?.trim(),
    remark: payload.remark?.trim(),
    photoUrl: payload.photoUrl?.trim(),
    status: 'ACTIVE',
    createdBy: user || 'Site Supervisor'
  });

  await logAuditAction({
    user,
    action: 'EXPENSE_CREATED',
    entity: 'Expense',
    entityId: expense._id.toString(),
    metadata: {
      amount: roundedAmount,
      categoryName: catDoc.name,
      paymentMethod: payload.paymentMethod,
      expenseDate: payload.expenseDate
    }
  });

  return JSON.parse(JSON.stringify(expense));
}

export interface GetExpensesFilter {
  search?: string;
  categoryId?: string;
  paymentMethod?: PaymentMethodId;
  timeframe?: 'today' | 'week' | 'month' | 'all';
  status?: ExpenseStatus | 'ALL';
  page?: number;
  limit?: number;
}

export async function getExpenses(projectId: string, filter?: GetExpensesFilter) {
  await connectMongoDB();
  if (!mongoose.isValidObjectId(projectId)) {
    throw new Error('Invalid projectId.');
  }

  const query: any = { projectId };

  // Status filter (default ACTIVE unless explicitly specified)
  if (filter?.status && filter.status !== 'ALL') {
    query.status = filter.status;
  } else if (!filter?.status) {
    query.status = 'ACTIVE';
  }

  if (filter?.categoryId && mongoose.isValidObjectId(filter.categoryId)) {
    query.categoryId = filter.categoryId;
  }

  if (filter?.paymentMethod) {
    query.paymentMethod = filter.paymentMethod;
  }

  // Timeframe date range filter
  if (filter?.timeframe && filter.timeframe !== 'all') {
    const now = new Date();
    if (filter.timeframe === 'today') {
      const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const endOfDay = new Date(startOfDay);
      endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);
      query.expenseDate = { $gte: startOfDay, $lt: endOfDay };
    } else if (filter.timeframe === 'week') {
      const startOfWeek = new Date(now);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday start
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0, 0, 0, 0);
      query.expenseDate = { $gte: startOfWeek };
    } else if (filter.timeframe === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      query.expenseDate = { $gte: startOfMonth };
    }
  }

  const page = Math.max(1, Number(filter?.page || 1));
  const limit = Math.min(100, Math.max(1, Number(filter?.limit || 20)));
  const skip = (page - 1) * limit;

  let expenses = await Expense.find(query)
    .sort({ expenseDate: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .exec();

  let plainExpenses = JSON.parse(JSON.stringify(expenses));

  if (filter?.search?.trim()) {
    const q = filter.search.toLowerCase();
    plainExpenses = plainExpenses.filter(
      (e: any) =>
        e.categoryName.toLowerCase().includes(q) ||
        (e.vendorPerson && e.vendorPerson.toLowerCase().includes(q)) ||
        (e.remark && e.remark.toLowerCase().includes(q)) ||
        (e.referenceNumber && e.referenceNumber.toLowerCase().includes(q))
    );
  }

  const totalCount = await Expense.countDocuments(query);

  return {
    expenses: plainExpenses,
    pagination: {
      total: totalCount,
      page,
      limit,
      pages: Math.ceil(totalCount / limit)
    }
  };
}

export async function getExpenseById(id: string, projectId: string) {
  await connectMongoDB();
  if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(projectId)) {
    throw new Error('Invalid expense ID or project ID.');
  }

  const query: any = { _id: id, projectId };
  const expense = await Expense.findOne(query).exec();
  return expense ? JSON.parse(JSON.stringify(expense)) : null;
}

export async function voidExpense(id: string, projectId: string, reason: string, user?: string) {
  await connectMongoDB();
  if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(projectId)) {
    throw new Error('Invalid expense ID or project ID.');
  }

  if (!reason?.trim()) {
    throw new Error('Reason for voiding expense is required.');
  }

  const query: any = { _id: id, projectId };
  const expense = await Expense.findOne(query).exec();
  if (!expense) {
    throw new Error('Expense record not found.');
  }
  if (expense.status === 'VOIDED') {
    throw new Error('This expense record has already been voided.');
  }

  expense.status = 'VOIDED';
  expense.voidReason = reason.trim();
  await expense.save();

  await logAuditAction({
    user,
    action: 'EXPENSE_VOIDED',
    entity: 'Expense',
    entityId: expense._id.toString(),
    metadata: {
      amount: expense.amount,
      categoryName: expense.categoryName,
      reason: reason.trim()
    }
  });

  return JSON.parse(JSON.stringify(expense));
}

// Centralized Backend Expense Summary Calculations
export async function getExpenseSummary(projectId: string) {
  await connectMongoDB();
  if (!mongoose.isValidObjectId(projectId)) {
    return {
      todayTotal: 0,
      weekTotal: 0,
      monthTotal: 0,
      projectTotal: 0,
      categorySummary: [],
      paymentMethodSummary: []
    };
  }

  const activeQuery: any = { projectId, status: 'ACTIVE' };
  const allActiveExpenses = await Expense.find(activeQuery).exec();

  const now = new Date();
  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const endOfToday = new Date(startOfToday);
  endOfToday.setUTCDate(endOfToday.getUTCDate() + 1);

  const startOfWeek = new Date(now);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let todayTotal = 0;
  let weekTotal = 0;
  let monthTotal = 0;
  let projectTotal = 0;

  const categoryMap = new Map<string, { categoryId: string; categoryName: string; categoryIcon: string; totalAmount: number }>();
  const paymentMethodMap = new Map<PaymentMethodId, number>();

  allActiveExpenses.forEach((exp: any) => {
    const amt = exp.amount || 0;
    const expDate = new Date(exp.expenseDate);
    projectTotal += amt;

    if (expDate >= startOfToday && expDate < endOfToday) {
      todayTotal += amt;
    }
    if (expDate >= startOfWeek) {
      weekTotal += amt;
    }
    if (expDate >= startOfMonth) {
      monthTotal += amt;
    }

    // Category aggregation
    const catId = exp.categoryId.toString();
    const existingCat = categoryMap.get(catId) || {
      categoryId: catId,
      categoryName: exp.categoryName,
      categoryIcon: exp.categoryIcon || '💸',
      totalAmount: 0
    };
    existingCat.totalAmount += amt;
    categoryMap.set(catId, existingCat);

    // Payment Method aggregation
    const pm = exp.paymentMethod as PaymentMethodId;
    const existingPm = paymentMethodMap.get(pm) || 0;
    paymentMethodMap.set(pm, existingPm + amt);
  });

  // Format Category Summary with percentage
  const categorySummary = Array.from(categoryMap.values()).map((c) => ({
    ...c,
    percentage: projectTotal > 0 ? Math.round((c.totalAmount / projectTotal) * 100) : 0
  })).sort((a, b) => b.totalAmount - a.totalAmount);

  // Format Payment Method Summary
  const paymentMethodSummary = PAYMENT_METHODS.map((pm) => ({
    id: pm.id,
    label: pm.label,
    icon: pm.icon,
    totalAmount: paymentMethodMap.get(pm.id) || 0,
    percentage: projectTotal > 0 ? Math.round(((paymentMethodMap.get(pm.id) || 0) / projectTotal) * 100) : 0
  })).filter((pm) => pm.totalAmount > 0);

  return {
    todayTotal,
    weekTotal,
    monthTotal,
    projectTotal,
    categorySummary,
    paymentMethodSummary
  };
}
