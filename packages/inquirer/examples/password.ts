/**
 * Password prompt example
 */

import inquirer from 'inquirer';

const answers = await inquirer.prompt([
  {
    type: 'password',
    name: 'pass',
    message: 'Enter a password',
  },
  {
    type: 'password',
    name: 'passConfirm',
    message: 'Confirm password',
  },
]);

console.log(JSON.stringify(answers, null, '  '));
