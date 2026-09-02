import { Command, Option } from 'clipanion';
import { lintPackages } from './index.ts';

export class LintCommand extends Command {
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
