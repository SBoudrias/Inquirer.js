const select = require('.');

(async () => {
  let answer;

  answer = await select({
    message: 'Select a package manager',
    choices: [{ name: 'npm', value: 'npm' }, { name: 'Yarn', value: 'yarn' }]
  });
  console.log('Answer:', answer);
})();
