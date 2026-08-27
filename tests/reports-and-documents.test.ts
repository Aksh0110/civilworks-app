import { describe, expect, it } from 'vitest';

describe('Reports & Document Management Unit Tests', () => {
  it('formats project cost summary model logically without double-counting', () => {
    const calcCostBasis = (wages: number, materialBilled: number, operationalExpenses: number) => {
      return wages + materialBilled + operationalExpenses;
    };

    const calcCashOutflow = (labourPayments: number, vendorPayments: number, operationalExpenses: number) => {
      return labourPayments + vendorPayments + operationalExpenses;
    };

    const costBasis = calcCostBasis(428600, 872000, 124500);
    const cashOutflow = calcCashOutflow(400000, 600000, 124500);

    expect(costBasis).toBe(1425100);
    expect(cashOutflow).toBe(1124500);
    expect(costBasis).not.toEqual(cashOutflow);
  });

  it('categorizes material stock status accurately', () => {
    const getStockStatus = (qty: number, minLevel: number) => {
      if (qty <= 0) return 'Out of Stock';
      if (qty <= minLevel) return 'Low';
      return 'Good';
    };

    expect(getStockStatus(500, 100)).toBe('Good');
    expect(getStockStatus(50, 100)).toBe('Low');
    expect(getStockStatus(0, 100)).toBe('Out of Stock');
  });
});
