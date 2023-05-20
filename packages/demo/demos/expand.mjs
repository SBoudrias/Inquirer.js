import * as url from 'node:url';
import { expand } from '@inquirer/prompts';

const demo = async () => {
  let answer;

  answer = await expand({
    message: 'Conflict on `file.js`:',
    choices: [
      {
        key: 'y',
        name: 'Overwrite',
        value: 'overwrite',
      },
      {
        key: 'a',
        name: 'Overwrite this one and all next',
        value: 'overwrite_all',
      },
      {
        key: 'd',
        name: 'Show diff',
        value: 'diff',
      },
      {
        key: 'x',
        name: 'Abort',
        value: 'abort',
      },
    ],
  });
  console.log('Answer:', answer);

  answer = await expand({
    message: '(With default) Conflict on `file.js`:',
    default: 'y',
    choices: [
      {
        key: 'y',
        name: 'Overwrite',
        value: 'overwrite',
      },
      {
        key: 'a',
        name: 'Overwrite this one and all next',
        value: 'overwrite_all',
      },
      {
        key: 'd',
        name: 'Show diff',
        value: 'diff',
      },
      {
        key: 'x',
        name: 'Abort',
        value: 'abort',
      },
    ],
  });
  console.log('Answer:', answer);

  answer = await expand({
    expanded: true,
    message: '(Auto-expand) Conflict on `file.js`:',
    choices: [
      {
        key: 'y',
        name: 'Overwrite',
        value: 'overwrite',
      },
      {
        key: 'a',
        name: 'Overwrite this one and all next',
        value: 'overwrite_all',
      },
      {
        key: 'd',
        name: 'Show diff',
        value: 'diff',
      },
      {
        key: 'x',
        name: 'Abort',
        value: 'abort',
      },
    ],
  });
  console.log('Answer:', answer);
};

if (import.meta.url.startsWith('file:')) {
  const modulePath = url.fileURLToPath(import.meta.url);
  if (process.argv[1] === modulePath) {
    demo();
  }
}

export default demo;
