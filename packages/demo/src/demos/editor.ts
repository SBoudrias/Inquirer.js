import * as url from 'node:url';
import { editor } from '@inquirer/prompts';

const demo = async () => {
  console.log(
    'Answer:',
    await editor({
      message: 'Please write a short bio of at least 3 lines.',
      validate(text) {
        if (text.trim().split('\n').length < 3) {
          return 'Must be at least 3 lines.';
        }

        return true;
      },
    }),
  );

  console.log(
    'Answer:',
    await editor({
      message: 'Automatically opened editor',
      default: '# This prompt was automatically opened. You can write anything:\n\n',
      waitForUserInput: false,
    }),
  );

  console.log(
    'Answer:',
    await editor({
      message: 'Custom messages',
      validate: async () => {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        return true;
      },
      theme: {
        style: {
          loadingMessage: () => 'Loading...',
          waitingMessage: (enterKey: string) => `Press ${enterKey} to write stuff`,
        },
      },
    }),
  );
};

if (import.meta.url.startsWith('file:')) {
  const modulePath = url.fileURLToPath(import.meta.url);
  if (process.argv[1] === modulePath) {
    await demo();
  }
}

export default demo;
