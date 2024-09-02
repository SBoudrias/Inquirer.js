import inquirer from '../src/index.mjs';

/**
 * Editor prompt example
 */

inquirer
  .prompt([
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
    },
  ])
  .then((answers) => {
    console.log(JSON.stringify(answers, null, '  '));
  });
