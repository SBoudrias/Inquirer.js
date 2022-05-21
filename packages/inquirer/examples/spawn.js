import { spawn } from 'node:child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

spawn('node', ['input.js'], {
  cwd: __dirname,
  stdio: 'inherit',
});
