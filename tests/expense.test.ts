import { describe, it, expect } from 'vitest';

describe('Expense Management Domain & Validation Rules', () => {
  it('should validate positive expense amounts and round money correctly', () => {
    const validateAmount = (amt: number) => {
      if (isNaN(amt) || amt <= 0) {
        throw new Error('Expense amount must be a positive number greater than 0.');
      }
      return Math.round(amt * 100) / 100;
    };

    expect(validateAmount(450.5)).toBe(450.5);
    expect(validateAmount(1200)).toBe(1200);
    expect(validateAmount(99.999)).toBe(100);
    expect(() => validateAmount(0)).toThrow(/Expense amount must be a positive number/);
    expect(() => validateAmount(-50)).toThrow(/Expense amount must be a positive number/);
  });

  it('should calculate category and payment method aggregations correctly', () => {
    const mockExpenses = [
      { amount: 500, categoryName: 'Fuel / Diesel', paymentMethod: 'UPI_ONLINE', status: 'ACTIVE' },
      { amount: 1500, categoryName: 'Fuel / Diesel', paymentMethod: 'CASH', status: 'ACTIVE' },
      { amount: 200, categoryName: 'Tea / Food', paymentMethod: 'CASH', status: 'ACTIVE' },
      { amount: 800, categoryName: 'Transport / Vehicle', paymentMethod: 'BANK_TRANSFER', status: 'ACTIVE' },
      { amount: 1000, categoryName: 'Tools / Hardware', paymentMethod: 'CASH', status: 'VOIDED' } // Should be excluded!
    ];

    const activeExpenses = mockExpenses.filter((e) => e.status === 'ACTIVE');

    let totalActiveAmount = 0;
    const catMap = new Map<string, number>();
    const pmMap = new Map<string, number>();

    activeExpenses.forEach((e) => {
      totalActiveAmount += e.amount;
      catMap.set(e.categoryName, (catMap.get(e.categoryName) || 0) + e.amount);
      pmMap.set(e.paymentMethod, (pmMap.get(e.paymentMethod) || 0) + e.amount);
    });

    expect(totalActiveAmount).toBe(3000); // 500 + 1500 + 200 + 800
    expect(catMap.get('Fuel / Diesel')).toBe(2000);
    expect(catMap.get('Tea / Food')).toBe(200);
    expect(catMap.get('Transport / Vehicle')).toBe(800);
    expect(catMap.get('Tools / Hardware')).toBeUndefined(); // Voided item excluded!

    expect(pmMap.get('CASH')).toBe(1700); // 1500 + 200
    expect(pmMap.get('UPI_ONLINE')).toBe(500);
    expect(pmMap.get('BANK_TRANSFER')).toBe(800);
  });

  it('should enforce controlled void mechanics without hard-deleting records', () => {
    const expense = {
      _id: 'exp-123',
      amount: 1200,
      categoryName: 'Transport / Vehicle',
      status: 'ACTIVE' as 'ACTIVE' | 'VOIDED',
      voidReason: undefined as string | undefined
    };

    const voidRecord = (exp: typeof expense, reason: string) => {
      if (!reason?.trim()) throw new Error('Reason required');
      exp.status = 'VOIDED';
      exp.voidReason = reason.trim();
      return exp;
    };

    const voided = voidRecord(expense, 'Entered wrong amount by mistake');
    expect(voided.status).toBe('VOIDED');
    expect(voided.voidReason).toBe('Entered wrong amount by mistake');
  });

  it('should enforce anti-duplicate rule distinguishing operational expenses from material procurement', () => {
    const isMaterialProcurementExpense = (categoryName: string, remark?: string) => {
      const lowerCat = categoryName.toLowerCase();
      const lowerRemark = remark ? remark.toLowerCase() : '';
      if (
        lowerCat.includes('cement') ||
        lowerCat.includes('steel') ||
        lowerCat.includes('bricks') ||
        lowerRemark.includes('material delivery')
      ) {
        return true;
      }
      return false;
    };

    expect(isMaterialProcurementExpense('Cement Purchase')).toBe(true);
    expect(isMaterialProcurementExpense('Fuel / Diesel', 'Material delivery receipt')).toBe(true);
    expect(isMaterialProcurementExpense('Fuel / Diesel', 'Diesel for site tractor')).toBe(false);
    expect(isMaterialProcurementExpense('Tea / Food', 'Tea for site workers')).toBe(false);
  });
});
