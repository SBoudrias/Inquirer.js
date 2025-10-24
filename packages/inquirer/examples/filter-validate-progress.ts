/**
 * Filter and validate progress example
 */

import inquirer, { type DistinctQuestion } from 'inquirer';

const answers = await inquirer.prompt([
  {
    type: 'input',
    name: 'first_question',
    message: 'Question with filtering and validating text',
    async validate() {
      await new Promise((r) => setTimeout(r, 3000));
      return true;
    },
    async filter(answer: string) {
      await new Promise((r) => setTimeout(r, 3000));
      return `filtered${answer}`;
    },
  },
  {
    type: 'input',
    name: 'second_question',
    message: 'Question without filtering and validating text',
    async validate() {
      await new Promise((r) => setTimeout(r, 3000));
      return true;
    },
    async filter(answer: string) {
      await new Promise((r) => setTimeout(r, 3000));
      return `filtered${answer}`;
    },
  },
] satisfies DistinctQuestion[]);

console.log(JSON.stringify(answers, null, '  '));
