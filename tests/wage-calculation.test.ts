import { describe, expect, it } from 'vitest';
import { calculateWorkedDays, calculateWorkerWage, calculateWageSummary } from '../lib/services/wageService';

describe('Wage Calculation Service Unit Tests', () => {
  it('calculates worked days correctly for each attendance status', () => {
    expect(calculateWorkedDays('PRESENT')).toBe(1.0);
    expect(calculateWorkedDays('HALF_DAY')).toBe(0.5);
    expect(calculateWorkedDays('ABSENT')).toBe(0.0);
  });

  it('calculates worker wage accurately based on daily rate and status', () => {
    const dailyRate = 900;
    expect(calculateWorkerWage(dailyRate, 'PRESENT')).toBe(900);
    expect(calculateWorkerWage(dailyRate, 'HALF_DAY')).toBe(450);
    expect(calculateWorkerWage(dailyRate, 'ABSENT')).toBe(0);
  });

  it('handles zero or negative daily rate gracefully', () => {
    expect(calculateWorkerWage(0, 'PRESENT')).toBe(0);
    expect(calculateWorkerWage(-500, 'PRESENT')).toBe(0);
  });

  it('calculates full project daily wage summary correctly', () => {
    const records = [
      { workerId: 'w1', dailyRate: 900, status: 'PRESENT' as const },
      { workerId: 'w2', dailyRate: 900, status: 'PRESENT' as const },
      { workerId: 'w3', dailyRate: 650, status: 'HALF_DAY' as const },
      { workerId: 'w4', dailyRate: 1100, status: 'ABSENT' as const }
    ];

    const summary = calculateWageSummary(records);

    expect(summary.totalWorkers).toBe(4);
    expect(summary.presentCount).toBe(2);
    expect(summary.halfDayCount).toBe(1);
    expect(summary.absentCount).toBe(1);

    // Expected wage: 900 + 900 + 325 + 0 = 2125
    expect(summary.totalWageCost).toBe(2125);
  });
});
