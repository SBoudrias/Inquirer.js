/**
 * Password prompt example
 */

"use strict";
var inquirer = require("../lib/inquirer");

inquirer.prompt([
  {
    type: "password",
    message: "Enter your git password",
    name: "password"
  },
  {
    type: "password-hidden",
    message: "Enter your git password again",
    name: "password"
  }
], function( answers ) {
  console.log( JSON.stringify(answers, null, "  ") );
});
