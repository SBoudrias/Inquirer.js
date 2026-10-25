import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { setupPackages } from './index.ts';
import { fileExists, readJSONFile } from './utils/fs.ts';

const tempDirs: string[] = [];
const originalCwd = process.cwd();
const originalArgv = process.argv;
const originalExitCode = process.exitCode;

afterEach(async () => {
  process.chdir(originalCwd);
  process.argv = originalArgv;
  process.exitCode = originalExitCode;
  vi.restoreAllMocks();
  await Promise.all(tempDirs.map((dir) => fs.rm(dir, { recursive: true, force: true })));
  tempDirs.length = 0;
});

async function writeJson(filepath: string, value: unknown) {
  await fs.mkdir(path.dirname(filepath), { recursive: true });
  await fs.writeFile(filepath, JSON.stringify(value, null, 2) + '\n');
}

/**
 * Create a one-package workspace in a temp dir, with the given app
 * package.json, and chdir into it.
 */
async function makeWorkspace(
  app: Record<string, unknown> = {
    name: 'app',
    version: '1.0.0',
    private: true,
    exports: { '.': './src/index.ts' },
  },
) {
  const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'setup-packages-'));
  tempDirs.push(cwd);
  await writeJson(path.join(cwd, 'package.json'), {
    name: 'root',
    private: true,
    workspaces: ['packages/*'],
    engines: { node: '>=20.17.0' },
  });
  await writeJson(path.join(cwd, 'packages/app/package.json'), app);
  await fs.mkdir(path.join(cwd, 'packages/app/src'), { recursive: true });
  await fs.writeFile(path.join(cwd, 'packages/app/src/index.ts'), '');
  process.chdir(cwd);
  return cwd;
}

describe('setupPackages', () => {
  it('writes missing setup files in write mode', async () => {
    await makeWorkspace();

    const drift = await setupPackages({ check: false });

    expect(drift).toEqual([]);
    expect(await readJSONFile('packages/app/tsconfig.json')).toMatchObject({
      extends: '@repo/tsconfig',
    });
    expect(await readJSONFile('packages/app/package.json')).toMatchObject({
      engines: { node: '>=20.17.0' },
      scripts: { tsc: 'tsc' },
    });
  });

  it('reports drift without writing files in check mode', async () => {
    const originalPackageJson = {
      name: 'app',
      version: '1.0.0',
      private: true,
      exports: { '.': './src/index.ts' },
    };
    await makeWorkspace(originalPackageJson);

    const drift = await setupPackages({ check: true });

    const outdated = drift.find((line) => line.includes('package.json is outdated'));
    expect(outdated).toContain('engines');
    expect(drift).toContain('packages/app/tsconfig.json is missing');
    // Nothing was written
    expect(await readJSONFile('packages/app/package.json')).toEqual(originalPackageJson);
    expect(await fileExists('packages/app/tsconfig.json')).toBe(false);
  });

  it('reports no drift once files are normalized', async () => {
    await makeWorkspace();

    await setupPackages({ check: false });
    const drift = await setupPackages({ check: true });

    expect(drift).toEqual([]);
  });

  it('reports drift when a generated file is stale', async () => {
    await makeWorkspace();

    await setupPackages({ check: false });

    // Introduce drift by hand
    await writeJson('packages/app/package.json', {
      ...(await readJSONFile<Record<string, unknown>>('packages/app/package.json')),
      scripts: { tsc: 'tsc --skipLibCheck' },
    });

    const drift = await setupPackages({ check: true });

    expect(drift).toEqual(['packages/app/package.json is outdated (scripts.tsc)']);
  });

  it('ignores array and object key ordering differences (oxfmt normalizes them)', async () => {
    await makeWorkspace({
      name: 'app',
      version: '1.0.0',
      keywords: ['zebra', 'apple'],
      exports: { '.': './src/index.ts' },
    });

    await setupPackages({ check: false });

    // Reorder the keywords array and the top-level object keys
    const pkg = await readJSONFile<Record<string, unknown>>('packages/app/package.json');
    const keywords = pkg['keywords'];
    if (!Array.isArray(keywords)) {
      throw new TypeError('expected the normalized package.json to have keywords');
    }
    await writeJson('packages/app/package.json', {
      ...Object.fromEntries(Object.entries(pkg).toReversed()),
      keywords: keywords.toReversed(),
    });

    const drift = await setupPackages({ check: true });

    expect(drift).toEqual([]);
  });
});

describe('setup-packages --check', () => {
  it('lists the drifted files, then says how to fix them', async () => {
    await makeWorkspace();
    let stderr = '';
    vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
      stderr += String(chunk);
      return true;
    });
    process.argv = [process.execPath, 'setup-packages', '--check'];

    await import('./bin.ts');

    expect(process.exitCode).toBe(1);
    expect(stderr).toContain('[would fix] packages/app/tsconfig.json is missing.\n');
    expect(stderr).toMatch(
      /Run `yarn setup-packages` to regenerate the setup files above\.\n$/,
    );
  });
});
