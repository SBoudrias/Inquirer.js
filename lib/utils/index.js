'use strict';

var utils = require('lazy-cache')(require);

/**
 * Lazily required module dependencies
 */

utils('ansi-escapes');
utils('ansi-regex');
utils('chalk');
utils('cli-cursor');
utils('cli-width');
utils('figures');
utils('lodash', '_');
utils('readline2');
utils('run-async');
utils('rx-lite');
utils('strip-ansi');
utils('through');

/**
 * Expose `utils` modules
 */

module.exports = utils;
