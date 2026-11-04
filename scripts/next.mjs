// Use the official portable compiler when Windows policy blocks native modules.
// Webpack supports this fallback; Turbopack requires a native compiler.
import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { spawn } from 'node:child_process';

const require = createRequire(import.meta.url);
const env = { ...process.env };
if (process.platform === 'win32' && process.arch === 'x64') {
  try {
    require('@next/swc-win32-x64-msvc');
  } catch {
    env.NEXT_TEST_WASM_DIR = dirname(
      require.resolve('@next/swc-wasm-nodejs/package.json'),
    );
  }
}
const child = spawn(
  process.execPath,
  [require.resolve('next/dist/bin/next'), ...process.argv.slice(2)],
  { stdio: 'inherit', env },
);
child.on('exit', (code) => process.exit(code ?? 1));
child.on('error', (error) => {
  console.error(error.message);
  process.exit(1);
});
