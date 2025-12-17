import cliWidth from 'cli-width';
import { readline } from './hook-engine.ts';
/**
 * Force line returns at specific width. This function is ANSI code friendly and it'll
 * ignore invisible codes during width calculation.
 * @param {string} content
 * @param {number} width
 * @return {string}
 */
export function breakLines(content: string, width: number): string {
  const lines = content.split('\n');
  const result: string[] = [];

  for (const line of lines) {
    let currentLine = '';
    let visibleLength = 0;
    let escapeSequence = '';
    let inEscape = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i]!;

      // Detect start of ANSI escape code
      if (char === '\x1b') {
        inEscape = true;
        escapeSequence += char;
        continue;
      }

      // If inside an escape sequence, accumulate it but don't count width
      if (inEscape) {
        escapeSequence += char;

        if (/[a-zA-Z]/.test(char)) {
          inEscape = false;
          currentLine += escapeSequence;
          escapeSequence = '';
        }
        continue;
      }

      // Normal character: Add to line and increment visual width
      currentLine += char;
      visibleLength++;

      // Hard Wrap: If we reached the width limit
      if (visibleLength === width) {
        result.push(currentLine);
        currentLine = '';
        visibleLength = 0;
      }
    }

    if (currentLine.length > 0 || result.length === 0) {
      result.push(currentLine.trimEnd());
    }
  }

  return result.join('\n');
}

/**
 * Returns the width of the active readline, or 80 as default value.
 * @returns {number}
 */
export function readlineWidth(): number {
  return cliWidth({ defaultWidth: 80, output: readline().output });
}
