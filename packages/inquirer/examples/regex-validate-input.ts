/**
 * Filter and validate progress example
 */

import inquirer from 'inquirer';

const answers = await inquirer.prompt([
  {
    type: 'input',
    name: 'api_key',
    message: 'Please enter a valid API key.',
    validate(input: string) {
      if (/([\da-f]{40})/g.test(input)) {
        return true;
      }

      throw new Error('Please provide a valid API key secret.');
    },
  },
]);

console.log(JSON.stringify(answers, null, '  '));
