import { describe, it, expect } from 'vitest';

describe('Daily Progress Domain & Validation Rules', () => {
  it('should validate work item quantities and status values', () => {
    const validateWorkItem = (item: { quantity: number; status: string }) => {
      if (isNaN(item.quantity) || item.quantity <= 0) {
        throw new Error('Work item quantity must be greater than 0.');
      }
      const validStatuses = ['COMPLETED', 'IN_PROGRESS', 'PENDING'];
      if (!validStatuses.includes(item.status)) {
        throw new Error(`Invalid status: ${item.status}`);
      }
      return true;
    };

    expect(validateWorkItem({ quantity: 420, status: 'COMPLETED' })).toBe(true);
    expect(validateWorkItem({ quantity: 60, status: 'IN_PROGRESS' })).toBe(true);
    expect(() => validateWorkItem({ quantity: 0, status: 'COMPLETED' })).toThrow(/quantity must be greater than 0/);
    expect(() => validateWorkItem({ quantity: 50, status: 'UNKNOWN' })).toThrow(/Invalid status/);
  });

  it('should enforce same-project restriction when copying yesterday progress', () => {
    const mockYesterdayProgress = [
      { projectId: 'proj-A', date: '2026-08-25', workItems: [{ workTypeName: 'Brickwork', quantity: 420, unit: 'Sq.ft', status: 'COMPLETED' }] },
      { projectId: 'proj-B', date: '2026-08-25', workItems: [{ workTypeName: 'Excavation', quantity: 100, unit: 'Cu.m', status: 'COMPLETED' }] }
    ];

    const copyYesterday = (targetProjectId: string) => {
      const found = mockYesterdayProgress.find((p) => p.projectId === targetProjectId);
      if (!found) return [];
      return found.workItems.map((i) => ({ ...i })); // Copied draft
    };

    const projADraft = copyYesterday('proj-A');
    expect(projADraft.length).toBe(1);
    expect(projADraft[0].workTypeName).toBe('Brickwork');

    const projCDraft = copyYesterday('proj-C');
    expect(projCDraft.length).toBe(0);
  });

  it('should calculate daily progress counts and status summaries correctly', () => {
    const mockItems = [
      { workTypeName: 'Brickwork', quantity: 420, unit: 'Sq.ft', status: 'COMPLETED' },
      { workTypeName: 'Slab Shuttering', quantity: 1, unit: 'Floor', status: 'IN_PROGRESS' },
      { workTypeName: 'Electrical Conduit', quantity: 60, unit: 'm', status: 'IN_PROGRESS' },
      { workTypeName: 'Plaster', quantity: 300, unit: 'Sq.ft', status: 'PENDING' }
    ];

    const totalWorkItems = mockItems.length;
    const completedCount = mockItems.filter((i) => i.status === 'COMPLETED').length;
    const inProgressCount = mockItems.filter((i) => i.status === 'IN_PROGRESS').length;
    const pendingCount = mockItems.filter((i) => i.status === 'PENDING').length;

    expect(totalWorkItems).toBe(4);
    expect(completedCount).toBe(1);
    expect(inProgressCount).toBe(2);
    expect(pendingCount).toBe(1);
  });

  it('should validate issue severities and non-empty descriptions', () => {
    const validateIssue = (issue: { issueType: string; severity: string; description: string }) => {
      if (!issue.issueType?.trim() || !issue.description?.trim()) {
        throw new Error('Issue type and description required');
      }
      const validSeverities = ['HIGH', 'MEDIUM', 'LOW'];
      if (!validSeverities.includes(issue.severity)) {
        throw new Error(`Invalid severity: ${issue.severity}`);
      }
      return true;
    };

    expect(validateIssue({ issueType: 'Material Delay', severity: 'HIGH', description: 'Cement truck delayed by 4 hours' })).toBe(true);
    expect(() => validateIssue({ issueType: 'Weather', severity: 'CRITICAL', description: 'Heavy rain' })).toThrow(/Invalid severity/);
  });

  it('should preserve immutable historical snapshots for work types and units', () => {
    const createWorkItemSnapshot = (workTypeMaster: { name: string; defaultUnit: string; icon: string }, qty: number, customUnit?: string) => {
      return {
        workTypeName: workTypeMaster.name, // Snapshot
        workTypeIcon: workTypeMaster.icon, // Snapshot
        unit: customUnit || workTypeMaster.defaultUnit, // Snapshot
        quantity: qty
      };
    };

    const master = { name: 'Brickwork', defaultUnit: 'Sq.ft', icon: '🧱' };
    const snapshot = createWorkItemSnapshot(master, 420);

    // If master changes later
    master.name = 'Red Clay Brickwork';
    master.defaultUnit = 'Sqm';

    // Historical record remains unchanged
    expect(snapshot.workTypeName).toBe('Brickwork');
    expect(snapshot.unit).toBe('Sq.ft');
  });
});
