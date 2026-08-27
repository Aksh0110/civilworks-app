import { describe, expect, it } from 'vitest';
import { normalizeDate, dateQueryRange } from '../lib/services/attendanceService';

describe('Attendance Date Utilities', () => {
  it('normalizes YYYY-MM-DD date string to UTC midnight Date', () => {
    const d = normalizeDate('2026-08-26');
    expect(d.getUTCFullYear()).toBe(2026);
    expect(d.getUTCMonth()).toBe(7); // 0-indexed, August is 7
    expect(d.getUTCDate()).toBe(26);
  });

  it('creates query range spanning exactly 24 hours UTC', () => {
    const range = dateQueryRange('2026-08-26');
    const start = range.$gte;
    const end = range.$lt;

    expect(start.toISOString()).toBe('2026-08-26T00:00:00.000Z');
    expect(end.toISOString()).toBe('2026-08-27T00:00:00.000Z');
  });
});
