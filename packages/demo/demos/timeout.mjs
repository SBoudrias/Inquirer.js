import * as url from 'node:url';
import { setTimeout } from 'node:timers/promises';
import { input } from '@inquirer/prompts';

async function demo() {
  const ac = new AbortController();
  const prompt = input({
    message: 'Enter a value (timing out in 5 seconds)',
  });

  prompt
    .finally(() => {
      ac.abort();
    })
    // Silencing the cancellation error.
    .catch(() => {});

  const defaultValue = setTimeout(5000, 'timeout', { signal: ac.signal }).then(() => {
    prompt.cancel();
    return 'Timed out!';
  });

  const answer = await Promise.race([defaultValue, prompt]);
  console.log('Answer:', answer);
}

if (import.meta.url.startsWith('file:')) {
  const modulePath = url.fileURLToPath(import.meta.url);
  if (process.argv[1] === modulePath) {
    demo();
  }
}

export default demo;
