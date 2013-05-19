/**
 * Pizza delivery prompt example
 * run example by writing `node pizza.js` in your console
 */

"use strict";
var inquirer = require("../lib/inquirer");

var questions = [
  {
    type: "confirm",
    name: "toBeDelivered",
    message: "Hi, welcome to Node Pizza plaza. \r\n" +
        "Is it for a delivery?"
  },
  {
    type: "input",
    name: "phone",
    message: "What's your phone number?"
  },
  {
    type: "list",
    name: "size",
    message: "What size do you need?",
    choices: [ "large", "medium", "small" ]
  },
  {
    type: "list",
    name: "toppings",
    message: "What about the toping?",
    choices: [
      {
        name: "Peperonni and chesse",
        value: "PeperonniChesse"
      },
      {
        name: "All dressed",
        value: "alldressed"
      },
      {
        name: "Hawaïan",
        value: "hawain"
      }
    ]
  },
  {
    type: "rawlist",
    name: "liquor",
    message: "You also get a free 2L liquor! Which one?",
    choices: [ "Pepsi", "7up", "Coke" ]
  },
  {
    type: "input",
    name: "comments",
    message: "Before leaving, any comments on your purchase experience?",
    default: "Nope, all good!"
  }
];

inquirer.prompt(questions, function(answers) {
  console.log();
  console.log("Order receipt:");
  console.log(JSON.stringify(answers, null, "  "));
});
