/**
 * Rx observable create example
 */

import inquirer from 'inquirer';
import { Observable } from 'rxjs';

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

type Q = typeof q1 | typeof q2 | typeof q3;

const answers = await inquirer.prompt(
  new Observable<Q>((observer) => {
    observer.next(q1);
    observer.next(q2);
    observer.next(q3);
    observer.complete();
  }),
);

console.log(JSON.stringify(answers, null, '  '));
