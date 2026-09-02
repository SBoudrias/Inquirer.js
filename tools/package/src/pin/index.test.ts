import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { pinDependencies } from './index.ts';

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => fs.rm(dir, { recursive: true, force: true })));
  tempDirs.length = 0;
});

async function makeTempDir() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'package-pin-'));
  tempDirs.push(dir);
  return dir;
}

async function writeJson(filepath: string, value: unknown) {
  await fs.mkdir(path.dirname(filepath), { recursive: true });
  await fs.writeFile(filepath, JSON.stringify(value, null, 2) + '\n');
}

async function readJson(filepath: string) {
  return JSON.parse(await fs.readFile(filepath, 'utf8')) as unknown;
}

async function writeRootPackage(cwd: string) {
  await writeJson(path.join(cwd, 'package.json'), {
    name: 'root',
    private: true,
    workspaces: ['packages/*'],
  });
}

describe('pinDependencies', () => {
  it('pins caret and tilde ranges to exact versions', async () => {
    const cwd = await makeTempDir();
    await writeRootPackage(cwd);
    const packagePath = path.join(cwd, 'packages/app/package.json');
    await writeJson(packagePath, {
      name: 'app',
      version: '1.0.0',
      dependencies: {
        '@inquirer/type': '^4.1.0',
        chalk: '~5.3.0',
        lodash: '^4.17.21',
      },
    });

    const result = await pinDependencies({
      cwd,
      dependencyNames: ['@inquirer/type', 'chalk'],
    });

    expect(result.unpinnable).toEqual([]);
    expect(await readJson(packagePath)).toMatchObject({
      dependencies: {
        '@inquirer/type': '4.1.0',
        chalk: '5.3.0',
        lodash: '^4.17.21',
      },
    });
    expect(result.pinned).toEqual([
      {
        packagePath: 'packages/app/package.json',
        name: 'app',
        dependencyName: '@inquirer/type',
        range: '^4.1.0',
        exact: '4.1.0',
      },
      {
        packagePath: 'packages/app/package.json',
        name: 'app',
        dependencyName: 'chalk',
        range: '~5.3.0',
        exact: '5.3.0',
      },
    ]);
  });

  it('pins optional dependencies and leaves dev dependencies alone', async () => {
    const cwd = await makeTempDir();
    await writeRootPackage(cwd);
    const packagePath = path.join(cwd, 'packages/app/package.json');
    await writeJson(packagePath, {
      name: 'app',
      version: '1.0.0',
      dependencies: {},
      optionalDependencies: {
        '@inquirer/type': '^4.1.0',
      },
      devDependencies: {
        '@inquirer/type': '^4.1.0',
      },
    });

    const result = await pinDependencies({ cwd, dependencyNames: ['@inquirer/type'] });

    expect(result.pinned.map((pin) => pin.exact)).toEqual(['4.1.0']);
    expect(await readJson(packagePath)).toMatchObject({
      optionalDependencies: { '@inquirer/type': '4.1.0' },
      devDependencies: { '@inquirer/type': '^4.1.0' },
    });
  });

  it('is a no-op for exact specs, workspace protocols, and untouched packages', async () => {
    const cwd = await makeTempDir();
    await writeRootPackage(cwd);
    const pinnedPath = path.join(cwd, 'packages/pinned/package.json');
    const untouchedPath = path.join(cwd, 'packages/untouched/package.json');
    const originalPinned = {
      name: 'pinned',
      version: '1.0.0',
      dependencies: {
        '@inquirer/type': '4.1.0',
      },
    };
    await writeJson(pinnedPath, originalPinned);
    await writeJson(untouchedPath, {
      name: 'untouched',
      version: '1.0.0',
      dependencies: {
        chalk: '^5.3.0',
      },
      devDependencies: {
        '@inquirer/type': 'workspace:^4.1.0',
      },
    });

    const result = await pinDependencies({ cwd, dependencyNames: ['@inquirer/type'] });

    expect(result.pinned).toEqual([]);
    expect(result.unpinnable).toEqual([]);
    expect(await readJson(pinnedPath)).toEqual(originalPinned);
    expect(await readJson(untouchedPath)).toMatchObject({
      dependencies: { chalk: '^5.3.0' },
    });
  });

  it('reports ranges that cannot be pinned to an exact version', async () => {
    const cwd = await makeTempDir();
    await writeRootPackage(cwd);
    const packagePath = path.join(cwd, 'packages/app/package.json');
    await writeJson(packagePath, {
      name: 'app',
      version: '1.0.0',
      dependencies: {
        '@inquirer/type': '>=4.0.0',
      },
    });

    const result = await pinDependencies({ cwd, dependencyNames: ['@inquirer/type'] });

    expect(result.pinned).toEqual([]);
    expect(result.unpinnable).toEqual([
      {
        packagePath: 'packages/app/package.json',
        name: 'app',
        dependencyName: '@inquirer/type',
        range: '>=4.0.0',
      },
    ]);
    expect(await readJson(packagePath)).toMatchObject({
      dependencies: { '@inquirer/type': '>=4.0.0' },
    });
  });

  it('ignores private workspace packages', async () => {
    const cwd = await makeTempDir();
    await writeRootPackage(cwd);
    const packagePath = path.join(cwd, 'packages/private/package.json');
    await writeJson(packagePath, {
      name: 'private-package',
      private: true,
      version: '1.0.0',
      dependencies: {
        '@inquirer/type': '^4.1.0',
      },
    });

    const result = await pinDependencies({ cwd, dependencyNames: ['@inquirer/type'] });

    expect(result.pinned).toEqual([]);
    expect(await readJson(packagePath)).toMatchObject({
      dependencies: { '@inquirer/type': '^4.1.0' },
    });
  });
});
