import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Prisma } from '@prisma/client';
import {
  csvCell,
  reportCsv,
  reportDocument,
  exportFilename,
} from '../lib/exports.ts';
import { applicationMode } from '../lib/mode.ts';
import { database } from '../lib/db.ts';
const report = {
  id: 'x',
  title: 'Quarter, "one"\r\n=SUM(A1)',
  reportType: 'Sales Summary',
  startDate: '2026-01-01T00:00:00.000Z',
  endDate: '2026-12-31T00:00:00.000Z',
  category: null,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};
const rows = [
  {
    id: '1',
    transactionId: 'TX-1',
    customer: '=HYPERLINK("bad")',
    category: 'Software',
    amount: '0.10',
    transactionDate: '2026-06-01T00:00:00.000Z',
    status: 'Completed',
  },
  {
    id: '2',
    transactionId: 'TX-2',
    customer: 'Comma, Quote"\r\nline',
    category: 'Design',
    amount: '0.20',
    transactionDate: '2026-06-01T00:00:00.000Z',
    status: 'Completed',
  },
  {
    id: '3',
    transactionId: 'TX-3',
    customer: 'Pending',
    category: 'Design',
    amount: '100.00',
    transactionDate: '2026-06-01T00:00:00.000Z',
    status: 'Pending',
  },
];
test('explicit mode fails closed and database function cannot run in demo', () => {
  const saved = process.env.REPORTFLOW_MODE,
    hosted = process.env.VERCEL;
  try {
    delete process.env.VERCEL;
    delete process.env.REPORTFLOW_MODE;
    assert.throws(applicationMode);
    process.env.REPORTFLOW_MODE = 'typo';
    assert.throws(applicationMode);
    process.env.REPORTFLOW_MODE = 'demo';
    assert.equal(applicationMode(), 'demo');
    assert.throws(database, /disabled/);
    process.env.REPORTFLOW_MODE = 'local';
    process.env.VERCEL = '1';
    assert.throws(applicationMode, /Hosted/);
  } finally {
    if (saved === undefined) delete process.env.REPORTFLOW_MODE;
    else process.env.REPORTFLOW_MODE = saved;
    if (hosted === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = hosted;
  }
});
test('CSV protects formula and control prefixes, quotes and delimiters', () => {
  for (const value of [
    '=1+1',
    '+SUM(1)',
    '-1+2',
    '@SUM(1)',
    ' \t=1',
    '\uFEFF=1',
    '\tcommand',
    '\rcommand',
    '\ncommand',
  ])
    assert(csvCell(value).startsWith('"\''));
  assert.equal(csvCell('A,"B"'), '"A,""B"""');
  assert.equal(csvCell('0.10'), '"0.10"');
});
test('export metrics use exact money and reconcile categories', () => {
  const doc = reportDocument(report, rows, 'demo');
  assert.equal(doc.summary.revenue, '0.30');
  assert.equal(doc.summary.average, '0.15');
  assert.equal(doc.summary.total, 3);
  assert.equal(
    doc.categories
      .reduce((a, c) => a.plus(c.revenue), new Prisma.Decimal(0))
      .toFixed(2),
    '0.30',
  );
  const csv = reportCsv(doc);
  assert(csv.startsWith('\uFEFF'));
  assert(csv.includes('"\'=HYPERLINK(""bad"")"'));
  assert(csv.includes('"Comma, Quote""\r\nline"'));
  assert(csv.endsWith('\r\n'));
  assert.equal(JSON.parse(JSON.stringify(doc)).transactions[0].amount, '0.10');
});
test('both report types and empty exports retain headers and filters', () => {
  for (const type of ['Sales Summary', 'Category Performance']) {
    const doc = reportDocument(
      { ...report, reportType: type, category: 'Software' },
      [],
      'demo',
    );
    assert.equal(doc.summary.revenue, '0.00');
    assert.equal(doc.summary.average, '0.00');
    assert.equal(doc.transactions.length, 0);
    assert(reportCsv(doc).includes('"Transaction ID"'));
    assert.equal(doc.report.category, 'Software');
    if (type === 'Category Performance')
      assert(reportCsv(doc).includes('"Category","Revenue"'));
  }
});
test('filenames contain no path or header injection', () => {
  const name = exportFilename(
    { ...report, title: '../../evil\r\nInjected: yes' },
    'csv',
  );
  assert.match(name, /^[a-z0-9-]+-2026-01-01-2026-12-31\.csv$/);
});
