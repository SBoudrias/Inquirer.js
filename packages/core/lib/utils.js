/**
 * Force line returns at specific width. This function is ANSI code friendly and it'll
 * ignore invisible codes during width calculation.
 * @param {string} content
 * @param {number} width
 * @return {string}
 */
exports.breakLines = (content, width) => {
  const regex = new RegExp('(?:(?:\\033[[0-9;]*m)*.?){1,' + width + '}', 'g');
  return content
    .split('\n')
    .flatMap((line) => {
      const chunk = line.match(regex);
      // Remove the last match as it's always empty
      chunk.pop();
      return chunk || '';
    })
    .join('\n');
};
