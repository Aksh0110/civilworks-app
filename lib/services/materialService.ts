import { connectMongoDB } from '../mongodb';
import { Material, IMaterial } from '../models/Material';
import { MaterialCategory, DEFAULT_MATERIAL_CATEGORIES, DEFAULT_UNITS } from '../models/MaterialCategory';
import { MaterialStock, StockStatus } from '../models/MaterialStock';
import { MaterialInward } from '../models/MaterialInward';
import { MaterialIssue } from '../models/MaterialIssue';
import { StockAdjustment, AdjustmentType } from '../models/StockAdjustment';
import { Vendor } from '../models/Vendor';
import { logAuditAction } from './auditService';
import mongoose from 'mongoose';

export function calculateStockStatus(currentStock: number, minStockLevel?: number): StockStatus {
  if (currentStock <= 0) {
    return 'OUT_OF_STOCK';
  }
  return 'GOOD';
}

export async function getMaterialCategories() {
  await connectMongoDB();
  const custom = await MaterialCategory.find().sort({ name: 1 }).exec();
  const names = Array.from(new Set([...DEFAULT_MATERIAL_CATEGORIES, ...custom.map((c: any) => c.name)]));
  return names;
}

export async function getUnits() {
  return DEFAULT_UNITS;
}

export async function getMaterials(projectId?: string, filter?: { category?: string; status?: string }) {
  await connectMongoDB();
  const query: any = {};
  if (filter?.category) query.category = filter.category;
  if (filter?.status) query.status = filter.status;
  else query.status = 'ACTIVE';

  const materials = await Material.find(query).sort({ name: 1 }).exec();
  const plainMaterials = JSON.parse(JSON.stringify(materials));

  if (!projectId || !mongoose.isValidObjectId(projectId)) {
    return plainMaterials;
  }

  // Populate project-specific stock for each material
  const stockQuery: any = { projectId };
  const stocks = await MaterialStock.find(stockQuery).exec();
  const stockMap = new Map<string, { currentStock: number; status: StockStatus }>();
  stocks.forEach((s: any) => {
    stockMap.set(s.materialId.toString(), {
      currentStock: s.currentStock,
      status: s.status as StockStatus
    });
  });

  return plainMaterials.map((mat: any) => {
    const stockInfo = stockMap.get(mat._id);
    const currentStock = stockInfo ? stockInfo.currentStock : 0;
    const status = calculateStockStatus(currentStock, mat.minStockLevel || 0);
    return {
      ...mat,
      currentStock,
      stockStatus: status
    };
  });
}

export async function createMaterial(data: Partial<IMaterial>, user?: string) {
  await connectMongoDB();
  if (!data.name || !data.category || !data.unit) {
    throw new Error('Material name, category, and unit are required.');
  }

  const mat = await Material.create({
    name: data.name.trim(),
    category: data.category.trim(),
    unit: data.unit.trim(),
    minStockLevel: Number(data.minStockLevel || 0),
    status: data.status || 'ACTIVE',
    defaultRate: Number(data.defaultRate || 0),
    code: data.code?.trim().toUpperCase(),
    description: data.description?.trim()
  });

  await logAuditAction({
    user,
    action: 'MATERIAL_CREATED',
    entity: 'Material',
    entityId: mat._id.toString(),
    metadata: { name: mat.name, category: mat.category, unit: mat.unit }
  });

  return JSON.parse(JSON.stringify(mat));
}

export async function updateMaterial(id: string, data: Partial<IMaterial>, user?: string) {
  await connectMongoDB();
  const mat = await (Material as any).findById(id).exec();
  if (!mat) {
    throw new Error('Material not found.');
  }

  if (data.name) mat.name = data.name.trim();
  if (data.category) mat.category = data.category.trim();
  if (data.unit) mat.unit = data.unit.trim();
  if (data.minStockLevel !== undefined) mat.minStockLevel = Number(data.minStockLevel);
  if (data.status) mat.status = data.status;
  if (data.defaultRate !== undefined) mat.defaultRate = Number(data.defaultRate);
  if (data.code !== undefined) mat.code = data.code.trim().toUpperCase();

  await mat.save();

  await logAuditAction({
    user,
    action: 'MATERIAL_UPDATED',
    entity: 'Material',
    entityId: mat._id.toString(),
    metadata: { updates: data }
  });

  return JSON.parse(JSON.stringify(mat));
}

// Vendor Master Helpers for Material Inward Integration
export async function getVendors() {
  await connectMongoDB();
  const query: any = { status: 'ACTIVE' };
  const vendors = await Vendor.find(query).sort({ name: 1 }).exec();
  return JSON.parse(JSON.stringify(vendors));
}

export async function createVendor(data: { name: string; mobile?: string; category?: string; address?: string }, user?: string) {
  await connectMongoDB();
  if (!data.name?.trim()) {
    throw new Error('Vendor name is required.');
  }

  const v = await Vendor.create({
    name: data.name.trim(),
    mobile: data.mobile?.trim(),
    category: data.category?.trim() || 'Supplier',
    address: data.address?.trim(),
    status: 'ACTIVE'
  });

  await logAuditAction({
    user,
    action: 'VENDOR_CREATED',
    entity: 'Vendor',
    entityId: v._id.toString(),
    metadata: { name: v.name }
  });

  return JSON.parse(JSON.stringify(v));
}

// Material Inward (Receive Material Workflow)
export interface ReceiveInwardItemInput {
  materialId: string;
  quantity: number;
  rate?: number;
}

export interface ReceiveInwardPayload {
  projectId: string;
  date: string;
  vendorId?: string;
  invoiceNumber?: string;
  challanNumber?: string;
  vehicleNumber?: string;
  remarks?: string;
  photoUrl?: string;
  items: ReceiveInwardItemInput[];
}

export async function receiveMaterialInward(payload: ReceiveInwardPayload, user?: string) {
  await connectMongoDB();

  if (!mongoose.isValidObjectId(payload.projectId)) {
    throw new Error('Invalid projectId.');
  }
  if (!payload.date || !Array.isArray(payload.items) || payload.items.length === 0) {
    throw new Error('Project, date, and at least one material item are required.');
  }

  // Validate items and fetch material master
  const matIds = payload.items.map((i) => i.materialId).filter((id) => mongoose.isValidObjectId(id));
  const matQuery: any = { _id: { $in: matIds } };
  const matDocs = await Material.find(matQuery).exec();
  const matMap = new Map<string, any>();
  matDocs.forEach((m: any) => matMap.set(m._id.toString(), m));

  let totalAmount = 0;
  const processedItems = payload.items.map((item) => {
    const mat = matMap.get(item.materialId);
    if (!mat) {
      throw new Error(`Material with ID ${item.materialId} not found.`);
    }
    if (mat.status !== 'ACTIVE') {
      throw new Error(`Material ${mat.name} is inactive and cannot be received.`);
    }
    const qty = Number(item.quantity);
    if (isNaN(qty) || qty <= 0) {
      throw new Error(`Invalid quantity ${item.quantity} for material ${mat.name}. Must be positive.`);
    }

    const rate = Number(item.rate || mat.defaultRate || 0);
    const amount = Math.round(qty * rate);
    totalAmount += amount;

    return {
      materialId: mat._id,
      materialName: mat.name,
      quantity: qty,
      unit: mat.unit,
      rate,
      amount
    };
  });

  // Resolve Vendor Name if vendorId is provided
  let vendorName = '';
  if (payload.vendorId && mongoose.isValidObjectId(payload.vendorId)) {
    const vDoc = await (Vendor as any).findById(payload.vendorId).exec();
    if (vDoc) vendorName = vDoc.name;
  }

  // Create MaterialInward Transaction
  const inward = await MaterialInward.create({
    projectId: payload.projectId,
    date: new Date(payload.date),
    vendorId: payload.vendorId ? payload.vendorId : undefined,
    vendorName,
    invoiceNumber: payload.invoiceNumber?.trim(),
    challanNumber: payload.challanNumber?.trim(),
    vehicleNumber: payload.vehicleNumber?.trim(),
    remarks: payload.remarks?.trim(),
    photoUrl: payload.photoUrl?.trim(),
    totalAmount,
    items: processedItems,
    receivedBy: user || 'Site Supervisor'
  });

  // Atomic Stock Increase for each received material item
  const updatedStockList = [];
  for (const item of processedItems) {
    const matDoc = matMap.get(item.materialId.toString());
    const minStock = matDoc?.minStockLevel || 0;

    const stockFilter: any = { projectId: payload.projectId, materialId: item.materialId };
    const stockDoc = await (MaterialStock as any).findOneAndUpdate(
      stockFilter,
      {
        $inc: { currentStock: item.quantity },
        $setOnInsert: {
          projectId: payload.projectId,
          materialId: item.materialId,
          unit: item.unit,
          minStockLevel: minStock
        },
        $set: { lastUpdated: new Date() }
      },
      { upsert: true, new: true }
    ).exec();

    // Recalculate & save Stock Status
    const newStatus = calculateStockStatus(stockDoc.currentStock, minStock);
    stockDoc.status = newStatus;
    await stockDoc.save();

    updatedStockList.push({
      materialId: item.materialId.toString(),
      materialName: item.materialName,
      currentStock: stockDoc.currentStock,
      unit: item.unit,
      status: newStatus
    });
  }

  await logAuditAction({
    user,
    action: 'MATERIAL_INWARD_RECORDED',
    entity: 'MaterialInward',
    entityId: inward._id.toString(),
    metadata: {
      date: payload.date,
      itemCount: processedItems.length,
      totalAmount,
      vendorName
    }
  });

  return {
    inward: JSON.parse(JSON.stringify(inward)),
    updatedStockList
  };
}

// Material Issue (Give Material Workflow)
export interface IssueItemInput {
  materialId: string;
  quantity: number;
}

export interface IssuePayload {
  projectId: string;
  date: string;
  locationWorkArea?: string;
  issuedTo?: string;
  remarks?: string;
  items: IssueItemInput[];
}

export async function issueMaterial(payload: IssuePayload, user?: string) {
  await connectMongoDB();

  if (!mongoose.isValidObjectId(payload.projectId)) {
    throw new Error('Invalid projectId.');
  }
  if (!payload.date || !Array.isArray(payload.items) || payload.items.length === 0) {
    throw new Error('Project, date, and at least one material item are required.');
  }

  const matIds = payload.items.map((i) => i.materialId).filter((id) => mongoose.isValidObjectId(id));
  const matQuery: any = { _id: { $in: matIds } };
  const matDocs = await Material.find(matQuery).exec();
  const matMap = new Map<string, any>();
  matDocs.forEach((m: any) => matMap.set(m._id.toString(), m));

  // Check available stock & guard against insufficient stock
  const currentStockQuery: any = {
    projectId: payload.projectId,
    materialId: { $in: matIds }
  };
  const currentStocks = await MaterialStock.find(currentStockQuery).exec();
  const stockMap = new Map<string, number>();
  currentStocks.forEach((s: any) => stockMap.set(s.materialId.toString(), s.currentStock));

  const processedItems = [];
  for (const item of payload.items) {
    const mat = matMap.get(item.materialId);
    if (!mat) {
      throw new Error(`Material with ID ${item.materialId} not found.`);
    }
    if (mat.status !== 'ACTIVE') {
      throw new Error(`Material ${mat.name} is inactive and cannot be issued.`);
    }

    const qty = Number(item.quantity);
    if (isNaN(qty) || qty <= 0) {
      throw new Error(`Invalid quantity ${item.quantity} for material ${mat.name}. Must be positive.`);
    }

    const available = stockMap.get(item.materialId) || 0;
    if (qty > available) {
      throw new Error(
        `Insufficient stock for "${mat.name}". Available balance: ${available} ${mat.unit}. Requested to issue: ${qty} ${mat.unit}.`
      );
    }

    processedItems.push({
      materialId: mat._id,
      materialName: mat.name,
      quantity: qty,
      unit: mat.unit
    });
  }

  // Create MaterialIssue Transaction
  const issue = await MaterialIssue.create({
    projectId: payload.projectId,
    date: new Date(payload.date),
    locationWorkArea: payload.locationWorkArea?.trim(),
    issuedTo: payload.issuedTo?.trim(),
    remarks: payload.remarks?.trim(),
    items: processedItems,
    issuedBy: user || 'Site Supervisor'
  });

  // Atomic Stock Decrease for each issued item
  const updatedStockList = [];
  for (const item of processedItems) {
    const matDoc = matMap.get(item.materialId.toString());
    const minStock = matDoc?.minStockLevel || 0;

    const stockFilter: any = { projectId: payload.projectId, materialId: item.materialId };
    const stockDoc = await (MaterialStock as any).findOneAndUpdate(
      stockFilter,
      {
        $inc: { currentStock: -item.quantity },
        $set: { lastUpdated: new Date() }
      },
      { new: true }
    ).exec();

    const newStatus = calculateStockStatus(stockDoc ? stockDoc.currentStock : 0, minStock);
    if (stockDoc) {
      stockDoc.status = newStatus;
      await stockDoc.save();
    }

    updatedStockList.push({
      materialId: item.materialId.toString(),
      materialName: item.materialName,
      currentStock: stockDoc ? stockDoc.currentStock : 0,
      unit: item.unit,
      status: newStatus
    });
  }

  await logAuditAction({
    user,
    action: 'MATERIAL_ISSUED',
    entity: 'MaterialIssue',
    entityId: issue._id.toString(),
    metadata: {
      date: payload.date,
      locationWorkArea: payload.locationWorkArea,
      itemCount: processedItems.length
    }
  });

  return {
    issue: JSON.parse(JSON.stringify(issue)),
    updatedStockList
  };
}

// Stock Adjustment Workflow
export async function adjustStock(
  payload: {
    projectId: string;
    materialId: string;
    adjustmentType: AdjustmentType;
    quantity: number;
    reason: string;
  },
  user?: string
) {
  await connectMongoDB();
  if (!mongoose.isValidObjectId(payload.projectId) || !mongoose.isValidObjectId(payload.materialId)) {
    throw new Error('Invalid projectId or materialId.');
  }

  const matDoc = await (Material as any).findById(payload.materialId).exec();
  if (!matDoc) throw new Error('Material not found.');

  const stockFilter: any = { projectId: payload.projectId, materialId: payload.materialId };
  let stockDoc = await (MaterialStock as any).findOne(stockFilter).exec();
  const previousStock = stockDoc ? stockDoc.currentStock : 0;
  let newStock = previousStock;

  const qty = Number(payload.quantity);
  if (payload.adjustmentType === 'ADD') {
    newStock = previousStock + qty;
  } else if (payload.adjustmentType === 'SUBTRACT') {
    newStock = Math.max(0, previousStock - qty);
  } else if (payload.adjustmentType === 'SET') {
    newStock = Math.max(0, qty);
  }

  const newStatus = calculateStockStatus(newStock, matDoc.minStockLevel || 0);

  if (!stockDoc) {
    stockDoc = await MaterialStock.create({
      projectId: payload.projectId,
      materialId: payload.materialId,
      currentStock: newStock,
      minStockLevel: matDoc.minStockLevel || 0,
      unit: matDoc.unit,
      status: newStatus,
      lastUpdated: new Date()
    });
  } else {
    stockDoc.currentStock = newStock;
    stockDoc.status = newStatus;
    stockDoc.lastUpdated = new Date();
    await stockDoc.save();
  }

  const adj = await StockAdjustment.create({
    projectId: payload.projectId,
    date: new Date(),
    materialId: payload.materialId,
    materialName: matDoc.name,
    adjustmentType: payload.adjustmentType,
    quantity: qty,
    unit: matDoc.unit,
    previousStock,
    newStock,
    reason: payload.reason.trim(),
    adjustedBy: user || 'Site Supervisor'
  });

  await logAuditAction({
    user,
    action: 'STOCK_ADJUSTED',
    entity: 'StockAdjustment',
    entityId: adj._id.toString(),
    metadata: {
      materialName: matDoc.name,
      previousStock,
      newStock,
      reason: payload.reason
    }
  });

  return {
    adjustment: JSON.parse(JSON.stringify(adj)),
    stock: JSON.parse(JSON.stringify(stockDoc))
  };
}

// Fast Lightweight Stock Metrics Fetch
export async function getStockMetricsOnly(projectId: string) {
  await connectMongoDB();
  if (!mongoose.isValidObjectId(projectId)) {
    return { lowStockCount: 0, outOfStockCount: 0, totalAttentionCount: 0 };
  }

  const matQuery: any = { status: 'ACTIVE' };
  const materials = await Material.find(matQuery).select('_id').lean().exec();

  const stockQuery: any = { projectId };
  const stocks = await MaterialStock.find(stockQuery).select('materialId currentStock').lean().exec();

  const stockMap = new Map<string, number>();
  stocks.forEach((s: any) => stockMap.set(s.materialId.toString(), s.currentStock || 0));

  let outOfStockCount = 0;

  materials.forEach((m: any) => {
    const currentStock = stockMap.get(m._id.toString()) || 0;
    if (currentStock <= 0) {
      outOfStockCount++;
    }
  });

  return {
    lowStockCount: 0,
    outOfStockCount,
    totalAttentionCount: outOfStockCount
  };
}

// Stock Overview Query
export async function getStockOverview(
  projectId: string,
  search?: string,
  filterStatus?: StockStatus | 'ALL',
  category?: string
) {
  await connectMongoDB();
  if (!mongoose.isValidObjectId(projectId)) {
    throw new Error('Invalid projectId.');
  }

  const matQuery: any = { status: 'ACTIVE' };
  if (category && category !== 'ALL') {
    matQuery.category = category;
  }
  const materials = await Material.find(matQuery).sort({ name: 1 }).exec();

  const stockQuery: any = { projectId };
  const stocks = await MaterialStock.find(stockQuery).exec();
  const stockMap = new Map<string, any>();
  stocks.forEach((s: any) => stockMap.set(s.materialId.toString(), s));

  const items = materials.map((m: any) => {
    const sDoc = stockMap.get(m._id.toString());
    const currentStock = sDoc ? sDoc.currentStock : 0;
    const status = calculateStockStatus(currentStock, m.minStockLevel || 0);

    return {
      materialId: m._id.toString(),
      name: m.name,
      category: m.category,
      unit: m.unit,
      minStockLevel: m.minStockLevel || 0,
      defaultRate: m.defaultRate || 0,
      currentStock,
      status
    };
  });

  return items.filter((item) => {
    const matchSearch =
      !search?.trim() ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || filterStatus === 'ALL' || item.status === filterStatus;
    return matchSearch && matchStatus;
  });
}

// Material Detail & Transaction History
export async function getMaterialDetail(projectId: string, materialId: string) {
  await connectMongoDB();
  if (!mongoose.isValidObjectId(projectId) || !mongoose.isValidObjectId(materialId)) {
    throw new Error('Invalid projectId or materialId.');
  }

  const matDoc = await (Material as any).findById(materialId).exec();
  if (!matDoc) throw new Error('Material not found.');

  const stockFilter: any = { projectId, materialId };
  const stockDoc = await (MaterialStock as any).findOne(stockFilter).exec();
  const currentStock = stockDoc ? stockDoc.currentStock : 0;
  const status = calculateStockStatus(currentStock, matDoc.minStockLevel || 0);

  // Fetch receipts for this material
  const inwardQuery: any = { projectId, 'items.materialId': materialId };
  const inwards = await MaterialInward.find(inwardQuery).sort({ date: -1 }).limit(25).exec();

  // Fetch issues for this material
  const issueQuery: any = { projectId, 'items.materialId': materialId };
  const issues = await MaterialIssue.find(issueQuery).sort({ date: -1 }).limit(25).exec();

  // Fetch adjustments
  const adjQuery: any = { projectId, materialId };
  const adjustments = await StockAdjustment.find(adjQuery).sort({ date: -1 }).limit(25).exec();

  // Combine into single sorted timeline
  const timeline: any[] = [];

  inwards.forEach((inw: any) => {
    const item = inw.items.find((i: any) => i.materialId.toString() === materialId);
    if (item) {
      timeline.push({
        id: inw._id.toString(),
        type: 'INWARD',
        date: inw.date,
        change: `+${item.quantity} ${item.unit}`,
        quantity: item.quantity,
        unit: item.unit,
        description: inw.vendorName ? `Received from ${inw.vendorName}` : 'Material Received',
        subtext: inw.invoiceNumber ? `Invoice: ${inw.invoiceNumber}` : undefined
      });
    }
  });

  issues.forEach((iss: any) => {
    const item = iss.items.find((i: any) => i.materialId.toString() === materialId);
    if (item) {
      timeline.push({
        id: iss._id.toString(),
        type: 'ISSUE',
        date: iss.date,
        change: `-${item.quantity} ${item.unit}`,
        quantity: item.quantity,
        unit: item.unit,
        description: iss.locationWorkArea ? `Issued to ${iss.locationWorkArea}` : 'Material Issued',
        subtext: iss.issuedTo ? `Issued to: ${iss.issuedTo}` : undefined
      });
    }
  });

  adjustments.forEach((adj: any) => {
    timeline.push({
      id: adj._id.toString(),
      type: 'ADJUSTMENT',
      date: adj.date,
      change: `${adj.adjustmentType === 'ADD' ? '+' : adj.adjustmentType === 'SUBTRACT' ? '-' : ''}${adj.quantity} ${adj.unit}`,
      quantity: adj.quantity,
      unit: adj.unit,
      description: `Stock Adjustment (${adj.adjustmentType}): ${adj.reason}`,
      subtext: `Stock set to ${adj.newStock}`
    });
  });

  timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    material: JSON.parse(JSON.stringify(matDoc)),
    currentStock,
    status,
    timeline
  };
}

// Low Stock Dashboard Metric Query
export async function getLowStockCount(projectId: string) {
  await connectMongoDB();
  if (!mongoose.isValidObjectId(projectId)) return { lowStockCount: 0, outOfStockCount: 0, totalAttentionCount: 0 };

  const stockQuery: any = { projectId };
  const stocks = await MaterialStock.find(stockQuery).exec();
  const matQuery: any = { status: 'ACTIVE' };
  const materials = await Material.find(matQuery).exec();
  const stockMap = new Map<string, number>();
  stocks.forEach((s: any) => stockMap.set(s.materialId.toString(), s.currentStock));

  let lowStockCount = 0;
  let outOfStockCount = 0;

  materials.forEach((m: any) => {
    const current = stockMap.get(m._id.toString()) || 0;
    const st = calculateStockStatus(current, m.minStockLevel || 0);
    if (st === 'OUT_OF_STOCK') outOfStockCount++;
    else if (st === 'LOW') lowStockCount++;
  });

  return {
    lowStockCount,
    outOfStockCount,
    totalAttentionCount: lowStockCount + outOfStockCount
  };
}

export async function deleteMaterialMaster(id: string, user?: string) {
  await connectMongoDB();
  const mat = await (Material as any).findById(id).exec();
  if (!mat) throw new Error('Material not found.');

  await (Material as any).findByIdAndDelete(id).exec();

  await logAuditAction({
    user,
    action: 'MATERIAL_DELETED',
    entity: 'Material',
    entityId: id,
    metadata: { name: mat.name }
  });

  return { ok: true, id };
}

export async function deleteMaterialInward(id: string, user?: string) {
  await connectMongoDB();
  const inward = await (MaterialInward as any).findById(id).exec();
  if (!inward) throw new Error('Material inward record not found.');

  await (MaterialInward as any).findByIdAndDelete(id).exec();

  await logAuditAction({
    user,
    action: 'MATERIAL_INWARD_DELETED',
    entity: 'MaterialInward',
    entityId: id,
    metadata: { date: inward.date, vendorName: inward.vendorName }
  });

  return { ok: true, id };
}

export async function deleteMaterialIssue(id: string, user?: string) {
  await connectMongoDB();
  const issue = await (MaterialIssue as any).findById(id).exec();
  if (!issue) throw new Error('Material issue record not found.');

  await (MaterialIssue as any).findByIdAndDelete(id).exec();

  await logAuditAction({
    user,
    action: 'MATERIAL_ISSUE_DELETED',
    entity: 'MaterialIssue',
    entityId: id,
    metadata: { date: issue.date, locationWorkArea: issue.locationWorkArea }
  });

  return { ok: true, id };
}

