import * as url from 'node:url';
import { confirm } from '@inquirer/prompts';

const demo = async () => {
  console.log(
    'Answer:',
    await confirm({
      message: 'Confirm?',
    }),
  );

  console.log(
    'Answer:',
    await confirm({
      message: 'Confirm with default to no?',
      default: false,
    }),
  );

  console.log(
    'Answer:',
    await confirm({
      message: 'Confirm with your custom transformer function?',
      transformer: (answer) => (answer ? '👍' : '👎'),
    }),
  );

  console.log('This next prompt will be cleared on exit');
  console.log(
    'Cleared prompt answer:',
    await confirm({ message: 'Confirm?' }, { clearPromptOnDone: true }),
  );
};

if (import.meta.url.startsWith('file:')) {
  const modulePath = url.fileURLToPath(import.meta.url);
  if (process.argv[1] === modulePath) {
    demo();
  }
}

export default demo;
