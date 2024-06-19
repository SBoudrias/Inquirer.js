import * as url from 'node:url';
import { createPrompt, useKeypress, usePrefix, isEnterKey } from '@inquirer/core';

const loader = createPrompt((config, done) => {
  const prefix = usePrefix({ isLoading: true });

  useKeypress((key) => {
    if (isEnterKey(key)) {
      done();
    }
  });

  return `${prefix} Press enter to exit`;
});

const demo = async () => {
  await loader();
};

if (import.meta.url.startsWith('file:')) {
  const modulePath = url.fileURLToPath(import.meta.url);
  if (process.argv[1] === modulePath) {
    demo();
  }
}

export default demo;
