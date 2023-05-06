import checkbox from './src/index.mjs';

(async () => {
  let answer;

  answer = await checkbox({
    message: 'Select a package manager',
    choices: [
      { name: 'npm', value: 'npm' },
      { name: 'yarn', value: 'yarn' },
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
})();
