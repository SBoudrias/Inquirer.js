import { describe, expect, it, onTestFinished, vi } from 'vitest';
import type { PackageJson } from 'type-fest';
import { validateRootPackage } from './root.ts';

const validRoot = { workspaces: ['packages/*'], engines: { node: '>=20.17.0' } };

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

  it.each<PackageJson>([
    { ...validRoot, repository: 'https://gitlab.com/o/r.git' },
    { ...validRoot, repository: { type: 'git', url: 'https://gitlab.com/o/r.git' } },
  ])('warns once, without failing, for a repository not on GitHub (%o)', (rootPkg) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    onTestFinished(() => warn.mockRestore());

    validateRootPackage(rootPkg);

    expect(warn).toHaveBeenCalledOnce();
    expect(warn).toHaveBeenCalledWith(
      'Cannot link package READMEs from repository "https://gitlab.com/o/r.git": only GitHub repositories are supported',
    );
  });

  it.each<PackageJson>([
    validRoot,
    { ...validRoot, repository: 'https://github.com/o/r.git' },
  ])('does not warn for a GitHub or missing repository (%o)', (rootPkg) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    onTestFinished(() => warn.mockRestore());

    validateRootPackage(rootPkg);

    expect(warn).not.toHaveBeenCalled();
  });
});
