import * as readline from 'node:readline';

function handler(input, key) {
  rl.output.write(JSON.stringify(key, null, 2) + `\n`);
  if (key.ctrl && key.name === 'c') {
    rl.input.removeListener('keypress', handler);
    rl.close();
  }
}

const rl = readline.createInterface({
  terminal: true,
  input: process.stdin,
  output: process.stdout,
});

rl.input.on('keypress', handler);
console.log('Press any key...');
