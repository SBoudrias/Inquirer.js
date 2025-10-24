/**
 * Checkbox list examples
 */

import inquirer, { type DistinctQuestion } from 'inquirer';

const answers = await inquirer.prompt([
  {
    type: 'checkbox',
    message: 'Select toppings',
    name: 'toppings',
    choices: [
      new inquirer.Separator(' = The Meats = '),
      { name: 'Pepperoni', value: 'pepperoni' },
      { name: 'Ham', value: 'ham' },
      { name: 'Ground Meat', value: 'ground_meat' },
      { name: 'Bacon', value: 'bacon' },
      new inquirer.Separator(' = The Cheeses = '),
      { name: 'Mozzarella', value: 'mozzarella', checked: true },
      { name: 'Cheddar', value: 'cheddar' },
      { name: 'Parmesan', value: 'parmesan' },
      new inquirer.Separator(' = The usual ='),
      { name: 'Mushroom', value: 'mushroom' },
      { name: 'Tomato', value: 'tomato' },
      new inquirer.Separator(' = The extras = '),
      { name: 'Pineapple', value: 'pineapple' },
      { name: 'Olives', value: 'olives', disabled: true },
      { name: 'Extra cheese', value: 'extra_cheese' },
    ],
    validate(answer) {
      if (answer.length === 0) {
        return 'You must choose at least one topping.';
      }

      return true;
    },
  },
] satisfies DistinctQuestion[]);

console.log(JSON.stringify(answers, null, '  '));
