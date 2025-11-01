/**
 * When prompt example
 */

import inquirer from 'inquirer';

const answers = await inquirer.prompt([
  {
    type: 'confirm',
    name: 'toBeDelivered',
    message: 'Is this for delivery?',
  },
  {
    type: 'input',
    name: 'phone',
    message: "What's your phone number",
    when(answers: Record<string, unknown>) {
      return answers['toBeDelivered'] === true;
    },
  },
  {
    type: 'confirm',
    name: 'pizza',
    message: 'Do you like pizza?',
  },
  {
    type: 'input',
    name: 'fav',
    message: 'What is your favorite flavour?',
    when(answers: Record<string, unknown>) {
      return answers['pizza'] === true;
    },
  },
]);

console.log(JSON.stringify(answers, null, '  '));
