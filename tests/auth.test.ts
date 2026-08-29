import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../lib/auth/password';
import { createSessionToken, verifySessionToken } from '../lib/auth/session';

describe('Auth & Password Security Unit Tests', () => {
  it('hashes and verifies passwords correctly using scrypt', () => {
    const password = 'Admin@123Password!';
    const { hash, salt } = hashPassword(password);

    expect(hash).toBeDefined();
    expect(salt).toBeDefined();
    expect(hash.length).toBeGreaterThan(32);
    expect(salt.length).toBeGreaterThan(16);

    const isMatch = verifyPassword(password, hash, salt);
    expect(isMatch).toBe(true);

    const isWrong = verifyPassword('WrongPassword123', hash, salt);
    expect(isWrong).toBe(false);
  });

  it('generates and verifies signed session tokens securely', () => {
    const payload = {
      userId: 'usr-12345',
      email: 'admin@civilworks.com',
      name: 'System Admin',
      role: 'ADMIN',
      assignedProjectIds: ['proj-1', 'proj-2']
    };

    const token = createSessionToken(payload, 24);
    expect(token).toBeDefined();
    expect(token).toContain('.');

    const verified = verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe(payload.userId);
    expect(verified?.email).toBe(payload.email);
    expect(verified?.role).toBe('ADMIN');
    expect(verified?.assignedProjectIds).toEqual(['proj-1', 'proj-2']);
  });

  it('rejects tampered session tokens', () => {
    const payload = {
      userId: 'usr-12345',
      email: 'admin@civilworks.com',
      name: 'System Admin',
      role: 'ADMIN',
      assignedProjectIds: []
    };

    const token = createSessionToken(payload, 24);
    const [header, sig] = token.split('.');

    const tamperedSigToken = `${header}.tampered_signature_12345`;
    expect(verifySessionToken(tamperedSigToken)).toBeNull();
  });
});
