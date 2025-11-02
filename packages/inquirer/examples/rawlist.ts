/**
 * Raw List prompt example
 */

import inquirer from 'inquirer';

const answers = await inquirer.prompt<{ theme: string; size: string }>([
  {
    type: 'rawlist',
    name: 'theme',
    message: 'What do you want to do?',
    choices: [
      'Order a pizza',
      'Make a reservation',
      new inquirer.Separator(),
      'Ask opening hours',
      'Talk to the receptionist',
    ],
  },
  {
    type: 'rawlist',
    name: 'size',
    message: 'What size do you need',
    choices: ['Jumbo', 'Large', 'Standard', 'Medium', 'Small', 'Micro'],
    filter(val: string) {
      return val.toLowerCase();
    },
  },
]);

console.log(JSON.stringify(answers, null, '  '));
