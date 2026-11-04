import { initialReports, transactions } from './data.ts';
import { applicationMode } from './mode.ts';
export type SalesRow = {
  id: string;
  transactionId: string;
  customer: string;
  category: string;
  amount: string;
  transactionDate: string;
  status: string;
};
export type ReportRow = {
  id: string;
  title: string;
  reportType: string;
  startDate: string;
  endDate: string;
  category: string | null;
  createdAt: string;
  updatedAt: string;
};
const demoRows: SalesRow[] = transactions.map((t) => ({
  id: t.id,
  transactionId: t.id,
  customer: t.customer,
  category: t.category,
  amount: t.amount.toFixed(2),
  transactionDate: t.date + 'T00:00:00.000Z',
  status: t.status,
}));
const demoReports: ReportRow[] = initialReports.map((r) => ({
  id: r.id,
  title: r.title,
  reportType: r.type,
  startDate: r.start + 'T00:00:00.000Z',
  endDate: r.end + 'T00:00:00.000Z',
  category: r.category === 'All categories' ? null : r.category,
  createdAt: r.created + 'T00:00:00.000Z',
  updatedAt: r.created + 'T00:00:00.000Z',
}));
export async function listTransactions(): Promise<SalesRow[]> {
  if (applicationMode() === 'demo')
    return demoRows.toSorted((a, b) =>
      b.transactionDate.localeCompare(a.transactionDate),
    );
  const { database } = await import('./db.ts');
  return (
    await database().transaction.findMany({
      orderBy: { transactionDate: 'desc' },
    })
  ).map((t) => ({
    ...t,
    amount: t.amount.toFixed(2),
    transactionDate: t.transactionDate.toISOString(),
  }));
}
export async function listReports(): Promise<ReportRow[]> {
  if (applicationMode() === 'demo') return demoReports;
  const { database } = await import('./db.ts');
  return (
    await database().savedReport.findMany({ orderBy: { createdAt: 'desc' } })
  ).map((r) => ({
    ...r,
    startDate: r.startDate.toISOString(),
    endDate: r.endDate.toISOString(),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}
export async function reportTransactions(report: ReportRow) {
  return (await listTransactions())
    .filter(
      (t) =>
        t.transactionDate >= report.startDate &&
        t.transactionDate <= report.endDate &&
        (!report.category || t.category === report.category),
    )
    .toSorted((a, b) => a.transactionDate.localeCompare(b.transactionDate));
}
export async function findReport(id: string) {
  return (await listReports()).find((r) => r.id === id);
}
