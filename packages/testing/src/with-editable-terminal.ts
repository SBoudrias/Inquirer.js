// Node's readline disables line editing (backspace, arrows, etc.) when
// `TERM=dumb` is set, regardless of whether the input is a real terminal.
// Environments like GitLab CI or Emacs shells set `TERM=dumb`, which would
// silently break the keypress simulation the testing adapters drive. The
// check only happens when the readline interface is created (synchronously
// inside the prompt constructor), so overriding `TERM` for the construction
// alone is sufficient — later keypresses are handled by the interface that
// already exists and never re-read `TERM`.
// @see https://github.com/SBoudrias/Inquirer.js/issues/2180
export function withEditableTerminal<Value>(create: () => Value): Value {
  const term = process.env['TERM'];
  if (term === 'dumb') process.env['TERM'] = 'xterm-256color';
  try {
    return create();
  } finally {
    if (term === 'dumb') process.env['TERM'] = term;
  }
}
