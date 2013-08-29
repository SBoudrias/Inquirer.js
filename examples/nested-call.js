/**
 * Nested Inquirer call
 */

"use strict";
var inquirer = require("../lib/inquirer");

inquirer.prompt({
  type: "list",
  name: "chocolate",
  message: "What's your favorite chocolate?",
  choices: [ "Mars", "Oh Henry", "Hershey" ]
}, function( answers ) {
  inquirer.prompt({
    type: "list",
    name: "liquor",
    message: "And your favorite liquor?",
    choices: [ "Pepsi", "Coke", "7up", "Mountain Dew", "Red bull" ]
  });
});
