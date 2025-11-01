/**
 * Recursive prompt example
 * Allows user to choose when to exit prompt
 */

import inquirer from 'inquirer';

function ask() {
  return inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Enter a name',
    },
    {
      type: 'confirm',
      name: 'askAgain',
      message: 'Enter another name?',
    },
  ]);
}

const answers = await ask();
console.log(JSON.stringify(answers, null, '  '));
