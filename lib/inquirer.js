/**
 * Inquirer.js
 * A collection of common interactive command line user interfaces.
 */

var inquirer = module.exports;


/**
 * Client interfaces
 */

inquirer.prompts = {};

inquirer.Separator = require("./objects/separator");

inquirer.ui = {
  BottomBar: require("./ui/bottom-bar"),
  Prompt: require("./ui/prompt")
};


/**
 * Public CLI helper interface
 * @param  {Array|Object|rx.Observable} questions - Questions settings array
 * @param  {Function} cb - Callback being passed the user answers
 * @return {inquirer.ui.Prompt}
 */

inquirer.prompt = function( questions, allDone ) {
  var prompt = new inquirer.ui.Prompt();
  prompt.run( questions, allDone );
  return prompt;
};

/**
 * Register a prompt type
 * @param {String} name     Prompt type name
 * @param {Function} prompt Prompt constructor
 * @return {inquirer}
 */

inquirer.registerPrompt = function( name, prompt ) {
  this.prompts[ name ] = prompt;
  return this;
};

/**
 * Register the defaults provider prompts
 */

inquirer.restoreDefaultPrompts = function () {
  this.registerPrompt( "list", require("./prompts/list"));
  this.registerPrompt( "input", require("./prompts/input"));
  this.registerPrompt( "confirm", require("./prompts/confirm"));
  this.registerPrompt( "rawlist", require("./prompts/rawlist"));
  this.registerPrompt( "expand", require("./prompts/expand"));
  this.registerPrompt( "checkbox", require("./prompts/checkbox"));
  this.registerPrompt( "password", require("./prompts/password"));
};

inquirer.restoreDefaultPrompts();
