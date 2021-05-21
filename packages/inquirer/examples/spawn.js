const { spawn } = require('child_process');

spawn('node', ['input.js'], {
  cwd: __dirname,
  stdio: 'inherit',
});
