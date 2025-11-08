/**
 * Rx observable array example
 */

import inquirer from 'inquirer';
import { of } from 'rxjs';

const q1 = {
  type: 'input',
  name: 'first_name',
  message: "What's your first name",
} as const;
const q2 = {
  type: 'input',
  name: 'last_name',
  message: "What's your last name",
} as const;
const q3 = {
  type: 'input',
  name: 'phone',
  message: "What's your phone number",
} as const;

inquirer.prompt(of(q1, q2, q3)).ui.process.subscribe({
  next: (ans: unknown) => {
    console.log('Answer is:', ans);
  },
  error: (err: unknown) => {
    console.log('Error:', err);
  },
  complete: () => {
    console.log('Completed');
  },
});
