/**
 * Password prompt example
 */

import inquirer from 'inquirer';

const requireLetterAndNumber = (value: string) => {
  if (/\w/.test(value) && /\d/.test(value)) {
    return true;
  }

  return 'Password need to have at least a letter and a number';
};

const answers = await inquirer.prompt([
  {
    type: 'password',
    message: 'Enter a password',
    name: 'password1',
    validate: requireLetterAndNumber,
  },
  {
    type: 'password',
    message: 'Enter a masked password',
    name: 'password2',
    mask: '*',
    validate: requireLetterAndNumber,
  },
]);

console.log(JSON.stringify(answers, null, '  '));
