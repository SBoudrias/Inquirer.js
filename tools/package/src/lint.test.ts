import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { lintPackages } from './lint.ts';

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => fs.rm(dir, { recursive: true, force: true })));
  tempDirs.length = 0;
});

async function makeTempDir() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'package-lint-'));
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

async function writeRootPackage(cwd: string, nodeRange = '>=20.17.0') {
  await writeJson(path.join(cwd, 'package.json'), {
    name: 'root',
    private: true,
    workspaces: ['packages/*'],
    engines: {
      node: nodeRange,
    },
  });
}

async function writeDependencyPackage(cwd: string, packageJson: unknown) {
  const packageName =
    packageJson != null && typeof packageJson === 'object' && 'name' in packageJson
      ? String(packageJson.name)
      : 'dependency';
  await writeJson(
    path.join(cwd, 'node_modules', packageName, 'package.json'),
    packageJson,
  );
}

describe('lintPackages', () => {
  it('lints a single-package project without workspaces', async () => {
    const cwd = await makeTempDir();
    const packagePath = path.join(cwd, 'package.json');
    await writeJson(packagePath, {
      name: 'app',
      version: '1.0.0',
      engines: {
        node: '>=20.17.0',
      },
      exports: './src/index.ts',
    });

    const result = await lintPackages({ cwd });
    const pkg = await readJson(packagePath);

    expect(result).toMatchObject({
      hasFailures: false,
      issues: [
        expect.objectContaining({
          status: 'fixed',
          message: 'app must export ./package.json.',
        }),
      ],
    });
    expect(pkg).toMatchObject({
      exports: {
        '.': './src/index.ts',
        './package.json': './package.json',
      },
    });
  });

  it('autofixes peer hoists, engine defaults, and package.json exports', async () => {
    const cwd = await makeTempDir();
    const packagePath = path.join(cwd, 'packages/app/package.json');
    await writeRootPackage(cwd);
    await writeDependencyPackage(cwd, {
      name: 'uses-react',
      version: '1.0.0',
      peerDependencies: {
        react: '^19.0.0',
      },
      peerDependenciesMeta: {
        react: {
          optional: true,
        },
      },
      engines: {
        node: '>=18',
      },
    });
    await writeJson(packagePath, {
      name: 'app',
      version: '1.0.0',
      exports: {
        '.': './src/index.ts',
      },
      dependencies: {
        'uses-react': '^1.0.0',
      },
    });

    const result = await lintPackages({ cwd });
    const pkg = await readJson(packagePath);

    expect(result.hasFailures).toBe(false);
    expect(result.issues.every((issue) => issue.status === 'fixed')).toBe(true);
    expect(pkg).toMatchObject({
      engines: {
        node: '>=20.17.0',
      },
      exports: {
        '.': './src/index.ts',
        './package.json': './package.json',
      },
      peerDependencies: {
        react: '^19.0.0',
      },
      peerDependenciesMeta: {
        react: {
          optional: true,
        },
      },
    });
  });

  it('reports autofixable issues without writing files in check mode', async () => {
    const cwd = await makeTempDir();
    const packagePath = path.join(cwd, 'packages/app/package.json');
    const originalPackageJson = {
      name: 'app',
      version: '1.0.0',
      exports: './src/index.ts',
    };
    await writeRootPackage(cwd);
    await writeJson(packagePath, originalPackageJson);

    const result = await lintPackages({ cwd, check: true });
    const pkg = await readJson(packagePath);

    expect(result.hasFailures).toBe(true);
    expect(result.issues).toEqual([
      expect.objectContaining({
        status: 'would fix',
        message:
          'app must define an engines.node range within the root range ">=20.17.0".',
      }),
      expect.objectContaining({
        status: 'would fix',
        message: 'app must export ./package.json.',
      }),
    ]);
    expect(pkg).toEqual(originalPackageJson);
  });

  it('ignores private workspace packages', async () => {
    const cwd = await makeTempDir();
    const packagePath = path.join(cwd, 'packages/private/package.json');
    const originalPackageJson = {
      name: 'private-package',
      private: true,
      version: '1.0.0',
    };
    await writeRootPackage(cwd);
    await writeJson(packagePath, originalPackageJson);

    const result = await lintPackages({ cwd });

    expect(result).toMatchObject({
      hasFailures: false,
      issues: [],
    });
    expect(await readJson(packagePath)).toEqual(originalPackageJson);
  });

  it('fails when a dependency supports a narrower engine range', async () => {
    const cwd = await makeTempDir();
    await writeRootPackage(cwd);
    await writeDependencyPackage(cwd, {
      name: 'new-node-only',
      version: '1.0.0',
      engines: {
        node: '>=22.0.0',
      },
    });
    await writeJson(path.join(cwd, 'packages/app/package.json'), {
      name: 'app',
      version: '1.0.0',
      exports: {
        './package.json': './package.json',
      },
      dependencies: {
        'new-node-only': '^1.0.0',
      },
      engines: {
        node: '>=20.17.0',
      },
    });

    const result = await lintPackages({ cwd });

    expect(result.hasFailures).toBe(true);
    expect(result.issues).toEqual([
      expect.objectContaining({
        status: 'error',
        message: 'app supports node ">=20.17.0", but new-node-only supports ">=22.0.0".',
      }),
    ]);
  });

  it('accepts manually narrowed engine ranges', async () => {
    const cwd = await makeTempDir();
    await writeRootPackage(cwd);
    await writeDependencyPackage(cwd, {
      name: 'new-node-only',
      version: '1.0.0',
      engines: {
        node: '>=22.0.0',
      },
    });
    await writeJson(path.join(cwd, 'packages/app/package.json'), {
      name: 'app',
      version: '1.0.0',
      exports: {
        './package.json': './package.json',
      },
      dependencies: {
        'new-node-only': '^1.0.0',
      },
      engines: {
        node: '>=22.0.0',
      },
    });

    const result = await lintPackages({ cwd });

    expect(result).toMatchObject({
      hasFailures: false,
      issues: [],
    });
  });
});
