/**
 * Expand list examples
 */

"use strict";
var inquirer = require("../lib/inquirer");

inquirer.prompt([
  {
    type: "expand",
    message: "Conflict on `file.js`: ",
    name: "overwrite",
    choices: [
      {
        key: "y",
        name: "Overwrite",
        value: "overwrite"
      },
      {
        key: "a",
        name: "Overwrite this one and all next",
        value: "overwrite_all"
      },
      {
        key: "d",
        name: "Show diff",
        value: "diff"
      },
      new inquirer.Separator(),
      {
        key: "x",
        name: "Abort",
        value: "abort"
      }
    ]
  }
], function( answers ) {
  console.log( JSON.stringify(answers, null, "  ") );
});
