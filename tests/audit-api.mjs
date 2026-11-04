import assert from 'node:assert/strict';
import { mkdir, writeFile, access } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3003';
const target = new URL(base);
assert(
  ['localhost', '127.0.0.1', '[::1]'].includes(target.hostname),
  'Audit only supports loopback.',
);
async function call(path, method = 'GET', body, headers = {}) {
  const r = await fetch(base + '/api/' + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    ...(body === undefined
      ? {}
      : { body: typeof body === 'string' ? body : JSON.stringify(body) }),
  });
  return {
    status: r.status,
    data: r.status === 204 ? null : await r.json().catch(() => null),
  };
}
const fingerprint = async () =>
  createHash('sha256')
    .update(
      JSON.stringify(
        await Promise.all(
          ['transactions', 'reports'].map(async (p) => (await call(p)).data),
        ),
      ),
    )
    .digest('hex');
const before = await fingerprint();
const prefix = 'AUDIT-' + randomUUID().slice(0, 24);
try {
  await access('test-results/audit-marker.json');
  throw new Error('Clean up the previous audit marker before running again.');
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
const ids = { transactions: [], reports: [] };
const value = {
  transactionId: prefix,
  customer: 'Fictional audit fixture',
  category: 'Software',
  amount: '0.10',
  date: '2026-06-15',
  status: 'Completed',
};
try {
  const baseline = (await call('analytics')).data.data;
  for (const amount of [[1], {}, null, '1.001', '0', '-1'])
    assert.equal(
      (await call('transactions', 'POST', { ...value, amount })).status,
      400,
    );
  assert.equal(
    (await call('transactions', 'POST', { ...value, date: '2026-02-30' }))
      .status,
    400,
  );
  const malformed = await call('transactions', 'POST', '{"private-marker":');
  assert.equal(malformed.status, 400);
  assert(!JSON.stringify(malformed.data).includes('private-marker'));
  for (const origin of ['null', 'not-a-url', 'https://attacker.invalid'])
    assert.equal(
      (await call('transactions', 'POST', value, { Origin: origin })).status,
      403,
    );
  let r = await call('transactions', 'POST', value, { Origin: base });
  assert.equal(r.status, 201);
  const id = r.data.data.id;
  ids.transactions.push(id);
  // No authentication exists: record this as a deployment failure, not a security pass.
  assert.equal((await call('transactions/' + id)).status, 200);
  assert.equal((await call('transactions/' + id, 'PATCH', {})).status, 405);
  assert.equal((await call('transactions', 'POST', value)).status, 409);
  assert.equal(
    (await call('transactions/' + id, 'PUT', { ...value, amount: '12.34' }))
      .status,
    200,
  );
  const metrics = (await call('analytics')).data.data;
  assert.equal(
    Math.round(Number(metrics.revenue) * 100) -
      Math.round(Number(baseline.revenue) * 100),
    1234,
  );
  r = await call('transactions', 'POST', {
    ...value,
    transactionId: 'OTHER-' + randomUUID().slice(0, 24),
    category: 'Consulting',
    date: '2026-06-16',
    status: 'Pending',
    amount: '9.99',
  });
  assert.equal(r.status, 201);
  ids.transactions.push(r.data.data.id);
  const ordered = (await call('transactions')).data.data;
  assert(
    ordered.findIndex((t) => t.id === r.data.data.id) <
      ordered.findIndex((t) => t.id === id),
  );
  for (const type of ['Sales Summary', 'Category Performance']) {
    r = await call('reports', 'POST', {
      title: prefix,
      type,
      start: value.date,
      end: value.date,
      category: 'Software',
    });
    assert.equal(r.status, 201);
    ids.reports.push(r.data.data.id);
    const detail = (await call('reports/' + r.data.data.id)).data.data;
    assert(detail.transactions.some((t) => t.id === id));
    assert(
      detail.transactions.every(
        (t) =>
          t.category === 'Software' &&
          t.transactionDate.slice(0, 10) === value.date,
      ),
    );
  }
  r = await call('reports', 'POST', {
    title: prefix,
    type: 'Sales Summary',
    start: '9998-01-01',
    end: '9998-01-01',
  });
  assert.equal(r.status, 201);
  ids.reports.push(r.data.data.id);
  assert.equal(
    (await call('reports/' + r.data.data.id)).data.data.metrics.revenue,
    '0.00',
  );
  assert.equal(
    (
      await call('transactions/' + id, 'DELETE', undefined, {
        Origin: 'https://attacker.invalid',
      })
    ).status,
    403,
  );
  assert.equal((await call('transactions/missing')).status, 404);
  await mkdir('test-results', { recursive: true });
  await writeFile(
    'test-results/audit-marker.json',
    JSON.stringify({ before, ids, prefix }),
  );
  console.log(
    'PASS: validation, decimal analytics, both report types, date/category filtering, empty period, origin rejection and fixture CRUD. SECURITY FAIL confirmed: unauthenticated GET/POST/PUT succeed; PATCH is unsupported (405). Restart marker retained for cleanup.',
  );
} catch (e) {
  for (const [kind, list] of Object.entries(ids))
    for (const id of list) await call(kind + '/' + id, 'DELETE');
  throw e;
}
