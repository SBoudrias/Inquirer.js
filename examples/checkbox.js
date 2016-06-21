/**
 * Checkbox list examples
 */
"use strict";
var separator_1 = require('../lib/objects/separator');
var inquirer = require('..');
inquirer.prompt([
    {
        type: 'checkbox',
        message: 'Select toppings',
        name: 'toppings',
        choices: [
            new separator_1.Separator(' = The Meats = '),
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
            new separator_1.Separator(' = The Cheeses = '),
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
            new separator_1.Separator(' = The usual ='),
            {
                name: 'Mushroom'
            },
            {
                name: 'Tomato'
            },
            new separator_1.Separator(' = The extras = '),
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
//# sourceMappingURL=checkbox.js.map