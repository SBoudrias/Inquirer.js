import { Command } from 'clipanion';
import { normalizeManifests } from './index.ts';

export class NormalizeCommand extends Command {
  static override paths = [['normalize']];

  static override usage = Command.Usage({
    description: 'Fix workspace manifests so they are valid for npm publishing.',
    examples: [['Fix manifests before packing tarballs', '$0 normalize']],
  });

  override async execute() {
    try {
      const fixups = await normalizeManifests();

      for (const fixup of fixups) {
        this.context.stdout.write(
          `[fixed] ${fixup.name}: removed workspace dev dependency ${fixup.dependencyName}.\n`,
        );
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
