#!/usr/bin/env node
import { Builtins, Cli, Command, Option } from 'clipanion';
import { setupPackages } from './index.ts';

class SetupCommand extends Command {
  static override paths = [Command.Default];

  static override usage = Command.Usage({
    description:
      'Generate or validate the workspace setup files (package.json metadata & tsconfig.json wiring) across all packages.',
    examples: [
      ['Write the setup files', '$0'],
      ['Validate setup files without writing them; exit 1 on drift', '$0 --check'],
    ],
  });

  check = Option.Boolean('--check', false, {
    description: 'Validate setup files without writing them; exit 1 on drift.',
  });

  override async execute() {
    try {
      const drift = await setupPackages({ check: this.check });

      if (this.check) {
        if (drift.length > 0) {
          for (const file of drift) {
            this.context.stderr.write(`[would fix] ${file}.\n`);
          }
          this.context.stderr.write(
            'Run `yarn setup-packages` to regenerate the setup files above.\n',
          );
          return 1;
        }

        this.context.stdout.write('All workspace setup files are up to date.\n');
      }

      return 0;
    } catch (error: unknown) {
      this.context.stderr.write(
        `${error instanceof Error ? error.message : String(error)}\n`,
      );
      return 1;
    }
  }
}

const cli = Cli.from([SetupCommand, Builtins.HelpCommand], {
  binaryLabel: 'Setup Packages',
  binaryName: 'setup-packages',
  enableCapture: false,
});

await cli.runExit(process.argv.slice(2), Cli.defaultContext);
