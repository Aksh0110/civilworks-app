import { describe, expect, it } from 'vitest';

describe('Audit Supervision & User Monitoring Unit Tests', () => {
  const mockAuditLogs = [
    {
      _id: '1',
      user: 'Ramesh Kumar',
      action: 'USER_LOGIN_SUCCESS',
      entity: 'User',
      projectId: 'proj-1',
      metadata: { role: 'SUPERVISOR' }
    },
    {
      _id: '2',
      user: 'Ramesh Kumar',
      action: 'EXPENSE_CREATED',
      entity: 'Expense',
      projectId: 'proj-1',
      metadata: { amount: 15000, categoryName: 'Cement Purchase' }
    },
    {
      _id: '3',
      user: 'System Admin',
      action: 'USER_CREATED',
      entity: 'User',
      projectId: null,
      metadata: { name: 'Suresh', email: 'suresh@civilworks.com', role: 'SUPERVISOR' }
    }
  ];

  it('filters audit logs by specific user and category', () => {
    const filterLogs = (logs: typeof mockAuditLogs, userFilter?: string, categoryFilter?: string) => {
      return logs.filter((log) => {
        if (userFilter && userFilter !== 'ALL' && log.user !== userFilter) return false;
        if (categoryFilter === 'LOGINS' && !log.action.includes('LOGIN')) return false;
        if (categoryFilter === 'FINANCIAL' && !log.action.includes('EXPENSE')) return false;
        if (categoryFilter === 'USER_ADMIN' && !log.action.includes('USER_CREATED')) return false;
        return true;
      });
    };

    const rameshExpenses = filterLogs(mockAuditLogs, 'Ramesh Kumar', 'FINANCIAL');
    expect(rameshExpenses).toHaveLength(1);
    expect(rameshExpenses[0].metadata?.categoryName).toBe('Cement Purchase');

    const adminActions = filterLogs(mockAuditLogs, 'System Admin', 'USER_ADMIN');
    expect(adminActions).toHaveLength(1);
    expect(adminActions[0].user).toBe('System Admin');
  });

  it('calculates audit monitoring summary metrics correctly', () => {
    const totalActions = mockAuditLogs.length;
    const loginsCount = mockAuditLogs.filter((l) => l.action.includes('LOGIN')).length;
    const uniqueUsers = Array.from(new Set(mockAuditLogs.map((l) => l.user)));

    expect(totalActions).toBe(3);
    expect(loginsCount).toBe(1);
    expect(uniqueUsers).toEqual(['Ramesh Kumar', 'System Admin']);
  });
});
