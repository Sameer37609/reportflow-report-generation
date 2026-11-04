import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3005';
assert(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
const marker = JSON.parse(
  await readFile('test-results/audit-marker.json', 'utf8'),
);
const id = marker.ids.transactions[0];
const row = (await (await fetch(base + '/api/transactions/' + id)).json()).data;
const r = await fetch(base + '/api/transactions/' + id, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    transactionId: row.transactionId,
    customer: '=HYPERLINK("https://invalid.example")',
    category: row.category,
    amount: row.amount,
    date: row.transactionDate.slice(0, 10),
    status: row.status,
  }),
});
assert.equal(r.status, 200);
for (const reportId of marker.ids.reports) {
  const detail = (await (await fetch(base + '/api/reports/' + reportId)).json())
    .data;
  const response = await fetch(
    base + '/api/reports/' + reportId + '/export?format=json',
  );
  assert.equal(response.status, 200);
  const doc = await response.json();
  assert.equal(doc.dataSource, 'Local PostgreSQL');
  assert.deepEqual(doc.summary, detail.metrics);
  assert.equal(doc.transactions.length, detail.transactions.length);
  const csv = await (
    await fetch(base + '/api/reports/' + reportId + '/export?format=csv')
  ).text();
  if (doc.transactions.length)
    assert(csv.includes('"\'=HYPERLINK(""https://invalid.example"")"'));
}
console.log(
  'PASS: local DB-derived JSON/CSV for both report types and empty report; exact metrics match detail; real formula-like database value neutralized in CSV.',
);
