import * as readline from 'node:readline';

const rl = readline.createInterface({
  terminal: true,
  input: process.stdin,
  output: process.stdout,
});

function handler(
  _input: string,
  key: {
    sequence?: string;
    name?: string;
    ctrl?: boolean;
    meta?: boolean;
    shift?: boolean;
  },
) {
  process.stdout.write(JSON.stringify(key, null, 2) + `\n`);
  if (key.ctrl && key.name === 'c') {
    process.stdin.removeListener('keypress', handler);
    rl.close();
  }
}

process.stdin.on('keypress', handler);
console.log('Press any key...');
