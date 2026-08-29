import { describe, expect, it } from 'vitest';

describe('User Profile & Activity View Unit Tests', () => {
  const mockUserLogs = [
    {
      _id: '1',
      user: 'Ramesh Kumar',
      action: 'USER_LOGIN_SUCCESS',
      entity: 'User',
      timestamp: '2026-08-28T10:00:00Z',
      metadata: { role: 'SUPERVISOR' }
    },
    {
      _id: '2',
      user: 'Ramesh Kumar',
      action: 'EXPENSE_CREATED',
      entity: 'Expense',
      timestamp: '2026-08-28T11:30:00Z',
      metadata: { amount: 12000, categoryName: 'Cement Purchase' }
    },
    {
      _id: '3',
      user: 'Ramesh Kumar',
      action: 'WORK_PROGRESS_UPDATED',
      entity: 'WorkReport',
      timestamp: '2026-08-28T14:15:00Z',
      metadata: { itemsCount: 3 }
    }
  ];

  it('filters user activities by category tab correctly', () => {
    const filterUserActivities = (logs: typeof mockUserLogs, tab: string) => {
      return logs.filter((log) => {
        if (tab === 'ALL') return true;
        if (tab === 'FINANCIAL') return log.action.includes('EXPENSE') || log.action.includes('PAYMENT');
        if (tab === 'PROGRESS_STOCK') return log.action.includes('WORK') || log.action.includes('STOCK');
        if (tab === 'LOGINS') return log.action.includes('LOGIN');
        return true;
      });
    };

    const expenses = filterUserActivities(mockUserLogs, 'FINANCIAL');
    expect(expenses).toHaveLength(1);
    expect(expenses[0].metadata?.amount).toBe(12000);

    const progress = filterUserActivities(mockUserLogs, 'PROGRESS_STOCK');
    expect(progress).toHaveLength(1);
    expect(progress[0].action).toBe('WORK_PROGRESS_UPDATED');
  });

  it('calculates user activity summary metrics correctly', () => {
    let totalExpenseAmount = 0;
    let expenseCount = 0;
    let progressCount = 0;

    for (const log of mockUserLogs) {
      if (log.action === 'EXPENSE_CREATED') {
        expenseCount++;
        totalExpenseAmount += log.metadata?.amount || 0;
      } else if (log.action === 'WORK_PROGRESS_UPDATED') {
        progressCount++;
      }
    }

    expect(expenseCount).toBe(1);
    expect(totalExpenseAmount).toBe(12000);
    expect(progressCount).toBe(1);
  });
});
