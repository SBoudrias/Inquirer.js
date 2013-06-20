/**
 * Checkbox list examples
 */

"use strict";
var inquirer = require("../lib/inquirer");

inquirer.prompt([
  {
    type: "checkbox",
    message: "Select toppings",
    name: "toppings",
    choices: [
      {
        name: "Peperonni"
      },
      {
        name: "Cheese"
      },
      {
        name: "Pineapple"
      },
      {
        name: "Mushroom"
      },
      {
        name: "Bacon"
      }
    ]
  }
], function( answers ) {
  console.log( JSON.stringify(answers, null, "  ") );
});
