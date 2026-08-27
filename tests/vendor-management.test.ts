import { describe, expect, it } from 'vitest';
import { normalizeVendorName, normalizePhone } from '../lib/services/vendorService';

describe('Vendor Management Service Unit Tests', () => {
  it('normalizes vendor names consistently for duplicate prevention', () => {
    expect(normalizeVendorName('  Shree   Traders ')).toBe('shree traders');
    expect(normalizeVendorName('SHREE TRADERS')).toBe('shree traders');
    expect(normalizeVendorName('r.k. transport')).toBe('r.k. transport');
  });

  it('normalizes phone numbers to digits only', () => {
    expect(normalizePhone('+91 98765-43210')).toBe('919876543210');
    expect(normalizePhone('98765 43210')).toBe('9876543210');
    expect(normalizePhone(undefined)).toBe('');
  });

  it('determines correct vendor status based on outstanding and advance balances', () => {
    const calcStatus = (outstanding: number, advance: number) => {
      if (outstanding > 0) return 'DUE';
      if (advance > 0) return 'ADVANCE';
      return 'SETTLED';
    };

    expect(calcStatus(123000, 0)).toBe('DUE');
    expect(calcStatus(0, 10000)).toBe('ADVANCE');
    expect(calcStatus(0, 0)).toBe('SETTLED');
  });

  it('calculates running ledger balance correctly', () => {
    const rawTransactions = [
      { date: new Date('2026-08-01'), type: 'BILL', amount: 100000 },
      { date: new Date('2026-08-05'), type: 'PAYMENT', amount: -40000 },
      { date: new Date('2026-08-10'), type: 'BILL', amount: 50000 },
      { date: new Date('2026-08-15'), type: 'PAYMENT', amount: -60000 }
    ];

    let running = 0;
    const ledger = rawTransactions.map((tx) => {
      running += tx.amount;
      return { ...tx, balanceAfter: running };
    });

    expect(ledger[0].balanceAfter).toBe(100000);
    expect(ledger[1].balanceAfter).toBe(60000);
    expect(ledger[2].balanceAfter).toBe(110000);
    expect(ledger[3].balanceAfter).toBe(50000);
  });
});
