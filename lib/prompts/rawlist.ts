/**
 * `rawlist` type prompt
 */

import {BasePrompt} from './base';
import {observe} from '../utils/events';
import {Paginator} from '../utils/paginator';
import {Separator} from '../objects/separator';

import _ = require('lodash');
import chalk = require('chalk');

/**
 * Constructor
 */

export class RawListPrompt extends BasePrompt {
  selected;
  rawDefault;
  paginator;
  private done;
  private answer;
  constructor(question, rl?, answers?) {
    super(question, rl, answers);
    if (!this.opt.choices) {
      this.throwParamError('choices');
    }

    this.opt.validChoices = this.opt.choices.filter(Separator.exclude);

    this.selected = 0;
    this.rawDefault = 0;

    //noinspection TypeScriptValidateJSTypes
    _.extend(this.opt, {
      validate: function (val) {
        return val != null;
      }
    });

    var def = this.opt.default;
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
    var events = observe(this.rl);
    var submit = events.line.map(this.getCurrentValue.bind(this));

    var validation = this.handleSubmitEvents(submit);
    validation.success.forEach(this.onEnd.bind(this));
    validation.error.forEach(this.onError.bind(this));

    //noinspection TypeScriptUnresolvedFunction
    events.keypress.takeUntil(validation.success).forEach(this.onKeypress.bind(this));

    // Init the prompt
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

    if (this.status === 'answered') {
      //noinspection TypeScriptValidateTypes
      message += chalk.cyan(this.answer);
    } else {
      var choicesStr = renderChoices(this.opt.choices, this.selected);
      message += this.paginator.paginate(choicesStr, this.selected, this.opt.pageSize);
      message += '\n  Answer: ';
    }

    message += this.rl.line;

    if (error) {
      //noinspection TypeScriptValidateTypes
      bottomContent = '\n' + chalk.red('>> ') + error;
    }

    this.screen.render(message, bottomContent);
  };

  /**
   * When user press `enter` key
   */

  getCurrentValue(index) {
    if (index == null || index === '') {
      index = this.rawDefault;
    } else {
      index -= 1;
    }

    var choice = this.opt.choices.getChoice(index);
    return choice ? choice.value : null;
  };

  onEnd(state) {
    this.status = 'answered';
    this.answer = state.value;

    // Re-render prompt
    this.render();

    this.screen.done();
    this.done(state.value);
  };

  onError() {
    this.render('Please enter a valid index');
  };

  /**
   * When user press a key
   */

  onKeypress() {
    var index = this.rl.line.length ? Number(this.rl.line) - 1 : 0;

    if (this.opt.choices.getChoice(index)) {
      this.selected = index;
    } else {
      this.selected = undefined;
    }

    this.render();
  };
}
/**
 * Function for rendering list choices
 * @param  {Number} pointer Position of the pointer
 * @return {String}         Rendered content
 */

function renderChoices(choices, pointer) {
  var output = '';
  var separatorOffset = 0;

  choices.forEach(function (choice, i) {
    output += '\n  ';

    if (choice.type === 'separator') {
      separatorOffset++;
      output += ' ' + choice;
      return;
    }

    var index = i - separatorOffset;
    var display = (index + 1) + ') ' + choice.name;
    if (index === pointer) {
      //noinspection TypeScriptValidateTypes
      display = chalk.cyan(display);
    }
    output += display;
  });

  return output;
}
