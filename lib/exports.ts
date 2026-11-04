import { totals } from './analytics.ts';
import type { ReportRow, SalesRow } from './source.ts';
import { categories } from './data.ts';
export function reportDocument(
  report: ReportRow,
  rows: SalesRow[],
  mode: string,
) {
  return {
    schemaVersion: 1,
    currency: 'USD',
    dataSource: mode === 'demo' ? 'Fictional public demo' : 'Local PostgreSQL',
    report: {
      id: report.id,
      title: report.title,
      type: report.reportType,
      start: report.startDate.slice(0, 10),
      end: report.endDate.slice(0, 10),
      category: report.category,
    },
    summary: totals(rows),
    categories: categories
      .filter((c) => !report.category || c === report.category)
      .map((category) => ({
        category,
        ...totals(rows.filter((t) => t.category === category)),
      })),
    transactions: rows.map((t) => ({
      transactionId: t.transactionId,
      customer: t.customer,
      category: t.category,
      amount: t.amount,
      date: t.transactionDate.slice(0, 10),
      status: t.status,
    })),
  };
}
// Quote every field and neutralize formula prefixes after spreadsheet whitespace.
export function csvCell(value: unknown) {
  const text = String(value ?? '');
  const safe = /^[\s\uFEFF]*[=+\-@]|^[\t\r\n]/u.test(text) ? "'" + text : text;
  return '"' + safe.replaceAll('"', '""') + '"';
}
export function reportCsv(document: ReturnType<typeof reportDocument>) {
  const { report, summary } = document;
  const rows: unknown[][] = [
    ['Report', report.title],
    ['Type', report.type],
    ['Start date', report.start],
    ['End date', report.end],
    ['Category', report.category || 'All categories'],
    ['Currency', document.currency],
    ['Data source', document.dataSource],
    [],
    ['Revenue', 'Transactions', 'Completed', 'Average transaction value'],
    [summary.revenue, summary.total, summary.completed, summary.average],
    [],
  ];
  if (report.type === 'Category Performance') {
    rows.push(
      [
        'Category',
        'Revenue',
        'Transactions',
        'Completed',
        'Average transaction value',
      ],
      ...document.categories.map((c) => [
        c.category,
        c.revenue,
        c.total,
        c.completed,
        c.average,
      ]),
      [],
    );
  }
  rows.push(
    [
      'Transaction ID',
      'Customer',
      'Category',
      'Amount (USD)',
      'Date',
      'Status',
    ],
    ...document.transactions.map((t) => [
      t.transactionId,
      t.customer,
      t.category,
      t.amount,
      t.date,
      t.status,
    ]),
  );
  return (
    '\uFEFF' +
    rows.map((row) => row.map(csvCell).join(',')).join('\r\n') +
    '\r\n'
  );
}
export function exportFilename(report: ReportRow, format: string) {
  const slug =
    report.title
      .normalize('NFKD')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase()
      .slice(0, 60) || 'report';
  return `${slug}-${report.startDate.slice(0, 10)}-${report.endDate.slice(0, 10)}.${format}`;
}
