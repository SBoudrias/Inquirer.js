/**
 * Password prompt example
 */

'use strict';
var inquirer = require('..');

inquirer.prompt([
  {
    type: 'password',
    message: 'Enter a password',
    name: 'password1'
  },
  {
    type: 'password',
    message: 'Enter a masked password',
    name: 'password2',
    mask: '*'
  }
]).then(function (answers) {
  console.log(JSON.stringify(answers, null, '  '));
});
