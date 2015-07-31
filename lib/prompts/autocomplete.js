/**
 * `list` type prompt
 */

var _ = require("lodash");
var util = require("util");
var chalk = require("chalk");
var figures = require("figures");
var Base = require("./base");
var Choices = require("../objects/choices");
var observe = require("../utils/events");
var utils = require("../utils/readline");
var Paginator = require("../utils/paginator");


/**
 * Module exports
 */

module.exports = Prompt;


/**
 * Constructor
 */

function Prompt() {
  Base.apply(this, arguments);

  if (!this.opt.choices) {
    this.throwParamError("choices");
  }

  this.currentChoices = [];

  this.firstRender = true;
  this.selected = 0;

  var def = this.opt.default;

  // Make sure no default is set (so it won't be printed)
  this.opt.default = null;

  this.paginator = new Paginator();
}
util.inherits(Prompt, Base);


/**
 * Start the Inquiry session
 * @param  {Function} cb      Callback when prompt is done
 * @return {this}
 */

Prompt.prototype._run = function(cb) {
  var self = this;
  self.done = cb;

  var events = observe(self.rl);

  events.line.take(1).forEach(self.onSubmit.bind(this));
  events.keypress.takeUntil(events.line).forEach(self.onKeypress.bind(this));

  //call once at init
  self.currentPromise = self.opt.choices();

  self.currentPromise.then(function inner(choices) {
    choices = new Choices(choices);
    self.currentChoices = choices;
    // Init the prompt
    utils.hideCursor(self.rl);
    self.render();
  });

  return this;
};


/**
 * Render the prompt to screen
 * @return {Prompt} self
 */

Prompt.prototype.render = function() {
  var cursor = 0;

  // Render question
  var message = this.getQuestion();

  if (this.firstRender) {
    message += chalk.dim("(Use arrow keys or type to search)");
  }
  // Render choices or answer depending on the state
  if (this.status === "answered") {
    message += chalk.cyan(this.currentChoices.getChoice(this.selected).name);
  } else if (this.searching) {
    message += this.rl.line + "\n  " + chalk.dim("Searching...");
  } else if (this.currentChoices.length) {
    var choicesStr = listRender(this.currentChoices, this.selected);
    message += this.rl.line + "\n" + this.paginator.paginate(choicesStr, this.selected);
  } else {
    message += this.rl.line + "\n  " + chalk.yellow("No results...");
  }

  this.firstRender = false;

  this.screen.render(message);
};

/**
 * When user press `enter` key
 */

Prompt.prototype.onSubmit = function() {
  if (this.currentChoices.length <= this.selected) {
    return;
  }

  var choice = this.currentChoices.getChoice(this.selected);

  this.status = "answered";

  // Rerender prompt
  this.render();

  this.screen.done();
  utils.showCursor(this.rl);

  this.done(choice.value);

};

Prompt.prototype.search = function() {
  var self = this;
  self.selected = 0;

  self.searching = true;
  self.currentChoices = new Choices([]);
  self.render(); //now render current searching state

  self.lastSearchTerm = this.rl.line;
  self.currentPromise = self.opt.choices(self.rl.line);

  self.currentPromise.then(function inner(choices) {
    choices = new Choices(choices);
    self.currentChoices = choices;
    self.searching = false;
    self.render();
  });

};

/**
 * When user type
 */

Prompt.prototype.onKeypress = function(e) {
  if (e.key.name === 'down') {
    var len = this.currentChoices.length;
    this.selected = (this.selected < len - 1) ? this.selected + 1 : 0;
    this.render();
  } else if (e.key.name === 'up') {
    var len = this.currentChoices.length;
    this.selected = (this.selected > 0) ? this.selected - 1 : len - 1;
    this.render();
  } else {
    this.render(); //render input automatically

    //Only search if input have actually changed, not because of other keypresses
    if (this.lastSearchTerm !== this.rl.line) {
      this.search(); //trigger new search
    }
  }
};


/**
 * Function for rendering list choices
 * @param  {Number} pointer Position of the pointer
 * @return {String}         Rendered content
 */
function listRender(choices, pointer) {
  var output = '';
  var separatorOffset = 0;

  choices.forEach(function(choice, i) {
    if (choice.type === 'separator') {
      separatorOffset++;
      output += '  ' + choice + '\n';
      return;
    }

    var isSelected = (i - separatorOffset === pointer);
    var line = (isSelected ? figures.pointer + ' ' : '  ') + choice.name;

    if (isSelected) {
      line = chalk.cyan(line);
    }
    output += line + ' \n';
  });

  return output.replace(/\n$/, '');
}
