import { from } from 'rxjs';
import inquirer from '../dist/esm/index.js';

const questions = [
  {
    type: 'input',
    name: 'first_name',
    message: "What's your first name",
  },
  {
    type: 'input',
    name: 'last_name',
    message: "What's your last name",
    default() {
      return 'Doe';
    },
  },
  {
    type: 'input',
    name: 'phone',
    message: "What's your phone number",
    validate(value) {
      const pass = value.match(
        /^([01])?[\s.-]?\(?(\d{3})\)?[\s.-]?(\d{3})[\s.-]?(\d{4})\s?((?:#|ext\.?\s?|x\.?\s?)(?:\d+)?)?$/i,
      );
      if (pass) {
        return true;
      }

      return 'Please enter a valid phone number';
    },
  },
];

const observable = from(questions);

inquirer.prompt(observable).ui.process.subscribe(
  (ans) => {
    console.log('Answer is:', ans);
  },
  (err) => {
    console.log('Error:', err);
  },
  () => {
    console.log('Completed');
  },
);
