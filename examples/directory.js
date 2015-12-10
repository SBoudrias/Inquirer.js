/**
 * List prompt example
 */

"use strict";
var inquirer = require("../lib/inquirer");

inquirer.prompt([
  {
    type: "directory",
    name: "path",
    message: "In what directory would like to perform this action?",
    basePath: "./"
  }
], function( answers ) {
    console.log( JSON.stringify(answers, null, "  ") );
  });
