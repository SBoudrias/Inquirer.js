import * as url from 'node:url';
import { number } from '@inquirer/prompts';

const demo = async () => {
  console.log(
    'Answer:',
    await number({
      message: 'Enter your age?',
    }),
  );

  console.log(
    'Answer:',
    await number({
      message: 'Enter an integer or a decimal number?',
      step: 'any',
    }),
  );

  console.log(
    'Answer:',
    await number({
      message: 'Enter a number between 5 and 8?',
      min: 5,
      max: 8,
    }),
  );
};

if (import.meta.url.startsWith('file:')) {
  const modulePath = url.fileURLToPath(import.meta.url);
  if (process.argv[1] === modulePath) {
    demo();
  }
}

export default demo;
