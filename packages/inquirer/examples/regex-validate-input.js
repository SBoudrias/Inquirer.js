/**
 * Filter and validate progress example
 */

'use strict';
const inquirer = require('..');

const questions = [
  {
    type: 'input',
    name: 'api_key',
    message: 'Please enter a valid API key.',
    validate(input) {
      if (/([a-f0-9]{40})/g.test(input)) {
        return true;
      }

      throw Error('Please provide a valid API key secret.');
    },
  },
];

inquirer.prompt(questions).then((answers) => {
  console.log(JSON.stringify(answers, null, '  '));
});
