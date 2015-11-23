'use strict';
var utils = require("../utils/");

/**
 * Separator object
 * Used to space/separate choices group
 * @constructor
 * @param {String} line   Separation line content (facultative)
 */

var Separator = module.exports = function (line) {
  this.type = 'separator';
  this.line = utils.chalk.dim(line || new Array(15).join(utils.figures.line));
};

/**
 * Helper function returning false if object is a separator
 * @param  {Object} obj object to test against
 * @return {Boolean}    `false` if object is a separator
 */

Separator.exclude = function (obj) {
  return obj.type !== 'separator';
};

/**
 * Stringify separator
 * @return {String} the separator display string
 */

Separator.prototype.toString = function () {
  return this.line;
};
