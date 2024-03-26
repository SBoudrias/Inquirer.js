import { spawn } from 'node:child_process';

spawn('node', ['input.js'], {
  cwd: import.meta.dirname,
  stdio: 'inherit',
});
