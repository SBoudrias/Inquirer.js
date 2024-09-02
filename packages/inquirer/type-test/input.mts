import inquirer from '../src/index.mjs';

/**
 * Input prompt example
 */
inquirer
  .prompt([
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
      name: 'fav_color',
      message: "What's your favorite color",
      transformer(color, flags) {
        if (flags.isFinal) {
          return color + '!';
        }

        return color;
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
  ])
  .then((answers) => {
    console.log(JSON.stringify(answers, null, '  '));
  });
