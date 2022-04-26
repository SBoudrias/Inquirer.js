const wrapAnsi = require('wrap-ansi');

/**
 * Force line returns at specific width. This function is ANSI code friendly and it'll
 * ignore invisible codes during width calculation.
 * @param {string} content
 * @param {number} width
 * @return {string}
 */
exports.breakLines = (content, width) =>
  content
    .split('\n')
    .map((line) => wrapAnsi(line, width, { trim: false, hard: true }))
    .join('\n');
