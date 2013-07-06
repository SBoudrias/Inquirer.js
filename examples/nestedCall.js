/**
 * Nested Inquirer call
 */

"use strict";
var inquirer = require("../lib/inquirer");

inquirer.prompt({
  type: "input",
  name: "candy",
  message: "What's your favorite candy?"
}, function( answers ) {
  inquirer.prompt({
    type: "input",
    name: "liquor",
    message: "And your favorite liquor?"
  });
});
