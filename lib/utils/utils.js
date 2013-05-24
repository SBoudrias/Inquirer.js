/**
 * Utility functions
 */

"use strict";
var _ = require("lodash");
var charm = process.charm;

/**
 * Module exports
 */

var utils = module.exports;

// Normalize choices object keys
utils.normalizeChoices = function normalizeChoices(choices) {
  return _.map(choices, function(val) {
    if (_.isString(val)) {
      return { name : val, value: val };
    }

    return {
      name: val.name || val.value,
      value: val.value || val.name
    };
  });
};

// Delete `n` number of lines
utils.cleanLine = function cleanLine(n) {
  n || (n = 1);

  // Erase current line
  charm.erase("line");

  // Go up and erase
  _.each(_.range(n - 1), function() {
    charm.up(1).erase("line");
  });
};
