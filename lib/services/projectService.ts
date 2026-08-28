import { connectMongoDB } from '../mongodb';
import { Project, IProject } from '../models/Project';
import { logAuditAction, getAuditLogs } from './auditService';
import { getAttendanceSummary } from './attendanceService';
import { getStockOverview } from './materialService';
import { getExpenseSummary } from './expenseService';
import { getProjectPaymentSummary, roundMoney } from './paymentService';
import { getDailyReportData } from './progressService';
import { isFeatureEnabled } from '../config/features';

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
  const showLabour = isFeatureEnabled('workers') || isFeatureEnabled('attendance');

  // Parallel domain query fetching
  const [
    attendanceRes,
    materialStockRes,
    paymentSummaryRes,
    expenseSummaryRes,
    progressReportRes,
    auditLogsRes
  ] = await Promise.all([
    showLabour ? getAttendanceSummary(projectId, todayStr).catch(() => null) : Promise.resolve(null),
    getStockOverview(projectId).catch(() => null),
    getProjectPaymentSummary(projectId).catch(() => null),
    getExpenseSummary(projectId).catch(() => null),
    getDailyReportData(projectId, todayStr).catch(() => null),
    getAuditLogs(undefined, undefined, 10, projectId).catch(() => [])
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
    const paymentMsg = showLabour
      ? `Total ₹${totalDue.toLocaleString('en-IN')} due (Labour: ₹${totalLabourDue.toLocaleString('en-IN')}, Vendor: ₹${totalVendorDue.toLocaleString('en-IN')})`
      : `Total ₹${totalDue.toLocaleString('en-IN')} due`;
    alerts.push({
      id: 'alt-payments',
      type: 'ALERT',
      title: 'Outstanding Payments Due',
      message: paymentMsg
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

  if (showLabour && absentCount > 0) {
    alerts.push({
      id: 'alt-absent',
      type: 'INFO',
      title: 'Worker Absence Alert',
      message: `${absentCount} worker(s) marked absent today.`
    });
  }

  // Recent Activity Feed - Project Specific & Meaningful Format
  let recentActivity: ProjectOverviewPayload['recentActivity'] = auditLogsRes.map((log: any) => formatAuditLogToActivity(log));

  // Fallback domain activity items if audit logs are empty/sparse for this project site
  if (recentActivity.length < 5) {
    const fallbackActivities: ProjectOverviewPayload['recentActivity'] = [];

    if (recentExpenses && recentExpenses.length > 0) {
      for (const exp of recentExpenses) {
        fallbackActivities.push({
          id: `exp-${exp._id}`,
          timestamp: exp.createdAt ? new Date(exp.createdAt) : new Date(exp.expenseDate || Date.now()),
          title: `Site Expense: ${exp.categoryName || 'Expense'} (₹${Number(exp.amount || 0).toLocaleString('en-IN')})${exp.remark ? ' - ' + exp.remark : ''}`,
          subtitle: `Paid via ${exp.paymentMethod || 'Cash'} • by ${exp.createdBy || 'Site Supervisor'}`,
          icon: '💸'
        });
      }
    }

    if (workItems && workItems.length > 0) {
      for (const item of workItems.slice(0, 3)) {
        fallbackActivities.push({
          id: `work-${item._id || Math.random()}`,
          timestamp: new Date(),
          title: `Work Update: ${item.description || item.workType || 'Site Task'} ${item.quantity ? `(${item.quantity} ${item.unit || ''})` : ''}`.trim(),
          subtitle: `Status: ${item.status || 'IN_PROGRESS'} • by Site Supervisor`,
          icon: '📋'
        });
      }
    }

    const existingIds = new Set(recentActivity.map((a) => a.id));
    for (const fb of fallbackActivities) {
      if (!existingIds.has(fb.id)) {
        recentActivity.push(fb);
      }
    }

    recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    recentActivity = recentActivity.slice(0, 8);
  }

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

export function formatAuditLogToActivity(log: any) {
  const m = log.metadata || {};
  const action = log.action || '';
  const user = log.user || 'Site Supervisor';
  const entity = log.entity || '';

  let title = action.replace(/_/g, ' ');
  let subtitle = `${entity} • by ${user}`;
  let icon = '📋';

  const fmtPayMethod = (pm?: string) => {
    if (!pm) return 'Cash/UPI';
    if (pm === 'UPI_ONLINE') return 'UPI Online';
    if (pm === 'BANK_TRANSFER') return 'Bank Transfer';
    if (pm === 'CASH') return 'Cash';
    if (pm === 'ADVANCE') return 'Advance';
    return pm;
  };

  if (action.includes('EXPENSE')) {
    icon = '💸';
    const amtStr = m.amount ? `₹${Number(m.amount).toLocaleString('en-IN')}` : '';
    const cat = m.categoryName || m.category || 'Expense';
    if (action === 'EXPENSE_CREATED') {
      const detail = m.remark || m.vendorPerson;
      title = `Added Expense: ${cat}${amtStr ? ' (' + amtStr + ')' : ''}${detail ? ' - ' + detail : ''}`;
      subtitle = `Paid via ${fmtPayMethod(m.paymentMethod)} • by ${user}`;
    } else if (action === 'EXPENSE_UPDATED') {
      title = `Updated Expense Record (${cat})`;
      subtitle = `Expense details modified • by ${user}`;
    } else if (action === 'EXPENSE_DELETED' || action === 'EXPENSE_VOIDED') {
      title = `Deleted Expense: ${cat} ${amtStr}`.trim();
      subtitle = `Expense record removed • by ${user}`;
    }
  } else if (action.includes('MATERIAL') || entity === 'Material') {
    icon = '📦';
    const qty = m.quantity || m.inwardQuantity || m.issueQuantity || '';
    const unit = m.unit || '';
    const matName = m.materialName || m.name || 'Material';
    const qtyStr = qty ? `${qty} ${unit}`.trim() : '';

    if (action === 'MATERIAL_INWARD' || action === 'STOCK_ADDED') {
      title = `Received Inward: ${qtyStr ? qtyStr + ' ' : ''}${matName}`;
      subtitle = `Vendor: ${m.vendorName || m.supplier || 'Supplier'} • by ${user}`;
    } else if (action === 'MATERIAL_ISSUED' || action === 'STOCK_ISSUED') {
      title = `Issued Material: ${qtyStr ? qtyStr + ' ' : ''}${matName}`;
      subtitle = `Issued to: ${m.issueTo || m.contractor || 'Site Operations'} • by ${user}`;
    } else if (action === 'MATERIAL_CREATED' || action === 'MATERIAL_ADDED') {
      title = `New Stock Cataloged: ${matName}`;
      subtitle = `Material catalog updated • by ${user}`;
    } else {
      title = `Material Stock Action: ${matName}`;
      subtitle = `Stock management • by ${user}`;
    }
  } else if (action.includes('PAYMENT') || entity === 'Payment') {
    icon = '💳';
    const amtStr = m.amount ? `₹${Number(m.amount).toLocaleString('en-IN')}` : '';
    const recipient = m.workerName || m.vendorName || m.recipientName || '';
    const payType = m.paymentType || action;

    if (payType.includes('LABOUR') || action.includes('LABOUR')) {
      title = `Paid Wage ${amtStr}${recipient ? ' to ' + recipient : ''}`;
      subtitle = `Labour wage settlement • by ${user}`;
    } else if (payType.includes('VENDOR') || action.includes('VENDOR')) {
      title = `Paid Vendor Settlement ${amtStr}${recipient ? ' to ' + recipient : ''}`;
      subtitle = `Vendor settlement • by ${user}`;
    } else if (action.includes('VOID')) {
      title = `Voided Payment ${amtStr}${recipient ? ' (' + recipient + ')' : ''}`;
      subtitle = `Payment status updated • by ${user}`;
    } else if (action.includes('ADVANCE')) {
      title = `Paid Advance ${amtStr}${recipient ? ' to ' + recipient : ''}`;
      subtitle = `Advance payment • by ${user}`;
    } else {
      title = `Processed Payment ${amtStr}${recipient ? ' for ' + recipient : ''}`;
      subtitle = `Site payment transaction • by ${user}`;
    }
  } else if (action.includes('PROGRESS') || action.includes('REPORT') || action.includes('ISSUE') || entity === 'DailyReport') {
    icon = '📋';
    if (action.includes('ISSUE')) {
      title = `Logged Site Issue: ${m.title || m.issueTitle || 'Work Bottleneck'}`;
      subtitle = `Severity: ${m.severity || 'Medium'} • by ${user}`;
    } else if (action.includes('WORK_ITEM')) {
      title = `Work Progress: ${m.itemTitle || m.title || 'Work Task'}`;
      subtitle = `Location: ${m.location || 'Site Work'} • by ${user}`;
    } else {
      title = `Site Diary & Work Progress Updated`;
      subtitle = `${m.workItemsCount || 0} work item(s) logged • by ${user}`;
    }
  } else if (action.includes('ATTENDANCE') || entity === 'Attendance') {
    icon = '👷';
    if (action.includes('SAVED') || action.includes('CREATED')) {
      title = `Marked Attendance (${m.presentCount || 0} Present, ${m.absentCount || 0} Absent)`;
      subtitle = `Date: ${m.date || 'Today'} • by ${user}`;
    } else if (action.includes('DELETED')) {
      title = `Attendance Cleared for ${m.date || 'Date'}`;
      subtitle = `Daily register reset • by ${user}`;
    } else {
      title = `Updated Daily Attendance Register`;
      subtitle = `Attendance log • by ${user}`;
    }
  } else if (action.includes('PROJECT') || entity === 'Project') {
    icon = '🏗️';
    if (action === 'PROJECT_CREATED') {
      title = `Project Site Created: ${m.name || ''} (${m.code || ''})`;
      subtitle = `Site configuration set • by ${user}`;
    } else if (action === 'PROJECT_UPDATED') {
      title = `Updated Site Details`;
      subtitle = `Project settings saved • by ${user}`;
    }
  } else if (action.includes('DOCUMENT') || entity === 'Document') {
    icon = '📁';
    title = `${action.includes('UPLOAD') ? 'Uploaded' : 'Removed'} Document: ${m.fileName || m.title || 'File'}`;
    subtitle = `Category: ${m.category || 'Site Doc'} • by ${user}`;
  }

  return {
    id: log._id ? log._id.toString() : `act-${Math.random()}`,
    timestamp: log.timestamp ? new Date(log.timestamp) : new Date(),
    title,
    subtitle,
    icon
  };
}
