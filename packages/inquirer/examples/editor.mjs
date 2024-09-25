/**
 * Editor prompt example
 */

import inquirer from '../dist/esm/index.js';

const questions = [
  {
    type: 'editor',
    name: 'bio',
    message: 'Please write a short bio of at least 3 lines.',
    validate(text) {
      if (text.split('\n').length < 3) {
        return 'Must be at least 3 lines.';
      }

      return true;
    },
    waitUserInput: true,
  },
  {
    type: 'editor',
    name: 'edition',
    message: 'Edit the following content.',
    default: 'Hello, World!',
    waitUserInput: false,
  },
];

inquirer.prompt(questions).then((answers) => {
  console.log(JSON.stringify(answers, null, '  '));
});
