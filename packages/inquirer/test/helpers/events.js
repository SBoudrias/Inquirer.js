/**
 * Automatically trigger a line event on the readline on each prompt
 */
exports.autosubmit = function(ui) {
  ui.process.subscribe(() => {
    // Use setTimeout because async properties on the following question object will still
    // be processed when we receive the subscribe event.
    setTimeout(() => {
      ui.rl.emit('line');
    }, 5);
  });
  ui.rl.emit('line');
};
