#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Builtins, Cli, Command, Option, type BaseContext } from 'clipanion';
import { lintPackages } from './lint.ts';

class LintCommand extends Command {
  static override paths = [['lint']];

  static override usage = Command.Usage({
    description: 'Validate and fix package metadata.',
    examples: [
      ['Fix package metadata', '$0 lint'],
      ['Validate package metadata without writing files', '$0 lint --check'],
    ],
  });

  check = Option.Boolean('--check', false, {
    description: 'Validate package metadata without writing files.',
  });

  override async execute() {
    try {
      const result = await lintPackages({ check: this.check });
      for (const issue of result.issues) {
        this.context.stderr.write(
          `[${issue.status}] ${issue.message} (${issue.packagePath})\n`,
        );
      }

      return result.hasFailures ? 1 : 0;
    } catch (error: unknown) {
      this.context.stderr.write(
        `${error instanceof Error ? error.message : String(error)}\n`,
      );
      return 1;
    }
  }
}

const cli = Cli.from([LintCommand, Builtins.HelpCommand], {
  binaryLabel: 'Package',
  binaryName: 'package',
  enableCapture: false,
});

export async function main(
  argv = process.argv.slice(2),
  context: Partial<BaseContext> = {},
) {
  return cli.run(argv, {
    ...Cli.defaultContext,
    ...context,
  });
}

if (
  process.argv[1] != null &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  process.exitCode = await main();
}
