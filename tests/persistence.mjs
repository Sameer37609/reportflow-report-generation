import assert from 'node:assert/strict';
import { readFile, unlink } from 'node:fs/promises';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3002';
assert(
  ['localhost', '127.0.0.1', '[::1]'].includes(new URL(base).hostname),
  'Tests require loopback.',
);
const marker = JSON.parse(
  await readFile('test-results/persistence.json', 'utf8'),
);
for (const [kind, id] of [
  ['transactions', marker.tx],
  ['reports', marker.report],
]) {
  const r = await fetch(`${base}/api/${kind}/${id}`);
  assert.equal(r.status, 200);
  const { data } = await r.json();
  if (kind === 'transactions') assert.equal(Number(data.amount), 12.34);
  else assert(data.transactions.some((t) => t.id === marker.tx));
}
for (const [kind, id] of [
  ['transactions', marker.tx],
  ['reports', marker.report],
]) {
  assert.equal(
    (await fetch(`${base}/api/${kind}/${id}`, { method: 'DELETE' })).status,
    204,
  );
  assert.equal((await fetch(`${base}/api/${kind}/${id}`)).status, 404);
}
await unlink('test-results/persistence.json');
console.log(
  'PASS: recorded transaction/report persisted; DELETE and missing-record checks pass. Only marker IDs removed. Restart must be performed separately.',
);
