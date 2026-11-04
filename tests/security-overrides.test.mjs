import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
test('scoped patched merge and glob APIs remain compatible with consumer usage', () => {
  const configRequire = createRequire(require.resolve('@prisma/config'));
  const { deepmerge } = configRequire('deepmerge-ts');
  assert.deepEqual(
    deepmerge(
      { nested: { a: 1 }, items: ['a'] },
      { nested: { b: 2 }, items: ['b'] },
    ),
    { nested: { a: 1, b: 2 }, items: ['a', 'b'] },
  );
  const lintRequire = createRequire(
    require.resolve('@typescript-eslint/typescript-estree'),
  );
  const { minimatch } = lintRequire('minimatch');
  assert(minimatch('.config.ts', '*.ts', { dot: true }));
  assert(!minimatch('file.js', '*.ts', { dot: true }));
});
