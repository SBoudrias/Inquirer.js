import { Command, Option } from 'clipanion';
import { pinDependencies } from './index.ts';

export class PinCommand extends Command {
  static override paths = [['pin']];

  static override usage = Command.Usage({
    description: 'Pin exact versions of workspace dependencies.',
    examples: [['Pin a dependency across all public packages', '$0 pin @inquirer/type']],
  });

  dependencyName = Option.String({ required: true });

  override async execute() {
    try {
      const result = await pinDependencies({
        dependencyNames: [this.dependencyName],
      });

      for (const pin of result.pinned) {
        this.context.stdout.write(
          `[fixed] ${pin.name}: pinned ${pin.dependencyName} from "${pin.range}" to "${pin.exact}".\n`,
        );
      }
      for (const unpinnable of result.unpinnable) {
        this.context.stderr.write(
          `[error] ${unpinnable.name} declares ${unpinnable.dependencyName} with an unsupported range "${unpinnable.range}" (${unpinnable.packagePath})\n`,
        );
      }

      return result.unpinnable.length > 0 ? 1 : 0;
    } catch (error: unknown) {
      this.context.stderr.write(
        `${error instanceof Error ? error.message : String(error)}\n`,
      );
      return 1;
    }
  }
}
