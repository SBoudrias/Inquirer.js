/**
 * Filter and validate progress example
 */

import inquirer from 'inquirer';

const answers = await inquirer.prompt([
  {
    type: 'input',
    name: 'name',
    message: 'Enter your name',
    transformer(input: string, { isFinal }: { isFinal: boolean }) {
      if (isFinal) {
        return input + '!';
      }
      return input;
    },
  },
  {
    type: 'input',
    name: 'age',
    message: 'Enter your age',
  },
]);

console.log(JSON.stringify(answers, null, '  '));
