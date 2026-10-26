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
  const term = new xterm.Terminal({
    cols,
    rows,
    allowProposedApi: true,
    convertEol: true,
  });
  await new Promise<void>((resolve) => term.write(rawOutput, resolve));

  const lines: string[] = [];
  for (let i = 0; i < term.rows; i++) {
    lines.push(term.buffer.active.getLine(i)?.translateToString(true) ?? '');
  }
  term.dispose();

  // Trim trailing empty lines
  while (lines.length > 0 && lines.at(-1) === '') {
    lines.pop();
  }

  return lines.join('\n');
}
