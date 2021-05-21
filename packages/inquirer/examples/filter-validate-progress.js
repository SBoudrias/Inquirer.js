/**
 * Filter and validate progress example
 */

'use strict';
const inquirer = require('..');

/* eslint-disable no-promise-executor-return */

const questions = [
  {
    type: 'input',
    name: 'first_question',
    message: 'Question with filtering and validating text',
    validate: async () => {
      await new Promise((r) => setTimeout(r, 3000));
      return true;
    },
    filter: async (answer) => {
      await new Promise((r) => setTimeout(r, 3000));
      return `filtered${answer}`;
    },
    filteringText: 'Filtering your answer...',
    validatingText: 'Validating what you wrote...',
  },
  {
    type: 'input',
    name: 'second_question',
    message: 'Question without filtering and validating text',
    validate: async () => {
      await new Promise((r) => setTimeout(r, 3000));
      return true;
    },
    filter: async (answer) => {
      await new Promise((r) => setTimeout(r, 3000));
      return `filtered${answer}`;
    },
  },
];

inquirer.prompt(questions).then((answers) => {
  console.log(JSON.stringify(answers, null, '  '));
});
