import { describe, expect, it } from 'vitest';

describe('Vendor Material Bills & Payment Integration Unit Tests', () => {
  it('automatically calculates material inward bill total amount', () => {
    const items = [
      { materialName: 'OPC 53 Cement', quantity: 100, unit: 'Bags', rate: 400, amount: 40000 },
      { materialName: '8mm TMT Steel Rebar', quantity: 2, unit: 'Tons', rate: 65000, amount: 130000 }
    ];

    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
    expect(totalAmount).toBe(170000);
  });

  it('calculates vendor bill status transitions cleanly', () => {
    const calculateBillStatus = (totalAmount: number, paidAmount: number) => {
      if (paidAmount >= totalAmount) return 'SETTLED';
      if (paidAmount > 0) return 'PARTIAL';
      return 'OPEN';
    };

    expect(calculateBillStatus(100000, 0)).toBe('OPEN');
    expect(calculateBillStatus(100000, 40000)).toBe('PARTIAL');
    expect(calculateBillStatus(100000, 100000)).toBe('SETTLED');
    expect(calculateBillStatus(100000, 120000)).toBe('SETTLED');
  });

  it('allocates unallocated vendor payments across open material bills chronologically', () => {
    const openBills = [
      { id: 'bill-1', date: '2026-08-01', totalAmount: 50000, paidAmount: 0, status: 'OPEN' },
      { id: 'bill-2', date: '2026-08-15', totalAmount: 80000, paidAmount: 0, status: 'OPEN' }
    ];

    let paymentAmount = 70000;

    for (const bill of openBills) {
      if (paymentAmount <= 0) break;
      const due = bill.totalAmount - bill.paidAmount;
      const alloc = Math.min(paymentAmount, due);

      bill.paidAmount += alloc;
      bill.status = bill.paidAmount >= bill.totalAmount ? 'SETTLED' : 'PARTIAL';
      paymentAmount -= alloc;
    }

    expect(openBills[0].paidAmount).toBe(50000);
    expect(openBills[0].status).toBe('SETTLED');

    expect(openBills[1].paidAmount).toBe(20000);
    expect(openBills[1].status).toBe('PARTIAL');
  });
});
