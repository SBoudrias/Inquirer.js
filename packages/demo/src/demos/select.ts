import * as url from 'node:url';
import { select, Separator } from '@inquirer/prompts';
import colors from 'yoctocolors-cjs';

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

  answer = await select({
    message: 'Select a recipe',
    choices: [
      {
        name: `${colors.bold('Spaghetti Carbonara')}\n    Eggs, Pecorino Romano, Pancetta\n    30 minutes`,
        short: 'Spaghetti Carbonara',
        value: 'carbonara',
      },
      {
        name: `${colors.bold('Margherita Pizza')}\n    Tomatoes, Mozzarella, Basil\n    45 minutes`,
        short: 'Margherita Pizza',
        value: 'pizza',
      },
      {
        name: `${colors.bold('Caesar Salad')}\n    Romaine, Croutons, Parmesan\n    15 minutes`,
        short: 'Caesar Salad',
        value: 'salad',
      },
    ],
  });
  console.log('Answer:', answer);
};

if (import.meta.url.startsWith('file:')) {
  const modulePath = url.fileURLToPath(import.meta.url);
  if (process.argv[1] === modulePath) {
    await demo();
  }
}

export default demo;
