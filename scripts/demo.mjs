// Explicit public-demo commands mask local credentials before Next loads .env.
import { spawn } from 'node:child_process';
const child = spawn(
  process.execPath,
  ['scripts/next.mjs', ...process.argv.slice(2)],
  {
    stdio: 'inherit',
    env: { ...process.env, REPORTFLOW_MODE: 'demo', DATABASE_URL: '' },
  },
);
child.on('exit', (code) => process.exit(code ?? 1));
child.on('error', () => {
  console.error('Unable to start demo command.');
  process.exit(1);
});
