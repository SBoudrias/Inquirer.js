/**
 * Datetime prompt example
 */

'use strict';
var inquirer = require('..');

var questions = [
  {
    type: 'datetime',
    name: 'dt',
    message: 'When would you like a table?',
    date: {
      min: '1/1/2000'
    },
    time: {
      min: '5:00 PM',
      max: '10:00 PM',
      minutes: {
        interval: 15
      }
    }
  }
];

inquirer.prompt(questions).then(function (answers) {
  console.log(JSON.stringify(answers, null, '  '));
});
