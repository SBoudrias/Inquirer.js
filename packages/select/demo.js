const select = require('.');

(async () => {
  let answer;

  answer = await select({
    message: 'Select a package manager',
    choices: [
      { name: 'npm', value: 'npm' },
      { name: 'yarn', value: 'yarn' },
      { name: 'jspm', value: 'jspm', disabled: true }
    ]
  });
  console.log('Answer:', answer);

  answer = await select({
    message: 'Select your favorite letter',
    choices: [
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
      { value: 'Z' }
    ]
  });
  console.log('Answer:', answer);
})();
