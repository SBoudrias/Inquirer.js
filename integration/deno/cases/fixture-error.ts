import { createPrompt } from '@inquirer/core';

// A view function that throws must surface as a rejected prompt (and a
// non-zero exit code), not as an unhandled Deno runtime crash.
const fixturePrompt = createPrompt(() => {
  throw new Error('boom');
});

await fixturePrompt({ message: 'This prompt is broken' });
