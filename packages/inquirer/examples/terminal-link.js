/**
 * A terminal-link example. We expect no odd line breaks.
 * Note: you will need a compatible terminal to see the rendered links. https://gist.github.com/egmontkob/eb114294efbcd5adb1944c9f3cb5feda
 * For screenshots of the expected behavior, see https://github.com/SBoudrias/Inquirer.js/pull/1106
 */

'use strict';
const inquirer = require('..');
const terminalLink = require('terminal-link');

inquirer
  .prompt([
    {
      type: 'list',
      name: 'size',
      message: 'What size do you need?',
      choices: [
        'Jumbo',
        'Large',
        'Standard',
        'Medium',
        'Small',
        'Micro which is truly and surely the ' +
          terminalLink(
            'very very very very very very smallest',
            'https://www.google.com/search?q=very+very+very+very+very+very+very+very+very+very+long'
          ),
      ],
      filter(val) {
        return val.toLowerCase();
      },
    },
  ])
  .then((answers) => {
    console.log(JSON.stringify(answers, null, '  '));
  });
