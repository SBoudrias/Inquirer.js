/**
 * List prompt example
 */

import inquirer from 'inquirer';

const answers = await inquirer.prompt<{ theme: string; size: string }>([
  {
    type: 'list',
    name: 'theme',
    message: 'What do you want to do?',
    choices: [
      { name: 'Order a pizza', value: 'order' },
      { name: 'Make a reservation', value: 'reservation' },
      new inquirer.Separator(),
      { name: 'Ask for opening hours', value: 'hours' },
      { name: 'Contact support', value: 'support', disabled: true },
      { name: 'Talk to the receptionist', value: 'receptionist' },
    ],
  },
  {
    type: 'list',
    name: 'size',
    message: 'What size do you need?',
    choices: [
      { name: 'Jumbo', value: 'Jumbo' },
      { name: 'Large', value: 'Large' },
      { name: 'Standard', value: 'Standard' },
      { name: 'Medium', value: 'Medium' },
      { name: 'Small', value: 'Small' },
      { name: 'Micro', value: 'Micro' },
    ],
    filter(val: string) {
      return val.toLowerCase();
    },
  },
]);

console.log(JSON.stringify(answers, null, '  '));
