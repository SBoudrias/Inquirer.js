/**
 * Checkbox list examples
 */

'use strict';
var inquirer = require('..');

inquirer.prompt([
  {
    type: 'orderedCheckbox',
    message: 'Select toppings',
    name: 'toppings',
    choices: [
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
