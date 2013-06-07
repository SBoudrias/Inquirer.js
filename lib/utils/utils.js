/**
 * Utility functions
 */

"use strict";
var _ = require("lodash");

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
