import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it, onTestFinished } from 'vitest';
import type { PackageJson } from 'type-fest';
import { applyMetadataRules, cleanupPackage } from './metadata.ts';

const options = {
  rootPkg: {
    name: 'root',
    author: 'Root Author',
    license: 'MIT',
    keywords: ['inquirer', 'prompt'],
    repository: { type: 'git', url: 'https://github.com/SBoudrias/Inquirer.js.git' },
    engines: { node: '>=20.17.0' },
  },
  dir: 'packages/app',
};

async function makePackageDirWithReadme() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'setup-metadata-'));
  onTestFinished(() => fs.rm(dir, { recursive: true, force: true }));
  await fs.writeFile(path.join(dir, 'README.md'), '');
  return dir;
}

describe('applyMetadataRules', () => {
  it('fills missing structures without clobbering existing values', async () => {
    const pkg: PackageJson = { name: 'app', private: true, sideEffects: ['./a.ts'] };

    await applyMetadataRules(pkg, options);

    expect(pkg.scripts).toEqual({});
    expect(pkg.sideEffects).toEqual(['./a.ts']);
  });

  it('keeps a valid subset engines.node range and replaces any other', async () => {
    const engines = async (node?: string) => {
      const pkg: PackageJson = { private: true, engines: node ? { node } : {} };
      await applyMetadataRules(pkg, options);
      return pkg.engines?.['node'];
    };

    expect(await engines('>=22.0.0')).toBe('>=22.0.0');
    expect(await engines('>=18')).toBe('>=20.17.0');
    expect(await engines()).toBe('>=20.17.0');
  });

  it('mirrors the root metadata on public packages and links the README', async () => {
    const dir = await makePackageDirWithReadme();
    const pkg: PackageJson = { name: '@inquirer/app', keywords: ['prompt'] };

    await applyMetadataRules(pkg, { ...options, dir });

    expect(pkg).toMatchObject({
      author: 'Root Author',
      license: 'MIT',
      keywords: ['inquirer', 'prompt'],
      publishConfig: { access: 'public' },
      homepage: `https://github.com/SBoudrias/Inquirer.js/blob/HEAD/${dir}/README.md`,
    });
  });

  it.each([
    'https://github.com/o/r.git',
    'git+https://github.com/o/r.git',
    'git+ssh://git@github.com/o/r.git',
    'git@github.com:o/r.git',
    'github:o/r',
    'o/r',
  ])('links the README from the %s repository', async (repository) => {
    const dir = await makePackageDirWithReadme();
    const pkg: PackageJson = { name: '@inquirer/app' };

    await applyMetadataRules(pkg, {
      dir,
      rootPkg: { ...options.rootPkg, repository },
    });

    expect(pkg.homepage).toBe(`https://github.com/o/r/blob/HEAD/${dir}/README.md`);
  });

  it('sets no homepage for a repository that is not on GitHub', async () => {
    const pkg: PackageJson = { name: '@inquirer/app' };

    await applyMetadataRules(pkg, {
      dir: await makePackageDirWithReadme(),
      rootPkg: { ...options.rootPkg, repository: 'https://gitlab.com/o/r.git' },
    });

    expect(pkg.homepage).toBeUndefined();
  });

  it('sets no homepage without a README or a root repository', async () => {
    const noReadme: PackageJson = { name: '@inquirer/app' };
    await applyMetadataRules(noReadme, options);
    expect(noReadme.homepage).toBeUndefined();

    const noRepository: PackageJson = { name: '@inquirer/app' };
    const { repository: _, ...rootPkg } = options.rootPkg;
    await applyMetadataRules(noRepository, {
      dir: await makePackageDirWithReadme(),
      rootPkg,
    });
    expect(noRepository.homepage).toBeUndefined();
  });
});

describe('cleanupPackage', () => {
  it('strips publishing fields from private packages and drops empty objects', () => {
    const pkg: PackageJson = {
      name: 'app',
      private: true,
      author: 'x',
      keywords: ['k'],
      publishConfig: { access: 'public' },
      files: ['dist'],
      scripts: {},
    };

    expect(cleanupPackage(pkg)).toEqual({ name: 'app', private: true });
  });
});
