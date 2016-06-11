/**
 * Password prompt example
 */

'use strict';
var inquirer = require('..');

inquirer.prompt([
  {
    type: 'password',
    message: 'Enter your git password',
    name: 'password'
  }
]).then(function (answers) {
  console.log(JSON.stringify(answers, null, '  '));
});
