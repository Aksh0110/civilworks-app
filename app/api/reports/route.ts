import { NextResponse } from 'next/server';
import {
  getAttendanceReport,
  getWageReport,
  getMaterialStockReport,
  getMaterialMovementReport,
  getVendorOutstandingReport,
  getVendorLedgerReport,
  getExpenseReport,
  getPaymentRegisterReport,
  getDailyProgressReportView,
  getProjectCostSummaryReport
} from '@/lib/services/reportService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'cost-summary';
    const projectId = searchParams.get('projectId');
    const fromDate = searchParams.get('fromDate') || undefined;
    const toDate = searchParams.get('toDate') || undefined;
    const category = searchParams.get('category') || undefined;
    const vendorId = searchParams.get('vendorId') || undefined;
    const paymentType = searchParams.get('paymentType') || undefined;
    const dateStr = searchParams.get('date') || new Date().toISOString().split('T')[0];

    if (!projectId && type !== 'vendor-outstanding') {
      return NextResponse.json({ message: 'projectId is required' }, { status: 400 });
    }

    let reportData: any = null;

    switch (type) {
      case 'attendance':
        reportData = await getAttendanceReport(projectId!, fromDate, toDate);
        break;
      case 'wage':
        reportData = await getWageReport(projectId!, fromDate, toDate);
        break;
      case 'material-stock':
        reportData = await getMaterialStockReport(projectId!, category);
        break;
      case 'material-movement':
        reportData = await getMaterialMovementReport(projectId!, fromDate, toDate);
        break;
      case 'vendor-outstanding':
        reportData = await getVendorOutstandingReport(projectId || '');
        break;
      case 'vendor-ledger':
        if (!vendorId) return NextResponse.json({ message: 'vendorId is required for vendor ledger report' }, { status: 400 });
        reportData = await getVendorLedgerReport(vendorId, projectId || undefined);
        break;
      case 'expense':
        reportData = await getExpenseReport(projectId!, fromDate, toDate, category);
        break;
      case 'payment':
        reportData = await getPaymentRegisterReport(projectId!, fromDate, toDate, paymentType);
        break;
      case 'progress':
        reportData = await getDailyProgressReportView(projectId!, dateStr);
        break;
      case 'cost-summary':
      default:
        reportData = await getProjectCostSummaryReport(projectId!);
        break;
    }

    return NextResponse.json({ data: reportData });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to generate report' },
      { status: 500 }
    );
  }
}
