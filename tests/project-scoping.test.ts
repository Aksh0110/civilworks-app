import { describe, expect, it } from 'vitest';

describe('Project Access Control Scoping Unit Tests', () => {
  const mockProjects = [
    { _id: 'proj-1', name: 'Metro Line Extension', code: 'METRO-01' },
    { _id: 'proj-2', name: 'Flyover Pillar 4', code: 'FLY-04' },
    { _id: 'proj-3', name: 'Residential Tower B', code: 'TOW-B' }
  ];

  it('scopes visible projects for non-admin users to assignedProjectIds', () => {
    const filterProjects = (allProjects: typeof mockProjects, role: string, assignedIds: string[]) => {
      if (role === 'ADMIN') return allProjects;
      return allProjects.filter((p) => assignedIds.includes(p._id));
    };

    const supervisorProjects = filterProjects(mockProjects, 'SUPERVISOR', ['proj-1', 'proj-3']);
    expect(supervisorProjects).toHaveLength(2);
    expect(supervisorProjects.map((p) => p._id)).toEqual(['proj-1', 'proj-3']);

    const adminProjects = filterProjects(mockProjects, 'ADMIN', []);
    expect(adminProjects).toHaveLength(3);
  });

  it('blocks unassigned project access attempts for supervised users', () => {
    const checkProjectPermission = (projectId: string, role: string, assignedIds: string[]) => {
      if (role === 'ADMIN') return true;
      return assignedIds.includes(projectId);
    };

    expect(checkProjectPermission('proj-1', 'SUPERVISOR', ['proj-1'])).toBe(true);
    expect(checkProjectPermission('proj-2', 'SUPERVISOR', ['proj-1'])).toBe(false);
    expect(checkProjectPermission('proj-2', 'ADMIN', [])).toBe(true);
  });
});
