/**
 * Filter and validate progress example
 */

import inquirer from '../dist/esm/index.js';

const questions = [
  {
    type: 'input',
    name: 'api_key',
    message: 'Please enter a valid API key.',
    validate(input) {
      if (/([\da-f]{40})/g.test(input)) {
        return true;
      }

      throw new Error('Please provide a valid API key secret.');
    },
  },
];

inquirer.prompt(questions).then((answers) => {
  console.log(JSON.stringify(answers, null, '  '));
});
