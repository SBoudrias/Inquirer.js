/**
 * `list` type prompt
 */

const _ = require('lodash');
const chalk = require('chalk');
const cliCursor = require('cli-cursor');
const figures = require('figures');
const Base = require('./base');
const observe = require('../utils/events');
const Paginator = require('../utils/paginator');

module.exports = class Prompt extends Base {
  constructor(question, rl, answers) {
    super(question, rl, answers);

    if (!this.opt.choices) {
      this.throwParamError('choices');
    }

    if (Array.isArray(this.opt.default)) {
      this.opt.choices.forEach(choice => {
        if (this.opt.default.includes(choice.value)) {
          choice.checked = true;
        }
      });
    }

    this.pointer = 0;

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
    const events = observe(this.rl);
    const validation = this.handleSubmitEvents(events.line.map(this.getCurrentValue.bind(this)));
    validation.success.forEach(this.onEnd.bind(this));
    validation.error.forEach(state => this.render(state.isValid));

    events.normalizedUpKey.takeUntil(validation.success).forEach(this.onUpKey.bind(this));
    events.normalizedDownKey.takeUntil(validation.success).forEach(this.onDownKey.bind(this));
    events.numberKey.takeUntil(validation.success).forEach(this.onNumberKey.bind(this));
    events.spaceKey.takeUntil(validation.success).forEach(this.onSpaceKey.bind(this));
    events.aKey.takeUntil(validation.success).forEach(this.onAllKey.bind(this));
    events.iKey.takeUntil(validation.success).forEach(this.onInverseKey.bind(this));

    // Init the prompt
    cliCursor.hide();
    this.render();

    return this;
  }

  /**
   * Render the prompt to screen
   * @return {Prompt} self
   */
  render(error) {
    let message = this.getQuestion();

    if (!this.spaceKeyPressed) {
      message += `(Press ${chalk.cyan.bold('<space>')} to select, ${chalk.cyan.bold('<a>')} to toggle all, ${chalk.cyan.bold('<i>')} to inverse selection)`;
    }

    // Render choices or answer depending on the state
    if (this.status === 'answered') {
      message += chalk.cyan(this.selection.join(', '));
    } else {
      const choicesStr = this.renderChoices(this.opt.choices, this.pointer);
      const indexPosition = this.opt.choices.indexOf(this.opt.choices.getChoice(this.pointer));
      message += `\n${this.paginator.paginate(choicesStr, indexPosition, this.opt.pageSize)}`;
    }

    const bottomContent = error ? `${chalk.red('>>')} ${error}` : '';
    this.screen.render(message, bottomContent);
  }

  /**
   * When user press `enter` key
   */
  onEnd(state) {
    this.status = 'answered';

    // Rerender prompt (and clean subline error)
    this.render();

    this.screen.done();
    cliCursor.show();
    this.done(state.value);
  }

  getCurrentValue() {
    const choices = this.opt.choices.filter(choice => choice.checked && !choice.disabled);

    this.selection = _.map(choices, 'short');
    return _.map(choices, 'value');
  }

  onUpKey() {
    this.pointer = (this.pointer > 0) ? this.pointer - 1 : this.opt.choices.realLength - 1;
    this.render();
  }

  onDownKey() {
    this.pointer = (this.pointer < this.opt.choices.realLength - 1) ? this.pointer + 1 : 0;
    this.render();
  }

  onNumberKey(input) {
    if (input <= this.opt.choices.realLength) {
      this.pointer = input - 1;
      this.toggleChoice(this.pointer);
    }
    this.render();
  }

  onSpaceKey() {
    this.spaceKeyPressed = true;
    this.toggleChoice(this.pointer);
    this.render();
  }

  onAllKey() {
    const shouldBeChecked = this.opt.choices.some(choice => choice.type !== 'separator' && !choice.checked);
    this.opt.choices.forEach(choice => {
      if (choice.type !== 'separator') {
        choice.checked = shouldBeChecked;
      }
    });

    this.render();
  }

  onInverseKey() {
    this.opt.choices.forEach(choice => {
      if (choice.type !== 'separator') {
        choice.checked = !choice.checked;
      }
    });

    this.render();
  }

  toggleChoice(index) {
    const item = this.opt.choices.getChoice(index);
    if (typeof item !== 'undefined') {
      item.checked = !item.checked;
    }
  }

  /**
   * Function for rendering checkbox choices
   * @param  {Number} pointer Position of the pointer
   * @return {String}         Rendered content
   */
  renderChoices(choices, pointer) {
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
        output += ` - ${choice.name} (${_.isString(choice.disabled) ? choice.disabled : 'Disabled'})\n`;
      } else {
        const isSelected = (index - separatorOffset) === pointer;
        output += `${isSelected ? chalk.cyan(figures.pointer) : ' '}${this.getCheckbox(choice.checked)} ${choice.name}\n`;
      }
    });

    return output.replace(/\n$/, '');
  }

  /**
   * Get the checkbox
   * @param  {Boolean} checked - add a X or not to the checkbox
   * @return {String} Composited checkbox string
   */
  getCheckbox(checked) {
    return checked ? chalk.green(figures.radioOn) : figures.radioOff;
  }
};
