/**
 * Input prompt example
 */

"use strict";
var inquirer = require("../lib/inquirer");

var questions = [
  {
    type: "input",
    name: "first_name",
    message: "What's your first name"
  },
  {
    type: "input",
    name: "last_name",
    message: "What's your last name"
  },
  {
    type: "input",
    name: "phone",
    message: "What's your phone number",
    validate: function( value ) {
      var pass = value.match(/^([01]{1})?[\-\.\s]?\(?(\d{3})\)?[\-\.\s]?(\d{3})[\-\.\s]?(\d{4})\s?((?:#|ext\.?\s?|x\.?\s?){1}(?:\d+)?)?$/i);
      if (pass) {
        return true;
      } else {
        return "Please enter a valid phone number";
      }
    }
  }
];

inquirer.prompt( questions, function( answers ) {
  console.log( JSON.stringify(answers, null, "  ") );
});
