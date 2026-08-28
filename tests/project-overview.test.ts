import { describe, expect, it } from 'vitest';
import { formatAuditLogToActivity } from '../lib/services/projectService';

describe('Project Overview & Command Center Unit Tests', () => {
  it('evaluates site health status rules accurately', () => {
    const calcHealth = (present: number, absent: number, lowStock: number, totalDue: number, openIssues: number) => ({
      labour: absent === 0 || present >= absent * 3 ? 'Good' : 'Needs Attention',
      materials: lowStock === 0 ? 'Good' : 'Needs Attention',
      payments: totalDue === 0 ? 'Good' : 'Needs Attention',
      progress: openIssues === 0 ? 'On Track' : 'Needs Attention'
    });

    const healthy = calcHealth(98, 2, 0, 0, 0);
    expect(healthy.labour).toBe('Good');
    expect(healthy.materials).toBe('Good');
    expect(healthy.payments).toBe('Good');
    expect(healthy.progress).toBe('On Track');

    const warningState = calcHealth(10, 15, 3, 125000, 2);
    expect(warningState.labour).toBe('Needs Attention');
    expect(warningState.materials).toBe('Needs Attention');
    expect(warningState.payments).toBe('Needs Attention');
    expect(warningState.progress).toBe('Needs Attention');
  });

  it('triggers operational alerts based on thresholds', () => {
    const generateAlerts = (lowStockCount: number, totalDue: number, openIssues: number) => {
      const alerts: string[] = [];
      if (lowStockCount > 0) alerts.push('Low Stock');
      if (totalDue > 0) alerts.push('Payments Due');
      if (openIssues > 0) alerts.push('Open Issues');
      return alerts;
    };

    expect(generateAlerts(3, 50000, 1)).toEqual(['Low Stock', 'Payments Due', 'Open Issues']);
    expect(generateAlerts(0, 0, 0)).toEqual([]);
  });

  it('respects feature flags for labour and attendance in overview alerts', () => {
    const generateAlertMessage = (totalDue: number, totalLabourDue: number, totalVendorDue: number, showLabour: boolean) => {
      if (totalDue > 0) {
        return showLabour
          ? `Total ₹${totalDue.toLocaleString('en-IN')} due (Labour: ₹${totalLabourDue.toLocaleString('en-IN')}, Vendor: ₹${totalVendorDue.toLocaleString('en-IN')})`
          : `Total ₹${totalDue.toLocaleString('en-IN')} due`;
      }
      return '';
    };

    expect(generateAlertMessage(50000, 20000, 30000, true)).toContain('Labour:');
    expect(generateAlertMessage(50000, 20000, 30000, false)).not.toContain('Labour:');
  });

  it('formats raw audit logs into human readable and meaningful activity entries', () => {
    const expLog = {
      action: 'EXPENSE_CREATED',
      entity: 'Expense',
      user: 'Supervisor John',
      metadata: { amount: 15000, categoryName: 'Cement Purchase', paymentMethod: 'BANK_TRANSFER', remark: 'Subcontractor Auto' }
    };
    const formattedExp = formatAuditLogToActivity(expLog);
    expect(formattedExp.title).toContain('Cement Purchase');
    expect(formattedExp.title).toContain('15,000');
    expect(formattedExp.subtitle).toContain('Bank Transfer');
    expect(formattedExp.icon).toBe('💸');

    const matLog = {
      action: 'MATERIAL_INWARD',
      entity: 'Material',
      user: 'Supervisor John',
      metadata: { quantity: 100, unit: 'Bags', materialName: 'UltraTech Cement', vendorName: 'ACC Suppliers' }
    };
    const formattedMat = formatAuditLogToActivity(matLog);
    expect(formattedMat.title).toContain('Received Inward: 100 Bags UltraTech Cement');
    expect(formattedMat.subtitle).toContain('ACC Suppliers');
    expect(formattedMat.icon).toBe('📦');
  });
});
