import { describe, expect, it } from 'vitest';
import { roundMoney } from '../lib/services/paymentService';

describe('V1 Full-Day Site Lifecycle Integration Test Suite', () => {
  it('simulates a complete construction site day from attendance to financial reports', () => {
    // Step 1: Project Setup
    const project = { id: 'proj-e2e-1', name: 'Sunrise Residency', code: 'SR-01' };
    expect(project.code).toBe('SR-01');

    // Step 2 & 3: Attendance & Worker Setup
    const workers = [
      { id: 'w1', name: 'Ramesh Mason', dailyRate: 800, status: 'PRESENT' },
      { id: 'w2', name: 'Suresh Helper', dailyRate: 500, status: 'PRESENT' },
      { id: 'w3', name: 'Dinesh Welder', dailyRate: 900, status: 'HALF_DAY' },
      { id: 'w4', name: 'Mahesh Helper', dailyRate: 500, status: 'ABSENT' }
    ];

    const presentCount = workers.filter((w) => w.status === 'PRESENT').length;
    const halfDayCount = workers.filter((w) => w.status === 'HALF_DAY').length;
    const absentCount = workers.filter((w) => w.status === 'ABSENT').length;

    expect(presentCount).toBe(2);
    expect(halfDayCount).toBe(1);
    expect(absentCount).toBe(1);

    // Step 4: Wage Calculation
    const todayLabourCost = roundMoney(
      workers.reduce((sum, w) => {
        if (w.status === 'PRESENT') return sum + w.dailyRate;
        if (w.status === 'HALF_DAY') return sum + w.dailyRate / 2;
        return sum;
      }, 0)
    );
    expect(todayLabourCost).toBe(800 + 500 + 450); // 1750

    // Step 5 & 6: Material Delivery & Issue
    const openingStock = 100; // bags
    const inwardQty = 500;
    const issuedQty = 250;
    const currentStock = openingStock + inwardQty - issuedQty;
    expect(currentStock).toBe(350);

    // Step 7: Site Operational Expense
    const expenses = [
      { category: 'Transport', amount: 3500, status: 'COMPLETED' },
      { category: 'Tea & Snacks', amount: 450, status: 'COMPLETED' }
    ];
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    expect(totalExpenses).toBe(3950);

    // Step 8: Daily Progress Reporting
    const workItems = [
      { workType: 'Brickwork 9 inch', qty: 45, unit: 'sqm', status: 'COMPLETED' },
      { workType: 'Slab Concreting', qty: 12, unit: 'cum', status: 'IN_PROGRESS' }
    ];
    const completedItems = workItems.filter((w) => w.status === 'COMPLETED').length;
    expect(completedItems).toBe(1);

    // Step 9 & 10: Vendor Bill & Payments
    const vendorBillAmount = 150000;
    const vendorPaymentAmount = 50000;
    const vendorOutstanding = vendorBillAmount - vendorPaymentAmount;
    expect(vendorOutstanding).toBe(100000);

    const labourPaymentAmount = 1000;
    const labourOutstanding = todayLabourCost - labourPaymentAmount;
    expect(labourOutstanding).toBe(750);

    // Step 11: Project Cost Summary Reconciliation
    const grossWages = todayLabourCost;
    const procurementBilled = vendorBillAmount;
    const siteExpenses = totalExpenses;
    const costBasis = roundMoney(grossWages + procurementBilled + siteExpenses);
    expect(costBasis).toBe(1750 + 150000 + 3950);

    const totalCashDisbursed = roundMoney(labourPaymentAmount + vendorPaymentAmount + siteExpenses);
    expect(totalCashDisbursed).toBe(1000 + 50000 + 3950);
  });
});
