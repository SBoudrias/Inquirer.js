export function withEditableTerminal<Value>(create: () => Value): Value {
  const term = process.env['TERM'];
  if (term === 'dumb') process.env['TERM'] = 'xterm-256color';
  try {
    return create();
  } finally {
    if (term === 'dumb') process.env['TERM'] = term;
  }
}
