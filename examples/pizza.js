/**
 * Pizza delivery prompt example
 * run example by writing `node pizza.js` in your console
 */

"use strict";
var inquirer = require("../lib/inquirer");

console.log("Hi, welcome to Node Pizza");

var questions = [
  {
    type: "confirm",
    name: "toBeDelivered",
    message: "Is it for a delivery",
    default: false
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
  },
  {
    type: "list",
    name: "size",
    message: "What size do you need",
    choices: [ "Large", "Medium", "Small" ],
    filter: function( val ) { return val.toLowerCase(); }
  },
  {
    type: "input",
    name: "quantity",
    message: "How many do you need",
    validate: function( value ) {
      var valid = !isNaN(parseFloat(value));
      return valid || "Please enter a number";
    },
    filter: Number
  },
  {
    type: "expand",
    name: "toppings",
    message: "What about the toping",
    choices: [
      {
        key: "p",
        name: "Peperonni and chesse",
        value: "PeperonniChesse"
      },
      {
        key: "a",
        name: "All dressed",
        value: "alldressed"
      },
      {
        key: "w",
        name: "Hawaïan",
        value: "hawaian"
      }
    ]
  },
  {
    type: "rawlist",
    name: "liquor",
    message: "You also get a free 2L liquor",
    choices: [ "Pepsi", "7up", "Coke" ]
  },
  {
    type: "input",
    name: "comments",
    message: "Any comments on your purchase experience",
    default: "Nope, all good!"
  },
  {
    type: "list",
    name: "prize",
    message: "For leaving a comments, you get a freebie",
    choices: [ "cake", "fries" ],
    when: function( answers ) {
      return answers.comments !== "Nope, all good!";
    }
  }
];

inquirer.prompt( questions, function( answers ) {
  console.log("\nOrder receipt:");
  console.log( JSON.stringify(answers, null, "  ") );
});
