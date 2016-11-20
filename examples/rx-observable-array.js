var inquirer = require('..');
var Rx = require('rx');

var questions = [
  {
    type: 'input',
    name: 'first_name',
    message: 'What\'s your first name'
  },
  {
    type: 'input',
    name: 'last_name',
    message: 'What\'s your last name',
    default: function () {
      return 'Doe';
    }
  },
  {
    type: 'input',
    name: 'phone',
    message: 'What\'s your phone number',
    validate: function (value) {
      var pass = value.match(/^([01]{1})?[-.\s]?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})\s?((?:#|ext\.?\s?|x\.?\s?){1}(?:\d+)?)?$/i);
      if (pass) {
        return true;
      }

      return 'Please enter a valid phone number';
    }
  }
];

var observable = Rx.Observable.fromArray(questions);

inquirer.prompt(observable).ui.process.subscribe(
  function (ans) {
    console.log('Answer is: ', ans);
  },
  function (err) {
    console.log('Error: ', err);
  },
  function () {
    console.log('Completed');
  }
);
