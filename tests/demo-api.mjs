import assert from 'node:assert/strict';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3004';
assert(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
async function get(path) {
  const r = await fetch(base + path);
  assert.equal(r.status, 200, path);
  return r.json();
}
const { data: rows } = await get('/api/transactions');
assert.equal(rows.length, 48);
assert(rows.every((t) => t.transactionId.startsWith('TX-')));
assert.equal((await get('/api/analytics')).data.revenue, '55277.00');
for (const path of [
  '/api/transactions',
  '/api/transactions/TX-1001',
  '/api/reports',
  '/api/reports/r1',
  '/api/analytics',
  '/api/reports/preview',
  '/api/reports/r1/export',
  '/api/reports/preview/export',
])
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
    const r = await fetch(base + path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    assert.equal(r.status, 403, method + ' ' + path);
  }
for (const id of ['r1', 'r2', 'r3']) {
  const { data: detail } = await get('/api/reports/' + id);
  const r = await fetch(base + '/api/reports/' + id + '/export?format=json');
  assert.equal(r.status, 200);
  assert.match(r.headers.get('content-type'), /application\/json/);
  assert.match(
    r.headers.get('content-disposition'),
    /attachment; filename="[a-z0-9-]+\.json"/,
  );
  const doc = await r.json();
  assert.deepEqual(doc.summary, detail.metrics);
  assert.equal(doc.transactions.length, detail.transactions.length);
  assert.equal(doc.dataSource, 'Fictional public demo');
  const csv = await fetch(base + '/api/reports/' + id + '/export?format=csv');
  assert.match(csv.headers.get('content-type'), /text\/csv/);
  assert.match(csv.headers.get('content-disposition'), /\.csv"/);
  const text = await csv.text();
  assert(text.includes('"' + doc.summary.revenue + '"'));
  assert(text.includes('"Transaction ID","Customer"'));
  if (id === 'r2') assert(text.includes('"Category","Revenue"'));
}
const query = new URLSearchParams({
  title: 'Empty report',
  type: 'Category Performance',
  start: '2027-01-01',
  end: '2027-01-01',
  category: 'Software',
});
let doc = await get('/api/reports/preview/export?' + query + '&format=json');
assert.equal(doc.summary.revenue, '0.00');
assert.equal(doc.transactions.length, 0);
query.set('start', '2026-09-01');
query.set('end', '2026-09-30');
doc = await get('/api/reports/preview/export?' + query + '&format=json');
assert(
  doc.transactions.every(
    (t) =>
      t.category === 'Software' &&
      t.date >= '2026-09-01' &&
      t.date <= '2026-09-30',
  ),
);
for (const path of [
  '/api/reports/r1/export?format=pdf',
  '/api/reports/r1/export?format=json&category=Design',
  '/api/reports/preview/export?format=json&type=Sales+Summary&start=2026-02-30&end=2026-03-01',
  '/api/reports/preview/export?format=json&format=csv',
])
  assert.equal((await fetch(base + path)).status, 400, path);
assert.equal(
  (await fetch(base + '/api/reports/unknown/export?format=json')).status,
  404,
);
console.log(
  'PASS: no-credential demo reads, fictional totals, 32 write denials, both report exports and exact metrics, filenames/content types, filtered/empty exports, invalid export requests.',
);
