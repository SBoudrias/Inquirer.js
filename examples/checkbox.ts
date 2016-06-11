/**
 * Checkbox list examples
 */

import {Separator} from '../lib/objects/separator';
import inquirer = require('..');

inquirer.prompt([
  {
    type: 'checkbox',
    message: 'Select toppings',
    name: 'toppings',
    choices: [
      new Separator(' = The Meats = '),
      {
        name: 'Pepperoni'
      },
      {
        name: 'Ham'
      },
      {
        name: 'Ground Meat'
      },
      {
        name: 'Bacon'
      },
      new Separator(' = The Cheeses = '),
      {
        name: 'Mozzarella',
        checked: true
      },
      {
        name: 'Cheddar'
      },
      {
        name: 'Parmesan'
      },
      new Separator(' = The usual ='),
      {
        name: 'Mushroom'
      },
      {
        name: 'Tomato'
      },
      new Separator(' = The extras = '),
      {
        name: 'Pineapple'
      },
      {
        name: 'Olives',
        disabled: 'out of stock'
      },
      {
        name: 'Extra cheese'
      }
    ],
    validate: function (answer) {
      if (answer.length < 1) {
        return 'You must choose at least one topping.';
      }
      return true;
    }
  }
]).then(function (answers) {
  console.log(JSON.stringify(answers, null, '  '));
});
