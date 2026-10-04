import cliWidth from 'cli-width';
import { wrapAnsi } from 'fast-wrap-ansi';
import { readline } from './hook-engine.ts';

/**
 * Force line returns at specific width. This function is ANSI code friendly and it'll
 * ignore invisible codes during width calculation.
 * @param {string} content
 * @param {number} width
 * @return {string}
 */
export function breakLines(content: string, width: number): string {
  return content
    .split('\n')
    .flatMap((line) =>
      wrapAnsi(line, width, { trim: false, wordWrap: false })
        .split('\n')
        .map((str) => str.trimEnd()),
    )
    .join('\n');
}

/**
 * Returns the width of the active readline, or 80 as default value.
 * @returns {number}
 */
export function readlineWidth(): number {
  try {
    return cliWidth({ defaultWidth: 80, output: readline().output });
  } catch {
    // cli-width reads `process.env.CLI_WIDTH` as a last resort, which throws
    // on runtimes denying env access (e.g. Deno without --allow-env).
    return 80;
  }
}
