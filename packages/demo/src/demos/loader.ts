import * as url from 'node:url';
import { createPrompt, useKeypress, usePrefix, isEnterKey } from '@inquirer/core';

const loader = createPrompt((_config, done: (value: void) => void) => {
  const prefix = usePrefix({ status: 'loading' });

  useKeypress((key) => {
    if (isEnterKey(key)) {
      done();
    }
  });

  return `${prefix} Press enter to exit`;
});

const demo = async () => {
  await loader({}, { clearPromptOnDone: true });
};

if (import.meta.url.startsWith('file:')) {
  const modulePath = url.fileURLToPath(import.meta.url);
  if (process.argv[1] === modulePath) {
    await demo();
  }
}

export default demo;
