import * as url from 'node:url';
import { input } from '@inquirer/prompts';

async function demo() {
  const answer = await input(
    { message: 'Enter a value (timing out in 5 seconds)' },
    { signal: AbortSignal.timeout(5000) },
  ).catch((error: unknown) => {
    if (error instanceof Error && error.name === 'AbortPromptError') {
      return 'Default value';
    }

    throw error;
  });
  console.log('Answer:', answer);
}

if (import.meta.url.startsWith('file:')) {
  const modulePath = url.fileURLToPath(import.meta.url);
  if (process.argv[1] === modulePath) {
    await demo();
  }
}

export default demo;
