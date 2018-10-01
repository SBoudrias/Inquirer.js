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
})();
