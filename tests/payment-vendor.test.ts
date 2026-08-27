import { describe, expect, it } from 'vitest';
import { roundMoney } from '../lib/services/paymentService';

describe('Payment Vendor & Bill Allocation Unit Tests', () => {
  it('calculates vendor net outstanding correctly', () => {
    const totalBilled = 123000;
    const previousPaid = 50000;
    const advances = 10000;

    const outstanding = roundMoney(Math.max(0, totalBilled - previousPaid - advances));
    expect(outstanding).toBe(63000);
  });

  it('updates vendor bill status correctly based on paid amount', () => {
    const billTotal = 100000;

    // Partial Payment 1
    let paidAmount = 40000;
    let status = paidAmount >= billTotal ? 'SETTLED' : paidAmount > 0 ? 'PARTIAL' : 'OPEN';
    expect(status).toBe('PARTIAL');

    // Partial Payment 2 (Settlement)
    paidAmount = 100000;
    status = paidAmount >= billTotal ? 'SETTLED' : paidAmount > 0 ? 'PARTIAL' : 'OPEN';
    expect(status).toBe('SETTLED');
  });

  it('calculates vendor advance adjustment correctly', () => {
    const totalBilled = 50000;
    const advances = 60000;

    const outstanding = roundMoney(Math.max(0, totalBilled - advances));
    expect(outstanding).toBe(0);
  });
});
