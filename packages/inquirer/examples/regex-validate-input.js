/**
 * Filter and validate progress example
 */

'use strict';
const inquirer = require('..');

/* eslint-disable no-promise-executor-return */
const questions = [
  {
    type: 'input',
    name: 'api_key',
    message: 'Please enter a valid API key.',
    validate(input) {
      return Promise.resolve().then(() => {
        if (!!input.match(/([a-f0-9]{40})/g)) {
          return true;
        } else throw "Please provide a valid API key.";
      });
    },
  },
];

inquirer.prompt(questions).then((answers) => {
  console.log(JSON.stringify(answers, null, '  '));
});
