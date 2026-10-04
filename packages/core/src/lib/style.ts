import process from 'node:process';
import { styleText as nodeStyleText } from 'node:util';
import { canReadEnv } from '@inquirer/type';

// `InspectColor` is not part of Deno's `node:util` types, so it cannot be
// imported by name; deriving it from the function keeps the exact same type.
type StyleTextFormat = Parameters<typeof nodeStyleText>[0];

type StyleTextOptions = {
  validateStream?: boolean;
  stream?: NodeJS.WritableStream & { isTTY?: boolean };
};

// Probed once at module load: on the runtimes we guard against (Deno without
// `--allow-env`), the permission cannot be granted mid-process.
const envReadable: boolean = canReadEnv();

/**
 * Colorizes text like `node:util`'s `styleText`, without requiring access to
 * environment variables.
 *
 * The Node implementation probes `NO_COLOR`/`NODE_DISABLE_COLORS` to decide
 * whether colors are enabled, which throws on runtimes denying env access
 * (e.g. Deno without `--allow-env`) as soon as the output stream is a TTY.
 * When env variables cannot be read, the same TTY check is performed and
 * colors are otherwise assumed to be supported: with `NO_COLOR` unreadable,
 * `true` is the sensible default.
 */
export function styleText(
  format: StyleTextFormat,
  text: string,
  options?: StyleTextOptions,
): string {
  if (envReadable) {
    return nodeStyleText(format, text, options);
  }

  const stream = options?.stream ?? process.stdout;
  if (options?.validateStream === false || stream.isTTY) {
    return nodeStyleText(format, text, { ...options, validateStream: false });
  }

  // Non-TTY streams never receive colors, matching node:util's behavior.
  return text;
}
