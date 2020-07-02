'use strict';

const _ = {
  flatten: require('lodash/flatten'),
};
const chalk = require('chalk');
const cliWidth = require('cli-width');
const { breakLines } = require('./utils');

/**
 * The paginator keeps track of a pointer index in a list and returns
 * a subset of the choices if the list is too long.
 */

class Paginator {
  constructor(rl) {
    this.pointer = 0;
    this.lastIndex = 0;
    this.rl = rl;
  }

  paginate(output, active, pageSize) {
    pageSize = pageSize || 7;
    const middleOfList = Math.floor(pageSize / 2);

    // TODO: I've remove the dependency on readline here. But we should refactor the
    // paginator to also rely on hook.
    const width = cliWidth({ defaultWidth: 80, output: process.stdout });
    let lines = breakLines(output, width).split('\n');

    // Make sure there's enough lines to paginate
    if (lines.length <= pageSize) {
      return output;
    }

    // Move the pointer only when the user go down and limit it to the middle of the list
    if (
      this.pointer < middleOfList &&
      this.lastIndex < active &&
      active - this.lastIndex < pageSize
    ) {
      this.pointer = Math.min(middleOfList, this.pointer + active - this.lastIndex);
    }

    this.lastIndex = active;

    // Duplicate the lines so it give an infinite list look
    const infinite = _.flatten([lines, lines, lines]);
    const topIndex = Math.max(0, active + lines.length - this.pointer);

    const section = infinite.splice(topIndex, pageSize).join('\n');
    return section + '\n' + chalk.dim('(Move up and down to reveal more choices)');
  }
}

module.exports = Paginator;
