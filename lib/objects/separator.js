/**
 * Separator object
 * Used to space/separate choices group
 */


/**
 * Module exports
 */

module.exports = Separator;


/**
 * Separator object
 * @constructor
 * @param {String} line   Separation line content (facultative)
 */

function Separator( line ) {
  this.line = line || "--------";
}


/**
 * Stringify separator
 * @return {String} the separator display string
 */

Separator.prototype.toString = function() {
  return this.line;
};
