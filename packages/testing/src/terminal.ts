import * as xtermModule from '@xterm/headless';

type Xterm = typeof xtermModule;

// @xterm/headless is a CommonJS bundle. Node's ESM loader only exposes it as
// `default` (its exports aren't statically detectable), while CommonJS
// transforms (e.g. Jest + SWC) expose `Terminal` on the namespace directly.
function resolveXterm(mod: Xterm | { default: Xterm }): Xterm {
  return 'Terminal' in mod ? mod : mod.default;
}
const xterm = resolveXterm(xtermModule);

export async function interpretTerminalOutput(
  rawOutput: string,
  cols: number = 10_000,
  rows: number = 4000,
): Promise<string> {
  // Size the viewport to the output's line count (bounded by `rows`, with any
  // remainder kept as scrollback) instead of always pre-allocating 4000 rows:
  // xterm initializes every viewport row upfront, which dominates test runtime
  // when rendering short prompt sessions.
  let newlines = 0;
  for (let i = 0; i < rawOutput.length; i++) {
    if (rawOutput.charCodeAt(i) === 10) newlines++;
  }
  const viewportRows = Math.min(rows, Math.max(24, newlines + 16));
  const scrollback = Math.max(0, rows - viewportRows);

  const term = new xterm.Terminal({
    cols,
    rows: viewportRows,
    scrollback,
    allowProposedApi: true,
    convertEol: true,
  });
  await new Promise<void>((resolve) => term.write(rawOutput, resolve));

  const buffer = term.buffer.active;
  const lines: string[] = [];
  for (let i = 0; i < buffer.length; i++) {
    lines.push(buffer.getLine(i)?.translateToString(true) ?? '');
  }
  term.dispose();

  // Trim trailing empty lines
  while (lines.length > 0 && lines.at(-1) === '') {
    lines.pop();
  }

  return lines.join('\n');
}
