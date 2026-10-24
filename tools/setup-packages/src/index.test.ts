import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { setupPackages } from './index.ts';

const tempDirs: string[] = [];
const originalCwd = process.cwd();

afterEach(async () => {
  process.chdir(originalCwd);
  await Promise.all(tempDirs.map((dir) => fs.rm(dir, { recursive: true, force: true })));
  tempDirs.length = 0;
});

async function makeTempDir() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'setup-packages-'));
  tempDirs.push(dir);
  return dir;
}

async function writeJson(filepath: string, value: unknown) {
  await fs.mkdir(path.dirname(filepath), { recursive: true });
  await fs.writeFile(filepath, JSON.stringify(value, null, 2) + '\n');
}

async function readJson(filepath: string): Promise<Record<string, unknown>> {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return JSON.parse(await fs.readFile(filepath, 'utf8')) as Record<string, unknown>;
}

async function makeWorkspace() {
  const cwd = await makeTempDir();
  await writeJson(path.join(cwd, 'package.json'), {
    name: 'root',
    private: true,
    workspaces: ['packages/*'],
    engines: { node: '>=20.17.0' },
  });
  return cwd;
}

describe('setupPackages', () => {
  it('writes missing setup files in write mode', async () => {
    const cwd = await makeWorkspace();
    await writeJson(path.join(cwd, 'packages/app/package.json'), {
      name: 'app',
      version: '1.0.0',
      private: true,
      exports: { '.': './src/index.ts' },
    });
    await fs.mkdir(path.join(cwd, 'packages/app/src'), { recursive: true });
    await fs.writeFile(path.join(cwd, 'packages/app/src/index.ts'), '');
    process.chdir(cwd);

    const drift = await setupPackages({ check: false });

    expect(drift).toEqual([]);
    // tsconfig.json was generated
    expect(
      JSON.parse(await fs.readFile(path.join(cwd, 'packages/app/tsconfig.json'), 'utf8')),
    ).toMatchObject({ extends: '@repo/tsconfig' });
    // package.json gained the wiring
    expect(await readJson(path.join(cwd, 'packages/app/package.json'))).toMatchObject({
      engines: { node: '>=20.17.0' },
      scripts: { tsc: 'tsc' },
    });
  });

  it('reports drift without writing files in check mode', async () => {
    const cwd = await makeWorkspace();
    const packagePath = path.join(cwd, 'packages/app/package.json');
    const originalPackageJson = {
      name: 'app',
      version: '1.0.0',
      private: true,
      exports: { '.': './src/index.ts' },
    };
    await writeJson(packagePath, originalPackageJson);
    await fs.mkdir(path.join(cwd, 'packages/app/src'), { recursive: true });
    await fs.writeFile(path.join(cwd, 'packages/app/src/index.ts'), '');
    process.chdir(cwd);

    const drift = await setupPackages({ check: true });

    const outdated = drift.find((line) => line.includes('package.json is outdated'));
    expect(outdated).toContain('engines');
    expect(drift).toContain(
      `${path.join('packages', 'app', 'tsconfig.json')} is missing`,
    );
    // Nothing was written
    expect(await readJson(packagePath)).toEqual(originalPackageJson);
    expect(
      await fs.access(path.join(cwd, 'packages/app/tsconfig.json')).then(
        () => true,
        () => false,
      ),
    ).toBe(false);
  });

  it('reports no drift once files are normalized', async () => {
    const cwd = await makeWorkspace();
    await writeJson(path.join(cwd, 'packages/app/package.json'), {
      name: 'app',
      version: '1.0.0',
      private: true,
      exports: { '.': './src/index.ts' },
    });
    await fs.mkdir(path.join(cwd, 'packages/app/src'), { recursive: true });
    await fs.writeFile(path.join(cwd, 'packages/app/src/index.ts'), '');
    process.chdir(cwd);

    await setupPackages({ check: false });
    const drift = await setupPackages({ check: true });

    expect(drift).toEqual([]);
  });

  it('reports drift when a generated file is stale', async () => {
    const cwd = await makeWorkspace();
    await writeJson(path.join(cwd, 'packages/app/package.json'), {
      name: 'app',
      version: '1.0.0',
      private: true,
      exports: { '.': './src/index.ts' },
    });
    await fs.mkdir(path.join(cwd, 'packages/app/src'), { recursive: true });
    await fs.writeFile(path.join(cwd, 'packages/app/src/index.ts'), '');
    process.chdir(cwd);

    await setupPackages({ check: false });

    // Introduce drift by hand
    const packagePath = path.join(cwd, 'packages/app/package.json');
    await writeJson(packagePath, {
      ...(await readJson(packagePath)),
      scripts: { tsc: 'tsc --skipLibCheck' },
    });

    const drift = await setupPackages({ check: true });

    expect(drift).toEqual([
      `${path.join('packages', 'app', 'package.json')} is outdated (scripts.tsc)`,
    ]);
  });

  it('ignores array and object key ordering differences (oxfmt normalizes them)', async () => {
    const cwd = await makeWorkspace();
    await writeJson(path.join(cwd, 'packages/app/package.json'), {
      name: 'app',
      version: '1.0.0',
      keywords: ['zebra', 'apple'],
      exports: { '.': './src/index.ts' },
    });
    await fs.mkdir(path.join(cwd, 'packages/app/src'), { recursive: true });
    await fs.writeFile(path.join(cwd, 'packages/app/src/index.ts'), '');
    process.chdir(cwd);

    await setupPackages({ check: false });

    // Reorder the keywords array and the top-level object keys
    const packagePath = path.join(cwd, 'packages/app/package.json');
    const pkg = await readJson(packagePath);
    const keywords = pkg['keywords'];
    if (!Array.isArray(keywords)) {
      throw new TypeError('expected the normalized package.json to have keywords');
    }
    await writeJson(packagePath, {
      ...Object.fromEntries(Object.entries(pkg).toReversed()),
      keywords: keywords.toReversed(),
    });

    const drift = await setupPackages({ check: true });

    expect(drift).toEqual([]);
  });
});
