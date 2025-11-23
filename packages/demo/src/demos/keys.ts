import * as readline from 'node:readline';

async function demo(): Promise<void> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      terminal: true,
      input: process.stdin,
      output: process.stdout,
    });

    function handler(_input: string, key: { name: string; ctrl: boolean }) {
      process.stdout.write(JSON.stringify(key, null, 2) + `\n`);
      if (key.ctrl && key.name === 'c') {
        process.stdin.removeListener('keypress', handler);
        rl.close();
        resolve();
      }
    }

    process.stdin.on('keypress', handler);
    console.log('Press any key... ctrl+c to go back');
  });
}

export default demo;
