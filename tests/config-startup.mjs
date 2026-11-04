import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
for (const [mode, hosted, expected] of [
  ['', '', 'REPORTFLOW_MODE'],
  ['invalid', '', 'REPORTFLOW_MODE'],
  ['local', '1', 'Hosted deployments'],
]) {
  const result = spawnSync(
    process.execPath,
    ['scripts/next.mjs', 'build', '--webpack'],
    {
      env: {
        ...process.env,
        REPORTFLOW_MODE: mode,
        VERCEL: hosted,
        DATABASE_URL: '',
      },
      encoding: 'utf8',
    },
  );
  assert.notEqual(result.status, 0);
  assert((result.stdout + result.stderr).includes(expected));
}
console.log(
  'PASS: missing/invalid mode and hosted-local configuration fail closed before build.',
);
