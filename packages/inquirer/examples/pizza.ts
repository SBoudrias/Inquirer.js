/**
 * Pizza delivery prompt example
 * run example by writing `node pizza.mjs` in your console
 */

import inquirer from 'inquirer';

console.log('Hi, welcome to Node Pizza');

const answers = await inquirer.prompt<{
  toBeDelivered: boolean;
  phone: string;
  size: string;
  quantity: number;
  toppings: string;
  beverage: string;
  comments: string;
  prize?: string;
}>([
  {
    type: 'confirm',
    name: 'toBeDelivered',
    message: 'Is this for delivery?',
    default: false,
    transformer: (answer: boolean) => (answer ? '👍' : '👎'),
  },
  {
    type: 'input',
    name: 'phone',
    message: "What's your phone number?",
    validate(value: string) {
      const pass = value.match(
        /^([01])?[\s.-]?\(?(\d{3})\)?[\s.-]?(\d{3})[\s.-]?(\d{4})\s?((?:#|ext\.?\s?|x\.?\s?)(?:\d+)?)?$/i,
      );
      if (pass) {
        return true;
      }

      return 'Please enter a valid phone number';
    },
  },
  {
    type: 'list',
    name: 'size',
    message: 'What size do you need?',
    choices: ['Large', 'Medium', 'Small'],
    filter(val: string) {
      return val.toLowerCase();
    },
  },
  {
    type: 'input',
    name: 'quantity',
    message: 'How many do you need?',
    validate(value: string) {
      const valid = !Number.isNaN(Number.parseFloat(value));
      return valid || 'Please enter a number';
    },
    filter: Number,
  },
  {
    type: 'expand',
    name: 'toppings',
    message: 'What about the toppings?',
    choices: [
      {
        key: 'p',
        name: 'Pepperoni and cheese',
        value: 'PepperoniCheese',
      },
      {
        key: 'a',
        name: 'All dressed',
        value: 'alldressed',
      },
      {
        key: 'w',
        name: 'Hawaiian',
        value: 'hawaiian',
      },
    ],
  },
  {
    type: 'rawlist',
    name: 'beverage',
    message: 'You also get a free 2L beverage',
    choices: ['Pepsi', '7up', 'Coke'],
  },
  {
    type: 'input',
    name: 'comments',
    message: 'Any comments on your purchase experience?',
    default: 'Nope, all good!',
  },
  {
    type: 'list',
    name: 'prize',
    message: 'For leaving a comment, you get a freebie',
    choices: ['cake', 'fries'],
    when(answers: { comments?: string }) {
      return answers.comments !== 'Nope, all good!';
    },
  },
]);

console.log('\nOrder receipt:');
console.log(JSON.stringify(answers, null, '  '));
