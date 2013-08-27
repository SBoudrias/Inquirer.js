/**
 * Paginated list
 */

"use strict";
var inquirer = require("../lib/inquirer");

var choices = Array.apply(0, new Array(26)).map(function(x,y) {
  return String.fromCharCode(y + 65);
});
choices.push("Multiline option \n  super cool feature");

inquirer.prompt([
  {
    type      : "list",
    name      : "letter",
    message   : "What's your favorite letter?",
    paginated : true,
    choices   : choices
  },
  {
    type      : "checkbox",
    name      : "name",
    message   : "Select the letter contained in your name:",
    paginated : true,
    choices   : choices
  }
], function( answers ) {
  console.log( JSON.stringify(answers, null, "  ") );
});
