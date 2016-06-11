
import {BasePrompt} from './base';
import {observe} from '../utils/events';
import {Paginator} from '../utils/paginator';

import _ = require('lodash');
import chalk = require('chalk');
import figures = require('figures');
import cliCursor = require('cli-cursor');

/**
 * `list` type prompt
 */
export class ListPrompt extends BasePrompt {
  private firstRender;
  private selected;
  private paginator;
  private done;
  constructor(question, rl?, answers?) {
    super(question, rl, answers);

    if (!this.opt.choices) {
      this.throwParamError('choices');
    }

    this.firstRender = true;
    this.selected = 0;

    var def = this.opt.default;

    // Default being a Number
    if (_.isNumber(def) && def >= 0 && def < this.opt.choices.realLength) {
      this.selected = def;
    }

    // Default being a String
    if (_.isString(def)) {
      this.selected = this.opt.choices.pluck('value').indexOf(def);
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

    var events = observe(this.rl);
    events.normalizedUpKey.takeUntil(events.line).forEach(this.onUpKey.bind(this));
    events.normalizedDownKey.takeUntil(events.line).forEach(this.onDownKey.bind(this));
    events.numberKey.takeUntil(events.line).forEach(this.onNumberKey.bind(this));
    var validation = this.handleSubmitEvents(
      events.line.map(this.getCurrentValue.bind(this))
    );
    validation.success.forEach(this.onSubmit.bind(this));

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

  render() {
    // Render question
    var message = this.getQuestion();

    if (this.firstRender) {
      //noinspection TypeScriptValidateTypes
      message += chalk.dim('(Use arrow keys)');
    }

    // Render choices or answer depending on the state
    if (this.status === 'answered') {
      //noinspection TypeScriptValidateTypes
      message += chalk.cyan(this.opt.choices.getChoice(this.selected).short);
    } else {
      var choicesStr = listRender(this.opt.choices, this.selected);
      var indexPosition = this.opt.choices.indexOf(this.opt.choices.getChoice(this.selected));
      message += '\n' + this.paginator.paginate(choicesStr, indexPosition, this.opt.pageSize);
    }

    this.firstRender = false;

    this.screen.render(message);
  };

  /**
   * When user press `enter` key
   */

  onSubmit(state) {
    this.status = 'answered';

    // Rerender prompt
    this.render();

    this.screen.done();
    //noinspection TypeScriptUnresolvedFunction
    cliCursor.show();
    this.done(state.value);
  };

  getCurrentValue() {
    return this.opt.choices.getChoice(this.selected).value;
  };

  /**
   * When user press a key
   */
  onUpKey() {
    var len = this.opt.choices.realLength;
    this.selected = (this.selected > 0) ? this.selected - 1 : len - 1;
    this.render();
  };

  onDownKey() {
    var len = this.opt.choices.realLength;
    this.selected = (this.selected < len - 1) ? this.selected + 1 : 0;
    this.render();
  };

  onNumberKey(input) {
    if (input <= this.opt.choices.realLength) {
      this.selected = input - 1;
    }
    this.render();
  };
}
/**
 * Function for rendering list choices
 * @param  {Number} pointer Position of the pointer
 * @return {String}         Rendered content
 */
function listRender(choices, pointer) {
  var output = '';
  var separatorOffset = 0;

  choices.forEach(function (choice, i) {
    if (choice.type === 'separator') {
      separatorOffset++;
      output += '  ' + choice + '\n';
      return;
    }

    if (choice.disabled) {
      separatorOffset++;
      output += '  - ' + choice.name;
      output += ' (' + (_.isString(choice.disabled) ? choice.disabled : 'Disabled') + ')';
      output += '\n';
      return;
    }

    var isSelected = (i - separatorOffset === pointer);
    var line = (isSelected ? figures.pointer + ' ' : '  ') + choice.name;
    if (isSelected) {
      //noinspection TypeScriptValidateTypes
      line = chalk.cyan(line);
    }
    output += line + ' \n';
  });

  return output.replace(/\n$/, '');
}
