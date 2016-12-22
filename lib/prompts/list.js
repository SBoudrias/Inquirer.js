/**
 * `list` type prompt
 */

const _ = require('lodash');
const chalk = require('chalk');
const figures = require('figures');
const cliCursor = require('cli-cursor');
const runAsync = require('run-async');
const Base = require('./base');
const Paginator = require('../utils/paginator');

module.exports = class Prompt extends Base {
  constructor(question, rl, answers) {
    super(question, rl, answers);

    if (!this.opt.choices) {
      this.throwParamError('choices');
    }

    this.firstRender = true;
    this.selected = 0;

    const def = this.opt.default;

    if (_.isString(def)) {
      this.selected = this.opt.choices.pluck('value').indexOf(def);
    } else if (_.isNumber(def) && def >= 0 && def < this.opt.choices.realLength) {
      this.selected = def;
    }

    // Make sure no default is set (so it won't be printed)
    this.opt.default = null;

    this.paginator = new Paginator();
  }

  /**
   * Start the Inquiry session
   * @param  {Object} events
   */
  _run(events) {
    events.normalizedUpKey.takeUntil(events.line).forEach(this.onUpKey.bind(this));
    events.normalizedDownKey.takeUntil(events.line).forEach(this.onDownKey.bind(this));
    events.numberKey.takeUntil(events.line).forEach(this.onNumberKey.bind(this));
    events.line
      .take(1)
      .map(this.getCurrentValue.bind(this))
      .flatMap(value => runAsync(this.opt.filter)(value).catch(_.identity))
      .forEach(this.onSubmit.bind(this));

    // Init the prompt
    cliCursor.hide();
    this.render();
  }

  /**
   * Render the prompt to screen
   * @return {Prompt} self
   */
  render() {
    // Render question
    let message = this.getQuestion();

    if (this.firstRender) {
      message += chalk.dim('(Use arrow keys)');
    }

    // Render choices or answer depending on the state
    if (this.status === 'answered') {
      message += chalk.cyan(this.opt.choices.getChoice(this.selected).short);
    } else {
      const choicesStr = listRender(this.opt.choices, this.selected);
      const indexPosition = this.opt.choices.indexOf(this.opt.choices.getChoice(this.selected));
      message += `\n${this.paginator.paginate(choicesStr, indexPosition, this.opt.pageSize)}`;
    }

    this.firstRender = false;

    this.screen.render(message);
  }

  /**
   * When user press `enter` key
   */
  onSubmit(value) {
    this.status = 'answered';

    // Rerender prompt
    this.render();

    this.screen.done();
    cliCursor.show();
    this.done(value);
  }

  getCurrentValue() {
    return this.opt.choices.getChoice(this.selected).value;
  }

  /**
   * When user press a key
   */
  onUpKey() {
    const len = this.opt.choices.realLength;
    this.selected = (this.selected > 0) ? this.selected - 1 : len - 1;
    this.render();
  }

  onDownKey() {
    const len = this.opt.choices.realLength;
    this.selected = (this.selected < len - 1) ? this.selected + 1 : 0;
    this.render();
  }

  onNumberKey(input) {
    if (input <= this.opt.choices.realLength) {
      this.selected = input - 1;
    }
    this.render();
  }
};

/**
 * Function for rendering list choices
 * @param  {Number} pointer Position of the pointer
 * @return {String}         Rendered content
 */
function listRender(choices, pointer) {
  let output = '';
  let separatorOffset = 0;

  choices.forEach((choice, index) => {
    if (choice.type === 'separator') {
      separatorOffset++;
      output += ` ${choice}\n`;
      return;
    }

    if (choice.disabled) {
      separatorOffset++;
      output += `  - ${choice.name} (${_.isString(choice.disabled) ? choice.disabled : 'Disabled'})\n`;
      return;
    }

    const isSelected = (index - separatorOffset) === pointer;
    const line = `${isSelected ? figures.pointer : ' '} ${choice.name}`;
    output += `${isSelected ? chalk.cyan(line) : line} \n`;
  });

  return output.replace(/\n$/, '');
}
