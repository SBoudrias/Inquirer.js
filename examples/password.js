/**
 * Password prompt example
 */

'use strict';
var inquirer = require('..');

inquirer.prompt([
  {
    type: 'password',
    message: 'Enter "Passw0rd"',
    name: 'password3',
    validate: function (input) {
      if (input !== 'Passw0rd') {
        return 'invalid password';
      }

      return true;
    }
  },
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
