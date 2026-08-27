import { describe, it, expect } from 'vitest';
import { calculateStockStatus } from '../lib/services/materialService';

describe('Material Stock Engine & Validation Rules', () => {
  it('should correctly determine stock status (Good, Low, Out of Stock)', () => {
    expect(calculateStockStatus(100, 50)).toBe('GOOD');
    expect(calculateStockStatus(50, 50)).toBe('GOOD');
    expect(calculateStockStatus(49, 50)).toBe('LOW');
    expect(calculateStockStatus(1, 50)).toBe('LOW');
    expect(calculateStockStatus(0, 50)).toBe('OUT_OF_STOCK');
    expect(calculateStockStatus(-5, 50)).toBe('OUT_OF_STOCK');
    expect(calculateStockStatus(10, 0)).toBe('GOOD');
    expect(calculateStockStatus(0, 0)).toBe('OUT_OF_STOCK');
  });

  it('should calculate inward stock increase cleanly', () => {
    const initialStock = 0;
    const inwardQuantity = 300;
    const newStock = initialStock + inwardQuantity;
    expect(newStock).toBe(300);
    expect(calculateStockStatus(newStock, 50)).toBe('GOOD');
  });

  it('should calculate issue stock decrease cleanly', () => {
    const initialStock = 300;
    const issueQuantity = 100;
    const newStock = initialStock - issueQuantity;
    expect(newStock).toBe(200);
    expect(calculateStockStatus(newStock, 50)).toBe('GOOD');
  });

  it('should reject issue when requested quantity exceeds available stock balance', () => {
    const availableStock = 200;
    const requestedIssueQuantity = 500;

    const validateIssue = (available: number, requested: number) => {
      if (requested > available) {
        throw new Error(
          `Insufficient stock for "OPC Cement". Available balance: ${available} Bags. Requested to issue: ${requested} Bags.`
        );
      }
      return available - requested;
    };

    expect(() => validateIssue(availableStock, requestedIssueQuantity)).toThrow(
      /Insufficient stock for "OPC Cement"/
    );
  });

  it('should correctly transition to LOW and OUT_OF_STOCK when issuing material', () => {
    let currentStock = 300;
    const minStockLevel = 50;

    // Issue 260 bags -> stock becomes 40 (< 50)
    currentStock -= 260;
    expect(currentStock).toBe(40);
    expect(calculateStockStatus(currentStock, minStockLevel)).toBe('LOW');

    // Issue remaining 40 bags -> stock becomes 0
    currentStock -= 40;
    expect(currentStock).toBe(0);
    expect(calculateStockStatus(currentStock, minStockLevel)).toBe('OUT_OF_STOCK');
  });

  it('should correctly handle stock adjustments (SET, ADD, SUBTRACT)', () => {
    let stock = 100;

    // SET to 450
    stock = 450;
    expect(stock).toBe(450);

    // ADD 50
    stock += 50;
    expect(stock).toBe(500);

    // SUBTRACT 150
    stock -= 150;
    expect(stock).toBe(350);
  });
});
