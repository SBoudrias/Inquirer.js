import * as url from 'node:url';
import { checkbox, Separator } from '@inquirer/prompts';

const demo = async () => {
  let answer;

  answer = await checkbox({
    message: 'Select a package manager',
    choices: [
      { name: 'npm', value: 'npm' },
      { name: 'yarn', value: 'yarn' },
      new Separator(),
      { name: 'jspm', value: 'jspm', disabled: true },
      {
        name: 'pnpm',
        value: 'pnpm',
        disabled: '(pnpm is not available)',
      },
    ],
  });
  console.log('Answer:', answer);

  answer = await checkbox({
    message: 'Select your favorite letters',
    choices: [
      new Separator('== Alphabet (choices cycle as you scroll through) =='),
      { value: 'A', checked: true },
      { value: 'B' },
      { value: 'C', checked: true },
      { value: 'D' },
      { value: 'E' },
      { value: 'F' },
      { value: 'G' },
      { value: 'H' },
      { value: 'I' },
      { value: 'J' },
      { value: 'K' },
      { value: 'L' },
      { value: 'M' },
      { value: 'N' },
      { value: 'O' },
      { value: 'P' },
      { value: 'Q' },
      { value: 'R' },
      { value: 'S' },
      { value: 'T' },
      { value: 'U' },
      { value: 'V' },
      { value: 'W' },
      { value: 'X' },
      { value: 'Y' },
      { value: 'Z' },
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
