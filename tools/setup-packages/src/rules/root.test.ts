import { describe, expect, it } from 'vitest';
import type { PackageJson } from 'type-fest';
import { validateRootPackage } from './root.ts';

describe('validateRootPackage', () => {
  it('returns the root package with its workspaces and engines.node', () => {
    expect(
      validateRootPackage({
        name: 'root',
        workspaces: ['packages/*'],
        engines: { node: '>=20.17.0', npm: '>=10' },
      }),
    ).toEqual({
      name: 'root',
      workspaces: ['packages/*'],
      engines: { node: '>=20.17.0', npm: '>=10' },
    });
  });

  it.each<PackageJson>([
    { name: 'root', engines: { node: '>=20.17.0' } },
    { name: 'root', workspaces: ['packages/*'] },
    { name: 'root', workspaces: ['packages/*'], engines: { node: 'not a range' } },
  ])('requires workspaces and a valid engines.node range (%o)', (rootPkg) => {
    expect(() => validateRootPackage(rootPkg)).toThrow(
      'The scaffolding tool requires `workspaces` and `engines.node` in the root package.json',
    );
  });
});
