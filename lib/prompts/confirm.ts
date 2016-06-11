/**
 * `confirm` type prompt
 */

import {BasePrompt} from './base';
import {observe} from '../utils/events';


import _ = require('lodash');
import chalk = require('chalk');

/**
 * Constructor
 */

export class ConfirmPrompt extends BasePrompt {
  private done;
  constructor(prompts, rl?, answers?) {
    super(prompts, rl, answers);

    var rawDefault = true;

    //noinspection TypeScriptValidateJSTypes
    _.extend(this.opt, {
      filter: function (input) {
        var value = rawDefault;
        if (input != null && input !== '') {
          value = /^y(es)?/i.test(input);
        }
        return value;
      }
    });

    if (_.isBoolean(this.opt.default)) {
      rawDefault = this.opt.default;
    }

    this.opt.default = rawDefault ? 'Y/n' : 'y/N';

    return this;
  }

  /**
   * Start the Inquiry session
   * @param  {Function} cb   Callback when prompt is done
   * @return {this}
   */

  _run(cb) {
    this.done = cb;

    // Once user confirm (enter key)
    var events = observe(this.rl);
    events.keypress.takeUntil(events.line).forEach(this.onKeypress.bind(this));

    events.line.take(1).forEach(this.onEnd.bind(this));

    // Init
    this.render();

    return this;
  };

  /**
   * Render the prompt to screen
   * @return {BottomBar} self
   */

  render(answer?) {
    var message = this.getQuestion();

    if (typeof answer === 'boolean') {
      //noinspection TypeScriptValidateTypes
      message += chalk.cyan(answer ? 'Yes' : 'No');
    } else {
      message += this.rl.line;
    }

    this.screen.render(message);

    return this;
  };

  /**
   * When user press `enter` key
   */

  onEnd(input) {
    this.status = 'answered';

    var output = this.opt.filter(input);
    this.render(output);

    this.screen.done();
    this.done(output);
  };

  /**
   * When user press a key
   */

  onKeypress() {
    this.render();
  };
}
