import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  transactions,
  summarize,
  filterTransactions,
  categoryTotals,
} from '../lib/data.ts';
test('shared sample dataset has stable, independently checked totals', () => {
  assert.equal(transactions.length, 48);
  const completed = transactions.filter((t) => t.status === 'Completed');
  assert.equal(completed.length, 37);
  assert.equal(summarize(transactions).revenue, 55277);
  assert.equal(
    summarize(transactions).revenue,
    completed.reduce((sum, t) => sum + t.amount, 0),
  );
  assert.equal(
    summarize(transactions).average,
    summarize(transactions).revenue / 37,
  );
  assert.equal(new Set(transactions.map((t) => t.id)).size, 48);
});
test('category totals reconcile with revenue', () =>
  assert.equal(
    categoryTotals(transactions).reduce((s, c) => s + c.value, 0),
    summarize(transactions).revenue,
  ));
test('date and category filters include boundaries', () => {
  const row = transactions[0];
  assert.deepEqual(
    filterTransactions(transactions, row.date, row.date, row.category),
    [row],
  );
  assert.equal(
    filterTransactions(transactions, '2027-01-01', '2027-12-31').length,
    0,
  );
});
test('empty data produces zero values, never NaN', () =>
  assert.deepEqual(summarize([]), {
    revenue: 0,
    total: 0,
    completed: 0,
    average: 0,
  }));
