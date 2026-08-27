import { describe, expect, it } from 'vitest';

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
});
