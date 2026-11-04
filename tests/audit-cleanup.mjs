import assert from 'node:assert/strict';
import { readFile, unlink } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3003';
assert(['localhost', '127.0.0.1', '[::1]'].includes(new URL(base).hostname));
const { before, ids } = JSON.parse(
  await readFile('test-results/audit-marker.json', 'utf8'),
);
for (const [kind, list] of Object.entries(ids))
  for (const id of list)
    assert.equal((await fetch(base + '/api/' + kind + '/' + id)).status, 200);
for (const [kind, list] of Object.entries(ids))
  for (const id of list) {
    assert.equal(
      (await fetch(base + '/api/' + kind + '/' + id, { method: 'DELETE' }))
        .status,
      204,
    );
    assert.equal((await fetch(base + '/api/' + kind + '/' + id)).status, 404);
  }
const after = createHash('sha256')
  .update(
    JSON.stringify(
      await Promise.all(
        ['transactions', 'reports'].map(
          async (p) => await (await fetch(base + '/api/' + p)).json(),
        ),
      ),
    ),
  )
  .digest('hex');
assert.equal(after, before, 'Existing data changed during audit.');
await unlink('test-results/audit-marker.json');
console.log(
  'PASS: recorded fixtures survived restart, unauthenticated DELETE succeeds (deployment blocker), cleanup removed only fixture IDs, existing data fingerprint unchanged.',
);
