/**
 * When example
 */

import inquirer from 'inquirer';

const answers = await inquirer.prompt([
  {
    type: 'confirm',
    name: 'bacon',
    message: 'Do you like bacon?',
  },
  {
    type: 'input',
    name: 'favorite',
    message: 'Bacon lover, what is your favorite type of bacon?',
    when(answers) {
      return Boolean(answers.bacon);
    },
  },
  {
    type: 'confirm',
    name: 'pizza',
    message: 'Ok... Do you like pizza?',
    when(answers) {
      return !answers.bacon;
    },
  },
  {
    type: 'input',
    name: 'favorite',
    message: 'Whew! What is your favorite type of pizza?',
    when(answers) {
      return Boolean(answers.pizza);
    },
  },
]);

console.log(JSON.stringify(answers, null, '  '));
