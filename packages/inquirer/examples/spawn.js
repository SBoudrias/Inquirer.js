var spawn = require('child_process').spawn;

spawn('node', ['input.js'], {
  cwd: __dirname,
  stdio: 'inherit'
});
