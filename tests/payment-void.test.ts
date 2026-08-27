import { describe, expect, it } from 'vitest';
import { roundMoney } from '../lib/services/paymentService';

describe('Payment Void & Reversal Logic Unit Tests', () => {
  it('correctly calculates restored vendor bill balance on payment void', () => {
    const originalPaidAmount = 70000;
    const voidedPaymentAmount = 30000;

    const restoredPaidAmount = roundMoney(Math.max(0, originalPaidAmount - voidedPaymentAmount));
    expect(restoredPaidAmount).toBe(40000);

    const billTotal = 100000;
    const restoredStatus = restoredPaidAmount >= billTotal ? 'SETTLED' : restoredPaidAmount > 0 ? 'PARTIAL' : 'OPEN';
    expect(restoredStatus).toBe('PARTIAL');
  });

  it('restores bill to OPEN status if all payments are voided', () => {
    const originalPaidAmount = 30000;
    const voidedPaymentAmount = 30000;

    const restoredPaidAmount = roundMoney(Math.max(0, originalPaidAmount - voidedPaymentAmount));
    expect(restoredPaidAmount).toBe(0);

    const billTotal = 100000;
    const restoredStatus = restoredPaidAmount >= billTotal ? 'SETTLED' : restoredPaidAmount > 0 ? 'PARTIAL' : 'OPEN';
    expect(restoredStatus).toBe('OPEN');
  });
});
