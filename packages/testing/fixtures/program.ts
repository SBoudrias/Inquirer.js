import input from '@inquirer/input';
import { confirm, editor, select, Separator } from '@inquirer/prompts';

/**
 * Fixture CLI program for the @inquirer/testing adapter suites.
 *
 * A standard Inquirer flow built from the real prompt packages, exercising
 * every auto-mock path the adapters install: a default-imported package
 * (input) and named imports through the @inquirer/prompts barrel (select
 * with a Separator, editor, confirm). The adapters' auto-mocks intercept
 * these imports and redirect the prompts to the shared test screen —
 * running this program under an adapter tests exactly that machinery.
 *
 * Returns the collected answers. No `import.meta` here: the Jest suite
 * runs this through a CommonJS transform.
 */
export async function main(): Promise<{
  name: string;
  flavor: string;
  notes: string;
  again: boolean;
}> {
  const name = await input({ message: 'Your name' });
  const flavor = await select({
    message: 'Favorite flavor',
    choices: [
      { name: 'vanilla', value: 'vanilla' },
      { name: 'chocolate', value: 'chocolate' },
      { name: 'strawberry', value: 'strawberry' },
      new Separator('---'),
    ],
  });
  const notes = await editor({ message: 'Notes' });
  const again = await confirm({ message: 'Order again?', default: true });

  return { name, flavor, notes, again };
}
