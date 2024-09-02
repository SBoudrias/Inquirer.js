import inquirer from '../src/index.mjs';

/**
 * Checkbox list examples
 */
inquirer
  .prompt([
    {
      type: 'checkbox',
      message: 'Select toppings',
      name: 'toppings',
      choices: [
        new inquirer.Separator(' = The Meats = '),
        {
          value: 'Pepperoni',
        },
        {
          value: 'Ham',
        },
        {
          value: 'Ground Meat',
        },
        {
          value: 'Bacon',
        },
        new inquirer.Separator(' = The Cheeses = '),
        {
          value: 'Mozzarella',
          checked: true,
        },
        {
          value: 'Cheddar',
        },
        {
          value: 'Parmesan',
        },
        new inquirer.Separator(' = The usual ='),
        {
          value: 'Mushroom',
        },
        {
          value: 'Tomato',
        },
        new inquirer.Separator(' = The extras = '),
        {
          value: 'Pineapple',
        },
        {
          value: 'Olives',
          disabled: 'out of stock',
        },
        {
          value: 'Extra cheese',
        },
      ],
      validate(answer) {
        if (answer.length === 0) {
          return 'You must choose at least one topping.';
        }

        return true;
      },
    },
  ])
  .then((answers) => {
    console.log(JSON.stringify(answers, null, '  '));
  });
