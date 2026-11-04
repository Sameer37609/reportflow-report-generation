import assert from 'node:assert/strict';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3002';
assert(
  ['localhost', '127.0.0.1', '[::1]'].includes(new URL(base).hostname),
  'Tests require loopback.',
);
const prefix = 'VERIFY-' + Date.now();
let tx, report;
async function call(path, method = 'GET', body) {
  const response = await fetch(base + '/api/' + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const json = response.status === 204 ? null : await response.json();
  return { status: response.status, data: json?.data, error: json?.error };
}
const value = {
  transactionId: prefix,
  customer: 'Phase 2 verification',
  category: 'Software',
  amount: '0.10',
  date: '2026-06-15',
  status: 'Completed',
};
try {
  const baseline = (await call('analytics')).data;
  assert.equal(
    (await call('transactions', 'POST', { ...value, amount: '1.001' })).status,
    400,
  );
  assert.equal(
    (await call('transactions', 'POST', { ...value, date: '2026-02-30' }))
      .status,
    400,
  );
  let response = await call('transactions', 'POST', value);
  assert.equal(response.status, 201);
  tx = response.data.id;
  assert.equal((await call('transactions', 'POST', value)).status, 409);
  assert.equal((await call('transactions/' + tx)).data.amount, '0.1');
  response = await call('transactions/' + tx, 'PUT', {
    ...value,
    amount: '12.34',
  });
  assert.equal(response.status, 200);
  const after = (await call('analytics')).data;
  assert.equal(
    Math.round(Number(after.revenue) * 100) -
      Math.round(Number(baseline.revenue) * 100),
    1234,
  );
  response = await call('reports', 'POST', {
    title: prefix,
    type: 'Sales Summary',
    start: '2026-06-15',
    end: '2026-06-15',
    category: 'Software',
  });
  assert.equal(response.status, 201);
  report = response.data.id;
  const detail = (await call('reports/' + report)).data;
  assert(detail.transactions.some((t) => t.id === tx));
  assert(detail.metrics);
  assert.equal(
    (
      await call('reports', 'POST', {
        title: prefix,
        type: 'Category Performance',
        start: '2026-07-01',
        end: '2026-06-01',
      })
    ).status,
    400,
  );
  assert.equal((await call('transactions/missing')).status, 404);
  // Leave a small marker for an actual server-restart persistence check.
  await import('node:fs/promises').then((fs) =>
    fs.writeFile(
      'test-results/persistence.json',
      JSON.stringify({ tx, report, value: { ...value, amount: '12.34' } }),
    ),
  );
  console.log(
    'PASS: API CRUD create/read/update, decimal validation, invalid dates, duplicate ID, missing record, saved report retrieval/filtering, analytics reconciliation. Persistence marker saved.',
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
