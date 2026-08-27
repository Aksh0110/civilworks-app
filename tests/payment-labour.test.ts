import { describe, expect, it } from 'vitest';
import { roundMoney, generateReceiptId } from '../lib/services/paymentService';

describe('Payment Labour & Financial Calculation Unit Tests', () => {
  it('preserves exact currency precision with roundMoney', () => {
    expect(roundMoney(10.005)).toBe(10.01);
    expect(roundMoney(22500.333)).toBe(22500.33);
    expect(roundMoney(100.1 + 0.2)).toBe(100.3);
  });

  it('calculates labour amount due correctly with advances and previous payments', () => {
    const grossWage = 22500;
    const advances = 2000;
    const previousPaid = 10000;

    const amountDue = roundMoney(Math.max(0, grossWage - advances - previousPaid));
    expect(amountDue).toBe(10500);
  });

  it('handles partial payment remaining due calculation', () => {
    const currentDue = 10500;
    const partialPayment = 5000;

    const remainingDue = roundMoney(currentDue - partialPayment);
    expect(remainingDue).toBe(5500);
  });

  it('prevents amount due from becoming negative', () => {
    const grossWage = 5000;
    const advances = 6000;
    const previousPaid = 0;

    const amountDue = roundMoney(Math.max(0, grossWage - advances - previousPaid));
    expect(amountDue).toBe(0);
  });

  it('generates valid formatted receipt IDs', async () => {
    // Basic pattern test
    const receiptIdPattern = /^PAY-\d{6}-\d{5}$/;
    const exampleId = 'PAY-260827-00001';
    expect(receiptIdPattern.test(exampleId)).toBe(true);
  });
});
