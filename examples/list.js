/**
 * List prompt example
 */

"use strict";
var inquirer = require("../lib/inquirer");

inquirer.prompt({
  type: "list",
  name: "size",
  message: "What size do you need",
  choices: [ "Jumbo", "Large", "Standard", "Medium", "Small", "Micro" ],
  filter: function( val ) { return val.toLowerCase(); }
}, function( answers ) {
  console.log( JSON.stringify(answers, null, "  ") );
});
