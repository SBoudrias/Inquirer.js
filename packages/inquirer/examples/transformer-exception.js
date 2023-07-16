import inquirer from '../lib/inquirer.js';
(async () => {
  try {
    await inquirer.prompt([
      {
        type: 'input',
        message: 'Foo quotient',
        name: 'foo',
        transformer: (x) => {
          if (x === 1) {
            throw new Error('failing because of the reason');
          }
          return x;
        },
        default: 1,
      },
    ]);

    console.log('Done');
  } catch (e) {
    console.error('An _expected_ error', e);
  }
})();
