/**
 * `rawlist` type prompt
 */

const _ = require('lodash');
const chalk = require('chalk');
const Base = require('./base');
const Separator = require('../objects/separator');
const observe = require('../utils/events');
const Paginator = require('../utils/paginator');

module.exports = class Prompt extends Base {
  constructor(question, rl, answers) {
    super(question, rl, answers);

    if (!this.opt.choices) {
      this.throwParamError('choices');
    }

    this.opt.validChoices = this.opt.choices.filter(Separator.exclude);

    this.selected = 0;
    this.rawDefault = 0;

    _.extend(this.opt, {
      validate: val => !_.isNull(val)
    });

    const def = this.opt.default;
    if (_.isNumber(def) && def >= 0 && def < this.opt.choices.realLength) {
      this.selected = this.rawDefault = def;
    }

    // Make sure no default is set (so it won't be printed)
    this.opt.default = null;

    this.paginator = new Paginator();
  }

  /**
   * Start the Inquiry session
   * @param  {Function} cb      Callback when prompt is done
   * @return {this}
   */
  _run(cb) {
    this.done = cb;

    // Once user confirm (enter key)
    const events = observe(this.rl);
    const submit = events.line.map(this.getCurrentValue.bind(this));

    const validation = this.handleSubmitEvents(submit);
    validation.success.forEach(this.onEnd.bind(this));
    validation.error.forEach(() => this.render('Please enter a valid index'));

    events.keypress.takeUntil(validation.success).forEach(this.onKeypress.bind(this));

    // Init the prompt
    this.render();

    return this;
  }

  /**
   * Render the prompt to screen
   * @return {Prompt} self
   */

  render(error) {
    // Render question
    let message = this.getQuestion();

    if (this.status === 'answered') {
      message += chalk.cyan(this.answer);
    } else {
      const choicesStr = renderChoices(this.opt.choices, this.selected);
      message += `${this.paginator.paginate(choicesStr, this.selected, this.opt.pageSize)}\n Answer: `;
    }

    message += this.rl.line;

    const bottomContent = error ? `\n${chalk.red('>>')} ${error}` : '';

    this.screen.render(message, bottomContent);
  }
  /**
   * When user press `enter` key
   */
  getCurrentValue(index) {
    index = (!index || index === '') ? this.rawDefault : index - 1;
    const choice = this.opt.choices.getChoice(index);
    return choice ? choice.value : null;
  }

  onEnd(state) {
    this.status = 'answered';
    this.answer = state.value;

    // Re-render prompt
    this.render();

    this.screen.done();
    this.done(state.value);
  }

  /**
   * When user press a key
   */
  onKeypress() {
    const index = this.rl.line.length ? Number(this.rl.line) - 1 : 0;

    this.selected = this.opt.choices.getChoice(index) ? index : undefined;

    this.render();
  }
};

/**
 * Function for rendering list choices
 * @param  {Number} pointer Position of the pointer
 * @return {String}         Rendered content
 */

function renderChoices(choices, pointer) {
  let output = '';
  let separatorOffset = 0;

  choices.forEach((choice, i) => {
    if (choice.type === 'separator') {
      separatorOffset++;
      output += `\n   ${choice}`;
      return;
    }

    const index = i - separatorOffset;
    const display = `${index + 1}) ${choice.name}`;
    output += (index === pointer) ? chalk.cyan(display) : display;
  });

  return output;
}
