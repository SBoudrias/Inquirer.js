/**
 * Editor prompt example
 */

'use strict';
var inquirer = require('..');

var questions = [
  {
    type: 'editor',
    name: 'bio',
    message: 'Please write a short bio',
    default: function () {
      return 'I am a very HAPPY HAPPY person.\n\nAlso, sometimes I go a long walks.';
    }
  }
];

inquirer.prompt(questions).then(function (answers) {
  console.log(JSON.stringify(answers, null, '  '));
});
