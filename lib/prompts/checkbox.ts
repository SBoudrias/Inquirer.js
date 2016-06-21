/**
 * `list` type prompt
 */
import {BasePrompt} from './base';
import {observe} from '../utils/events';
import {Paginator} from '../utils/paginator';

import _ = require('lodash');
import chalk = require('chalk');
import cliCursor = require('cli-cursor');
import figures = require('figures');

/**
 * Constructor
 */
export class CheckboxPrompt extends BasePrompt {
  private pointer;
  private paginator;
  private spaceKeyPressed;
  private done;
  private selection;
  constructor(question, rl?, answers?) {
    super(question, rl, answers);

    if (!this.opt.choices) {
      this.throwParamError('choices');
    }

    if (_.isArray(this.opt.default)) {
      this.opt.choices.forEach(function (choice) {
        if (this.opt.default.indexOf(choice.value) >= 0) {
          choice.checked = true;
        }
      }, this);
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

    var events = observe(this.rl);

    var validation = this.handleSubmitEvents(
      events.line.map(this.getCurrentValue.bind(this))
    );
    validation.success.forEach(this.onEnd.bind(this));
    validation.error.forEach(this.onError.bind(this));

    events.normalizedUpKey.takeUntil(validation.success).forEach(this.onUpKey.bind(this));
    events.normalizedDownKey.takeUntil(validation.success).forEach(this.onDownKey.bind(this));
    events.numberKey.takeUntil(validation.success).forEach(this.onNumberKey.bind(this));
    events.spaceKey.takeUntil(validation.success).forEach(this.onSpaceKey.bind(this));

    // Init the prompt
    //noinspection TypeScriptUnresolvedFunction
    cliCursor.hide();
    this.render();

    return this;
  };

  /**
   * Render the prompt to screen
   * @return {BottomBar} self
   */

  render(error?) {
    // Render question
    var message = this.getQuestion();
    var bottomContent = '';

    if (!this.spaceKeyPressed) {
      message += '(Press <space> to select)';
    }

    // Render choices or answer depending on the state
    if (this.status === 'answered') {
      //noinspection TypeScriptValidateTypes
      message += chalk.cyan(this.selection.join(', '));
    } else {
      var choicesStr = renderChoices(this.opt.choices, this.pointer);
      var indexPosition = this.opt.choices.indexOf(this.opt.choices.getChoice(this.pointer));
      message += '\n' + this.paginator.paginate(choicesStr, indexPosition, this.opt.pageSize);
    }

    if (error) {
      //noinspection TypeScriptValidateTypes
      bottomContent = chalk.red('>> ') + error;
    }

    this.screen.render(message, bottomContent);
  };

  /**
   * When user press `enter` key
   */

  onEnd(state) {
    this.status = 'answered';

    // Rerender prompt (and clean subline error)
    this.render();

    this.screen.done();
    //noinspection TypeScriptUnresolvedFunction
    cliCursor.show();
    this.done(state.value);
  };

  onError(state) {
    this.render(state.isValid);
  };

  getCurrentValue() {
    var choices = this.opt.choices.filter(function (choice) {
      return Boolean(choice.checked) && !choice.disabled;
    });

    this.selection = _.map(choices, 'short');
    return _.map(choices, 'value');
  };

  onUpKey() {
    var len = this.opt.choices.realLength;
    this.pointer = (this.pointer > 0) ? this.pointer - 1 : len - 1;
    this.render();
  };

  onDownKey() {
    var len = this.opt.choices.realLength;
    this.pointer = (this.pointer < len - 1) ? this.pointer + 1 : 0;
    this.render();
  };

  onNumberKey(input) {
    if (input <= this.opt.choices.realLength) {
      this.pointer = input - 1;
      this.toggleChoice(this.pointer);
    }
    this.render();
  };

  onSpaceKey() {
    this.spaceKeyPressed = true;
    this.toggleChoice(this.pointer);
    this.render();
  };

  toggleChoice(index) {
    var checked = this.opt.choices.getChoice(index).checked;
    this.opt.choices.getChoice(index).checked = !checked;
  };
}
/**
 * Function for rendering checkbox choices
 * @param  {Number} pointer Position of the pointer
 * @return {String}         Rendered content
 */

function renderChoices(choices, pointer) {
  var output = '';
  var separatorOffset = 0;

  choices.forEach(function (choice, i) {
    if (choice.type === 'separator') {
      separatorOffset++;
      output += ' ' + choice + '\n';
      return;
    }

    if (choice.disabled) {
      separatorOffset++;
      output += ' - ' + choice.name;
      output += ' (' + (_.isString(choice.disabled) ? choice.disabled : 'Disabled') + ')';
    } else {
      var isSelected = (i - separatorOffset === pointer);
      //noinspection TypeScriptValidateTypes
      output += isSelected ? chalk.cyan(figures.pointer) : ' ';
      output += getCheckbox(choice.checked) + ' ' + choice.name;
    }

    output += '\n';
  });

  return output.replace(/\n$/, '');
}

/**
 * Get the checkbox
 * @param  {Boolean} checked - add a X or not to the checkbox
 * @return {String} Composited checkbox string
 */

function getCheckbox(checked) {
  //noinspection TypeScriptUnresolvedVariable, TypeScriptValidateTypes
  return checked ? chalk.green(figures.radioOn) : figures.radioOff;
}
