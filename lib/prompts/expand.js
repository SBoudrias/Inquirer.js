/**
 * `rawlist` type prompt
 */

const _ = require('lodash');
const chalk = require('chalk');
const Base = require('./base');
const Separator = require('../objects/separator');
const Paginator = require('../utils/paginator');

module.exports = class Prompt extends Base {
  constructor(question, rl, answers) {
    super(question, rl, answers);
    if (!this.opt.choices) {
      this.throwParamError('choices');
    }

    this.validateChoices(this.opt.choices);

    // Add the default `help` (/expand) option
    this.opt.choices.push({
      key: 'h',
      name: 'Help, list all options',
      value: 'help'
    });

    this.opt.validate = choice => _.isNull(choice) ? 'Please enter a valid command' : choice !== 'help';

    // Setup the default string (capitalize the default key)
    this.opt.default = this.generateChoicesString(this.opt.choices, this.opt.default);

    this.paginator = new Paginator();
  }

  /**
   * Start the Inquiry session
   * @param  {Object} events
   */
  _run(events) {
    // Save user answer and update prompt to show selected option.
    const validation = this.handleSubmitEvents(events.line.map(this.getCurrentValue.bind(this)));
    validation.success.forEach(this.onSubmit.bind(this));
    validation.error.forEach(this.onError.bind(this));
    this.keypressObs = events.keypress.takeUntil(validation.success)
      .forEach(this.onKeypress.bind(this));

    // Init the prompt
    this.render();
  }

  /**
   * Render the prompt to screen
   * @return {Prompt} self
   */
  render(error, hint) {
    let message = this.getQuestion();
    let bottomContent = '';

    if (this.status === 'answered') {
      message += chalk.cyan(this.answer);
    } else if (this.status === 'expanded') {
      const choicesStr = renderChoices(this.opt.choices, this.selectedKey);
      message += `${this.paginator.paginate(choicesStr, this.selectedKey, this.opt.pageSize)}\n  Answer: `;
    }

    message += this.rl.line;

    if (hint) {
      bottomContent = `${chalk.cyan('>>')} ${hint}`;
    } else if (error) {
      bottomContent = `${chalk.red('>>')} ${error}`;
    }

    this.screen.render(message, bottomContent);
  }

  getCurrentValue(input) {
    if (!input) {
      input = this.rawDefault;
    }
    const selected = this.opt.choices.where({key: input.toLowerCase().trim()})[0];
    return selected ? selected.value : null;
  }
  /**
   * Generate the prompt choices string
   * @return {String}  Choices string
   */
  getChoices() {
    let output = '';

    this.opt.choices.forEach(choice => {
      if (choice.type === 'separator') {
        output += `\n   ${choice}`;
        return;
      }

      const choiceStr = `\n  ${choice.key}) ${choice.name}`;
      output += (this.selectedKey === choice.key) ? chalk.cyan(choiceStr) : choiceStr;
    });

    return output;
  }

  onError(state) {
    if (state.value === 'help') {
      this.selectedKey = '';
      this.status = 'expanded';
      this.render();
      return;
    }
    this.render(state.isValid);
  }

  /**
   * When user press `enter` key
   */
  onSubmit(state) {
    this.status = 'answered';
    const choice = this.opt.choices.where({value: state.value})[0];
    this.answer = choice.short || choice.name;

    // Re-render prompt
    this.render();
    this.screen.done();
    this.done(state.value);
  }

  /**
   * When user press a key
   */
  onKeypress() {
    this.selectedKey = this.rl.line.toLowerCase();
    const selected = this.opt.choices.where({key: this.selectedKey})[0];
    if (this.status === 'expanded') {
      this.render();
    } else {
      this.render(null, selected ? selected.name : null);
    }
  }

  /**
   * Validate the choices
   * @param {Array} choices
   */
  validateChoices(choices) {
    let formatError = false;
    const errors = [];
    const keys = [];
    choices.filter(Separator.exclude).forEach(choice => {
      if (!choice.key || choice.key.length !== 1) {
        formatError = true;
      }
      if (keys.includes(choice.key)) {
        errors.push(choice.key);
      }
      keys.push(choice.key);
      choice.key = String(choice.key).toLowerCase();
    });

    if (formatError) {
      throw new Error('Format error: `key` param must be a single letter and is required.');
    }
    if (keys.includes('h')) {
      throw new Error('Reserved key error: `key` param cannot be `h` - this value is reserved.');
    }
    if (errors.length) {
      throw new Error(`Duplicate key error: \`key\` param must be unique. Duplicates: ${_.uniq(errors).join(', ')}`);
    }
  }

  /**
   * Generate a string out of the choices keys
   * @param  {Array}  choices
   * @param  {Number} defaultIndex - the choice index to capitalize
   * @return {String} The rendered choices key string
   */
  generateChoicesString(choices, defaultIndex) {
    const defIndex = (_.isNumber(defaultIndex) && this.opt.choices.getChoice(defaultIndex)) ? defaultIndex : choices.realLength - 1;
    const defStr = this.opt.choices.pluck('key');
    this.rawDefault = defStr[defIndex];
    defStr[defIndex] = String(defStr[defIndex]).toUpperCase();
    return defStr.join('');
  }
};

/**
 * Function for rendering checkbox choices
 * @param  {String} pointer Selected key
 * @return {String}         Rendered content
 */

function renderChoices(choices, pointer) {
  let output = '';

  choices.forEach(function (choice) {
    if (choice.type === 'separator') {
      output += `\n   ${choice}`;
      return;
    }

    const choiceStr = `\n  ${choice.key}) ${choice.name}`;
    output += (pointer === choice.key) ? chalk.cyan(choiceStr) : choiceStr;
  });

  return output;
}
