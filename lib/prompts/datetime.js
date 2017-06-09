/**
 * `datetime` type prompt
 */

var _ = require('lodash');
var util = require('util');
var cliCursor = require('cli-cursor');
var chalk = require('chalk');
var Base = require('./base');
var observe = require('../utils/events');

require('datejs');
var dateFormat = require('dateformat');

/**
 * Module exports
 */

module.exports = Prompt;

/**
 * Constructor
 */

function Prompt() {
  Base.apply(this, arguments);

  // Set Defaults
  _.defaultsDeep(this.opt, {
    format: ['m', '/', 'd', '/', 'yy', ' ', 'h', ':', 'MM', ' ', 'TT'],
    date: {
      max: null,
      min: null
    },
    time: {
      max: null,
      min: null,

      hours: {
        interval: 1
      },
      minutes: {
        interval: 1
      },
      seconds: {
        interval: 1
      }
    }
  });

  // Parse Date Parameters
  var standardizeTime = function (date) {
    return Date.parse('1/1/2000')
               .set({
                 hour: date.getHours(),
                 minute: date.getMinutes(),
                 second: date.getSeconds()
               });
  };

  this.opt.date.min = (typeof this.opt.date.min === 'string') ? Date.parse(this.opt.date.min) : null;
  this.opt.date.max = (typeof this.opt.date.max === 'string') ? Date.parse(this.opt.date.max) : null;
  this.opt.time.min = (typeof this.opt.time.min === 'string') ? standardizeTime(Date.parse(this.opt.time.min)) : null;
  this.opt.time.max = (typeof this.opt.time.max === 'string') ? standardizeTime(Date.parse(this.opt.time.max)) : null;

  // Determine Date for Start of Prompt
  var startDate = Date.today();
  if (this.opt.date.min) {
    startDate = startDate.set({
      day: this.opt.date.min.getDate(),
      month: this.opt.date.min.getMonth(),
      year: this.opt.date.min.getFullYear()
    });
  }

  if (this.opt.time.min) {
    startDate = startDate.set({
      hour: this.opt.time.min.getHours(),
      minutes: this.opt.time.min.getMinutes(),
      seconds: this.opt.time.min.getSeconds()
    });
  }

  // Define Selection, State Helper for Selection
  this._selection = {
    date: startDate,
    cur: 0,
    elements: []
  };

  // Parse Elements
  var opt = this.opt;
  var selection = this._selection;

  var validateDate = function (datePropose) {
    datePropose = datePropose.clone();

    // Validate Time
    if (opt.time.max && standardizeTime(datePropose) > opt.time.max) {
      datePropose = datePropose.set({
        hour: opt.time.max.getHours(),
        minute: opt.time.max.getMinutes(),
        seconds: opt.time.max.getSeconds()
      });
    } else if (opt.time.min && standardizeTime(datePropose) < opt.time.min) {
      datePropose = datePropose.set({
        hour: opt.time.min.getHours(),
        minute: opt.time.min.getMinutes(),
        seconds: opt.time.min.getSeconds()
      });
    }

    // Validate Date
    if (opt.date.max && datePropose.isAfter(opt.date.max)) {
      datePropose = validateDate(opt.date.max);
    }

    if (opt.date.min && datePropose.isBefore(opt.date.min)) {
      datePropose = validateDate(opt.date.min);
    }
    return datePropose;
  };

  this._selection.date = validateDate(this._selection.date);

  _.each(this.opt.format, function (str) {
    switch (str) {
      case 'd':
      case 'dd':
      case 'ddd':
      case 'dddd':
        selection.elements.push(function (diff) {
          selection.date = validateDate(selection.date.addDays(diff));
        });
        break;
      case 'm':
      case 'mm':
      case 'mmm':
      case 'mmmm':
        selection.elements.push(function (diff) {
          selection.date = validateDate(selection.date.addMonths(diff));
        });
        break;
      case 'yy':
      case 'yyyy':
        selection.elements.push(function (diff) {
          selection.date = validateDate(selection.date.addYears(diff));
        });
        break;
      case 'h':
      case 'hh':
      case 'H':
      case 'HH':
        selection.elements.push(function (diff) {
          selection.date = validateDate(selection.date.addHours(diff * opt.time.hours.interval));
        });
        break;
      case 'M':
      case 'MM':
        selection.elements.push(function (diff) {
          selection.date = validateDate(selection.date.addMinutes(diff * opt.time.minutes.interval));
        });
        break;
      case 's':
      case 'ss':
        selection.elements.push(function (diff) {
          selection.date = validateDate(selection.date.addSeconds(diff * opt.time.seconds.interval));
        });
        break;
      case 't':
      case 'tt':
      case 'T':
      case 'TT':
        selection.elements.push(function () {
          if (selection.date.getHours() >= 12) {
            selection.date.addHours(-12);
          } else {
            selection.date.addHours(12);
          }
        });
        break;
      default:
        selection.elements.push(null);
    }
  });

  return this;
}
util.inherits(Prompt, Base);

/**
 * Start the Inquiry session
 * @param  {Function} cb   Callback when prompt is done
 * @return {this}
 */

Prompt.prototype._run = function (cb) {
  this.done = cb;

  // Once user confirm (enter key)
  var events = observe(this.rl);
  events.keypress.takeUntil(events.line).forEach(this.onKeypress.bind(this));
  events.line.take(1).forEach(this.onEnd.bind(this));

  // Init
  cliCursor.hide();
  this.render();
  return this;
};

/**
 * Render the prompt to screen
 * @return {Prompt} self
 */

Prompt.prototype.render = function () {
  var message = this.getQuestion();
  var selection = this._selection;

  _.each(this.opt.format, function (str, index) {
    if (selection.cur === index) {
      message += chalk.inverse(dateFormat(selection.date, str));
    } else {
      message += dateFormat(selection.date, str);
    }
  });

  this.screen.render(message);
  return this;
};

/**
 * When user press `enter` key
 */

Prompt.prototype.onEnd = function () {
  this.status = 'answered';
  this.render();
  cliCursor.show();
  this.screen.done();
  this.done(this._selection.date);
};

/**
 * When user press a key
 */

Prompt.prototype.onKeypress = function (e) {
  var res;
  var selection = this._selection;
  var isSelectable = function (obj) {
    return typeof obj === 'function';
  };

  if (e.key.name === 'right') {
    res = _.findIndex(selection.elements, isSelectable, selection.cur + 1);
    selection.cur = (res >= 0) ? res : selection.cur;
  } else if (e.key.name === 'left') {
    res = _.findLastIndex(selection.elements, isSelectable, (selection.cur > 0) ? selection.cur - 1 : selection.cur);
    selection.cur = (res >= 0) ? res : selection.cur;
  } else if (e.key.name === 'up') {
    selection.elements[selection.cur](1);
  } else if (e.key.name === 'down') {
    selection.elements[selection.cur](-1);
  }

  this.render();
};
