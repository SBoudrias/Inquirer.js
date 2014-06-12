/**
 * List prompt example
 */

"use strict";
var inquirer = require("../lib/inquirer");

inquirer.prompt([
  {
    type: "list",
    name: "theme",
    message: "What do you want to do?",
    choices: [
      "Order a pizza",
      "Make a reservation",
      "Make a reservation",
      "Make a reservation",
      new inquirer.Separator(),
      "Ask opening hours",
      new inquirer.Separator(),
      "Ask opening hours",
      new inquirer.Separator(),
      "Ask opening hours",
      "Ask opening hours",
      "Ask opening hours",
      "Make a reservation",
      new inquirer.Separator(),
      "Ask opening hours",
      "Talk to the receptionnist",
      "Make a reservation",
      new inquirer.Separator(),
      "Ask opening hours",
      "Talk to the receptionnist",
      "Make a reservation",
      new inquirer.Separator(),
      "Ask opening hours",
      "Talk to the receptionnist",
      "Ask opening hours",
      "Make a reservation",
      new inquirer.Separator(),
      "Ask opening hours",
      "Talk to the receptionnist",
      "GTalk to the receptionnist"
    ]
  },
  {
    type: "list",
    name: "size",
    message: "What size do you need",
    choices: [ "Jumbo", "Large", "Standard", "Medium", "Small", "Micro" ],
    filter: function( val ) { return val.toLowerCase(); }
  }
], function( answers ) {
    console.log( JSON.stringify(answers, null, "  ") );
  });
