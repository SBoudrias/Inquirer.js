import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { normalizeManifests } from './index.ts';

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => fs.rm(dir, { recursive: true, force: true })));
  tempDirs.length = 0;
});

async function makeTempDir() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'package-prepublish-'));
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

describe('normalizeManifests', () => {
  it('removes workspace-protocol dev dependencies from public packages', async () => {
    const cwd = await makeTempDir();
    await writeRootPackage(cwd);
    const packagePath = path.join(cwd, 'packages/app/package.json');
    await writeJson(packagePath, {
      name: 'app',
      version: '1.0.0',
      dependencies: {
        chalk: '^5.3.0',
      },
      devDependencies: {
        '@repo/tsconfig': 'workspace:*',
        '@inquirer/testing': 'workspace:*',
        typescript: '^5.8.2',
        '@repo/custom-config': 'workspace:^1.0.0',
      },
    });

    const result = await normalizeManifests({ cwd });

    expect(result).toEqual([
      {
        kind: 'remove-workspace-dev-dependency',
        packagePath: 'packages/app/package.json',
        name: 'app',
        dependencyName: '@repo/tsconfig',
      },
      {
        kind: 'remove-workspace-dev-dependency',
        packagePath: 'packages/app/package.json',
        name: 'app',
        dependencyName: '@inquirer/testing',
      },
    ]);
    expect(await readJson(packagePath)).toMatchObject({
      dependencies: { chalk: '^5.3.0' },
      devDependencies: {
        typescript: '^5.8.2',
        '@repo/custom-config': 'workspace:^1.0.0',
      },
    });
  });

  it('empties the devDependencies field when every entry uses the workspace protocol', async () => {
    const cwd = await makeTempDir();
    await writeRootPackage(cwd);
    const packagePath = path.join(cwd, 'packages/app/package.json');
    await writeJson(packagePath, {
      name: 'app',
      version: '1.0.0',
      devDependencies: {
        '@repo/tsconfig': 'workspace:*',
      },
    });

    await normalizeManifests({ cwd });

    expect(await readJson(packagePath)).toMatchObject({
      devDependencies: {},
    });
  });

  it('ignores private packages and packages without dev dependencies', async () => {
    const cwd = await makeTempDir();
    await writeRootPackage(cwd);
    const privatePath = path.join(cwd, 'packages/private/package.json');
    const cleanPath = path.join(cwd, 'packages/clean/package.json');
    await writeJson(privatePath, {
      name: 'private-package',
      private: true,
      version: '1.0.0',
      devDependencies: {
        '@repo/tsconfig': 'workspace:*',
      },
    });
    await writeJson(cleanPath, {
      name: 'clean',
      version: '1.0.0',
    });

    const result = await normalizeManifests({ cwd });

    expect(result).toEqual([]);
    expect(await readJson(privatePath)).toMatchObject({
      devDependencies: { '@repo/tsconfig': 'workspace:*' },
    });
  });

  it('is a no-op when there is nothing to fix', async () => {
    const cwd = await makeTempDir();
    await writeRootPackage(cwd);
    const packagePath = path.join(cwd, 'packages/app/package.json');
    const original = {
      name: 'app',
      version: '1.0.0',
      devDependencies: {
        typescript: '^5.8.2',
      },
    };
    await writeJson(packagePath, original);

    const result = await normalizeManifests({ cwd });

    expect(result).toEqual([]);
    expect(await readJson(packagePath)).toEqual(original);
  });
});
