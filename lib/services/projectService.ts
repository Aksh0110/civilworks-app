import { connectMongoDB } from '../mongodb';
import { Project, IProject } from '../models/Project';
import { logAuditAction, getAuditLogs } from './auditService';
import { getAttendanceSummary } from './attendanceService';
import { getStockOverview } from './materialService';
import { getExpenseSummary } from './expenseService';
import { getProjectPaymentSummary, roundMoney } from './paymentService';
import { getDailyReportData } from './progressService';

export async function getProjects(status?: string) {
  await connectMongoDB();
  const filter: any = {};
  if (status) {
    filter.status = status;
  }
  const projects = await Project.find(filter).sort({ createdAt: -1 }).exec();
  return JSON.parse(JSON.stringify(projects));
}

export async function getProjectById(id: string) {
  await connectMongoDB();
  const project = await (Project as any).findById(id).exec();
  return project ? JSON.parse(JSON.stringify(project)) : null;
}

export async function createProject(data: Partial<IProject>, user?: string) {
  await connectMongoDB();
  if (!data.name || !data.code) {
    throw new Error('Project name and code are required.');
  }

  const query: any = { code: data.code.trim().toUpperCase() };
  const existing = await Project.findOne(query).exec();
  if (existing) {
    throw new Error(`Project with code ${data.code} already exists.`);
  }

  const project = await Project.create({
    name: data.name.trim(),
    code: data.code.trim().toUpperCase(),
    location: data.location?.trim(),
    status: data.status || 'ACTIVE',
    startDate: data.startDate ? new Date(data.startDate) : new Date(),
    expectedEndDate: data.expectedEndDate ? new Date(data.expectedEndDate) : undefined,
    siteContact: data.siteContact?.trim(),
    managerName: data.managerName?.trim(),
    notes: data.notes?.trim()
  });

  await logAuditAction({
    user,
    action: 'PROJECT_CREATED',
    entity: 'Project',
    entityId: project._id.toString(),
    metadata: { name: project.name, code: project.code }
  });

  return JSON.parse(JSON.stringify(project));
}

export async function updateProject(id: string, data: Partial<IProject>, user?: string) {
  await connectMongoDB();
  const project = await (Project as any).findById(id).exec();
  if (!project) {
    throw new Error('Project not found.');
  }

  if (data.name) project.name = data.name.trim();
  if (data.location !== undefined) project.location = data.location.trim();
  if (data.status) project.status = data.status;
  if (data.startDate) project.startDate = new Date(data.startDate);
  if (data.expectedEndDate !== undefined) {
    project.expectedEndDate = data.expectedEndDate ? new Date(data.expectedEndDate) : undefined;
  }
  if (data.siteContact !== undefined) project.siteContact = data.siteContact.trim();
  if (data.managerName !== undefined) project.managerName = data.managerName.trim();
  if (data.notes !== undefined) project.notes = data.notes.trim();

  await project.save();

  await logAuditAction({
    user,
    action: 'PROJECT_UPDATED',
    entity: 'Project',
    entityId: project._id.toString(),
    metadata: { updates: data }
  });

  return JSON.parse(JSON.stringify(project));
}

export async function deleteProject(id: string, user?: string) {
  await connectMongoDB();
  const project = await (Project as any).findById(id).exec();
  if (!project) {
    throw new Error('Project not found.');
  }

  await (Project as any).findByIdAndDelete(id).exec();

  await logAuditAction({
    user,
    action: 'PROJECT_DELETED',
    entity: 'Project',
    entityId: id,
    metadata: { name: project.name, code: project.code }
  });

  return { ok: true, id };
}


// ----------------------------------------------------
// MILESTONE 7: AGGREGATED COMMAND CENTER OVERVIEW
// ----------------------------------------------------

export interface ProjectOverviewPayload {
  project: any;
  labour: {
    presentCount: number;
    halfDayCount: number;
    absentCount: number;
    todayCost: number;
  };
  materials: {
    totalItems: number;
    lowStockCount: number;
    lowStockItems: any[];
  };
  payments: {
    todayPaidLabour: number;
    todayPaidVendor: number;
    totalLabourDue: number;
    totalVendorDue: number;
    totalDue: number;
  };
  expenses: {
    todayExpenses: number;
    monthExpenses: number;
    recentExpenses: any[];
  };
  progress: {
    completedCount: number;
    inProgressCount: number;
    pendingCount: number;
    openIssuesCount: number;
    photosCount: number;
    workItems: any[];
  };
  siteHealth: {
    labour: 'Good' | 'Needs Attention';
    materials: 'Good' | 'Needs Attention';
    payments: 'Good' | 'Needs Attention';
    progress: 'On Track' | 'Needs Attention';
  };
  alerts: Array<{ id: string; type: 'WARNING' | 'INFO' | 'ALERT'; title: string; message: string }>;
  recentActivity: Array<{ id: string; timestamp: Date; title: string; subtitle: string; icon: string }>;
}

export async function getProjectOverview(projectId: string): Promise<ProjectOverviewPayload> {
  await connectMongoDB();

  const project = await getProjectById(projectId);
  if (!project) throw new Error('Project not found');

  const todayStr = new Date().toISOString().split('T')[0];

  // Parallel domain query fetching
  const [
    attendanceRes,
    materialStockRes,
    paymentSummaryRes,
    expenseSummaryRes,
    progressReportRes,
    auditLogsRes
  ] = await Promise.all([
    getAttendanceSummary(projectId, todayStr).catch(() => null),
    getStockOverview(projectId).catch(() => null),
    getProjectPaymentSummary(projectId).catch(() => null),
    getExpenseSummary(projectId).catch(() => null),
    getDailyReportData(projectId, todayStr).catch(() => null),
    getAuditLogs(undefined, undefined, 8).catch(() => [])
  ]);

  // Labour calculation
  const presentCount = attendanceRes?.presentCount || 0;
  const halfDayCount = attendanceRes?.halfDayCount || 0;
  const absentCount = attendanceRes?.absentCount || 0;
  const todayCost = attendanceRes?.totalWage || 0;

  // Material calculation
  const stockList = Array.isArray(materialStockRes?.materials) ? materialStockRes.materials : [];
  const lowStockItems = stockList.filter((m: any) => (m.availableQuantity || 0) <= (m.minStockLevel || 0));
  const lowStockCount = lowStockItems.length;

  // Payments calculation
  const todayPaidLabour = paymentSummaryRes?.todayPaidLabour || 0;
  const todayPaidVendor = paymentSummaryRes?.todayPaidVendor || 0;
  const totalLabourDue = paymentSummaryRes?.totalLabourDue || 0;
  const totalVendorDue = paymentSummaryRes?.totalVendorDue || 0;
  const totalDue = roundMoney(totalLabourDue + totalVendorDue);

  // Expenses calculation
  const todayExpenses = expenseSummaryRes?.todayTotal || 0;
  const monthExpenses = expenseSummaryRes?.monthTotal || 0;
  const recentExpenses = expenseSummaryRes?.recentExpenses || [];

  // Progress calculation
  const workItems = progressReportRes?.dailyReport?.workItems || [];
  const completedCount = workItems.filter((w: any) => w.status === 'COMPLETED').length;
  const inProgressCount = workItems.filter((w: any) => w.status === 'IN_PROGRESS').length;
  const pendingCount = workItems.filter((w: any) => w.status === 'PENDING').length;

  const openIssuesList = progressReportRes?.dailyReport?.openIssues || [];
  const openIssuesCount = Array.isArray(openIssuesList) ? openIssuesList.length : 0;
  const photosCount = progressReportRes?.dailyReport?.photoUrls?.length || 0;

  // Site Health Rules
  const siteHealth = {
    labour: (absentCount === 0 || presentCount >= absentCount * 3 ? 'Good' : 'Needs Attention') as 'Good' | 'Needs Attention',
    materials: (lowStockCount === 0 ? 'Good' : 'Needs Attention') as 'Good' | 'Needs Attention',
    payments: (totalDue === 0 ? 'Good' : 'Needs Attention') as 'Good' | 'Needs Attention',
    progress: (openIssuesCount === 0 ? 'On Track' : 'Needs Attention') as 'On Track' | 'Needs Attention'
  };

  // Operational Alerts Engine
  const alerts: ProjectOverviewPayload['alerts'] = [];

  if (lowStockCount > 0) {
    alerts.push({
      id: 'alt-stock',
      type: 'WARNING',
      title: 'Low Material Stock Alert',
      message: `${lowStockCount} item(s) below minimum stock level (${lowStockItems.map((i: any) => i.name || i.materialName).join(', ')})`
    });
  }

  if (totalDue > 0) {
    alerts.push({
      id: 'alt-payments',
      type: 'ALERT',
      title: 'Outstanding Payments Due',
      message: `Total ₹${totalDue.toLocaleString('en-IN')} due (Labour: ₹${totalLabourDue.toLocaleString('en-IN')}, Vendor: ₹${totalVendorDue.toLocaleString('en-IN')})`
    });
  }

  if (openIssuesCount > 0) {
    alerts.push({
      id: 'alt-issues',
      type: 'WARNING',
      title: 'Open Work Site Issues',
      message: `${openIssuesCount} active issue(s) reported on site today.`
    });
  }

  if (absentCount > 0) {
    alerts.push({
      id: 'alt-absent',
      type: 'INFO',
      title: 'Worker Absence Alert',
      message: `${absentCount} worker(s) marked absent today.`
    });
  }

  // Recent Activity Feed
  const recentActivity: ProjectOverviewPayload['recentActivity'] = auditLogsRes.map((log: any, idx: number) => ({
    id: log._id ? log._id.toString() : `act-${idx}`,
    timestamp: log.timestamp ? new Date(log.timestamp) : new Date(),
    title: log.action.replace(/_/g, ' '),
    subtitle: `${log.entity} • by ${log.user}`,
    icon: log.action.includes('MATERIAL') ? '📦' : log.action.includes('PAYMENT') ? '💳' : log.action.includes('EXPENSE') ? '💸' : '📋'
  }));

  return {
    project,
    labour: { presentCount, halfDayCount, absentCount, todayCost },
    materials: { totalItems: stockList.length, lowStockCount, lowStockItems },
    payments: { todayPaidLabour, todayPaidVendor, totalLabourDue, totalVendorDue, totalDue },
    expenses: { todayExpenses, monthExpenses, recentExpenses },
    progress: { completedCount, inProgressCount, pendingCount, openIssuesCount, photosCount, workItems },
    siteHealth,
    alerts,
    recentActivity
  };
}

export async function getProjectsOverviewList(statusTab?: string) {
  await connectMongoDB();

  const query: any = {};
  if (statusTab && statusTab !== 'ALL') {
    query.status = statusTab;
  }

  const projects = await Project.find(query).sort({ name: 1 }).lean();
  const todayStr = new Date().toISOString().split('T')[0];

  const results = await Promise.all(
    projects.map(async (p: any) => {
      const pId = p._id.toString();

      const [attendanceRes, paymentRes, expenseRes, materialRes] = await Promise.all([
        getAttendanceSummary(pId, todayStr).catch(() => null),
        getProjectPaymentSummary(pId).catch(() => null),
        getExpenseSummary(pId).catch(() => null),
        getStockOverview(pId).catch(() => null)
      ]);

      const presentWorkers = attendanceRes?.presentCount || 0;
      const todayExpense = expenseRes?.todayTotal || 0;
      const totalDue = roundMoney((paymentRes?.totalLabourDue || 0) + (paymentRes?.totalVendorDue || 0));

      const stockList = Array.isArray(materialRes?.materials) ? materialRes.materials : [];
      const lowStockCount = stockList.filter((m: any) => (m.availableQuantity || 0) <= (m.minStockLevel || 0)).length;

      return {
        _id: pId,
        name: p.name,
        code: p.code,
        location: p.location,
        status: p.status,
        startDate: p.startDate,
        presentWorkers,
        todayExpense,
        totalDue,
        lowStockCount
      };
    })
  );

  return results;
}
