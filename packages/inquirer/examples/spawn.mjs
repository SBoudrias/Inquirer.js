import { spawn } from 'node:child_process';

spawn('node', ['input.mjs'], {
  // eslint-disable-next-line n/no-unsupported-features/node-builtins
  cwd: import.meta.dirname,
  stdio: 'inherit',
});
