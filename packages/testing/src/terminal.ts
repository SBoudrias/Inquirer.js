import { Terminal } from '@xterm/headless';

export async function interpretTerminalOutput(
  rawOutput: string,
  cols: number = 10_000,
  rows: number = 4000,
): Promise<string> {
  const term = new Terminal({ cols, rows, allowProposedApi: true, convertEol: true });
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
