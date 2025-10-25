/**
 * Editor prompt example
 */

import inquirer, { type DistinctQuestion } from 'inquirer';

const answers = await inquirer.prompt([
  {
    type: 'editor',
    name: 'bio',
    message: 'Please write a short bio of at least 3 lines.',
    validate(text: string) {
      if (text.split('\n').length < 3) {
        return 'Must be at least 3 lines.';
      }

      return true;
    },
    waitForUserInput: true,
  },
  {
    type: 'editor',
    name: 'edition',
    message: 'Edit the following content.',
    default: 'Hello, World!',
    waitForUserInput: false,
  },
] satisfies DistinctQuestion[]);

console.log(JSON.stringify(answers, null, '  '));
