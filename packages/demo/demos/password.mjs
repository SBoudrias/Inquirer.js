import * as url from 'node:url';
import { password } from '@inquirer/prompts';

const demo = async () => {
  console.log(
    'Answer:',
    await password({
      message: 'Enter a silent password?',
    }),
  );

  console.log(
    'Answer:',
    await password({
      message: 'Enter a masked password?',
      mask: '*',
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
