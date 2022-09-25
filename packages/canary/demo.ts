import inquirer from './src/index.js';

const answers = await inquirer.prompt([
  {
    type: 'input',
    name: 'first_name',
    message: "What's your first name",
  },
  {
    type: 'select',
    name: 'ask_last_name',
    message: 'Are you willing to share your last name',
    choices: [
      { value: '1', name: 'Yes' },
      { value: '', name: 'No' },
    ],
  },
  {
    type: 'input',
    name: 'last_name',
    when: (answers) => Boolean(answers.ask_last_name),
    message: "What's your last name",
  },
  {
    type: 'input',
    name: 'phone',
    message: "What's your phone number?",
    filter(answer: string): string {
      // TODO: What's the multi match flag again?
      return answer.replace(/[^\d]+/, '');
    },
  },
]);

console.log(answers);
