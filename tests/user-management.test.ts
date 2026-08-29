import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../lib/auth/password';

describe('User Management & Project Assignment Unit Tests', () => {
  it('validates user role and status assignment rules', () => {
    const formatUserData = (name: string, email: string, role: string, assignedProjects: string[], status = 'ACTIVE') => ({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      assignedProjectIds: role === 'ADMIN' ? [] : assignedProjects,
      status
    });

    const supervisor = formatUserData('Ramesh Supervisor', 'RAMESH@CIVILWORKS.COM', 'SUPERVISOR', ['proj-1', 'proj-2']);
    expect(supervisor.email).toBe('ramesh@civilworks.com');
    expect(supervisor.assignedProjectIds).toEqual(['proj-1', 'proj-2']);
    expect(supervisor.status).toBe('ACTIVE');

    const adminUser = formatUserData('System Admin', 'ADMIN@CIVILWORKS.COM', 'ADMIN', ['proj-1']);
    expect(adminUser.assignedProjectIds).toEqual([]); // Admin gets global access
  });

  it('handles user status deactivation and reactivation state changes', () => {
    const toggleStatus = (currentStatus: string) => (currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE');

    expect(toggleStatus('ACTIVE')).toBe('INACTIVE');
    expect(toggleStatus('INACTIVE')).toBe('ACTIVE');
  });

  it('validates password reset hashing logic during user edit', () => {
    const newPass = 'SuperNewPass@2026';
    const { hash, salt } = hashPassword(newPass);

    expect(verifyPassword(newPass, hash, salt)).toBe(true);
    expect(verifyPassword('WrongOldPass', hash, salt)).toBe(false);
  });
});
