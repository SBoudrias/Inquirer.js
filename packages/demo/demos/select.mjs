import * as url from 'node:url';
import { select, Separator } from '@inquirer/prompts';

const alphabet = [
  { value: 'A' },
  { value: 'B' },
  { value: 'C' },
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
  { value: 'O', description: 'Letter O, not number 0' },
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
];

const demo = async () => {
  let answer;

  answer = await select({
    message: 'Select a package manager',
    choices: [
      {
        name: 'npm',
        value: 'npm',
        description: 'npm is the most popular package manager',
      },
      { name: 'yarn', value: 'yarn', description: 'yarn is an awesome package manager' },
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

  answer = await select({
    message: 'Select your favorite letter',
    choices: [
      new Separator('== Alphabet (choices cycle as you scroll through) =='),
      ...alphabet,
    ],
  });
  console.log('Answer:', answer);

  answer = await select({
    message: 'Select your favorite letter (example without loop)',
    choices: [
      new Separator('== Alphabet (choices cycle as you scroll through) =='),
      ...alphabet,
    ],
    loop: false,
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
