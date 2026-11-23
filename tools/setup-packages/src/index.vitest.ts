import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { setupPackages } from './index.ts';
import { fileExists, readJSONFile } from './utils/fs.ts';

const tempDirs: string[] = [];
const originalArgv = process.argv;
const originalExitCode = process.exitCode;

afterEach(async () => {
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
 * package.json.
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
  return cwd;
}

// Paths inside a temp workspace; absolute, so the tests never depend on
// process.cwd() (which cannot be changed with process.chdir() in worker
// threads — the threads pool runs this file).
function inWorkspace(cwd: string, file: string) {
  return path.join(cwd, file);
}

describe('setupPackages', () => {
  it('writes missing setup files in write mode', async () => {
    const cwd = await makeWorkspace();

    const drift = await setupPackages({ check: false, cwd });

    expect(drift).toEqual([]);
    expect(
      await readJSONFile(inWorkspace(cwd, 'packages/app/tsconfig.json')),
    ).toMatchObject({
      extends: '@repo/tsconfig',
    });
    expect(
      await readJSONFile(inWorkspace(cwd, 'packages/app/package.json')),
    ).toMatchObject({
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
    const cwd = await makeWorkspace(originalPackageJson);

    const drift = await setupPackages({ check: true, cwd });

    const outdated = drift.find((line) => line.includes('package.json is outdated'));
    expect(outdated).toContain('engines');
    expect(drift).toContain('packages/app/tsconfig.json is missing');
    // Nothing was written
    expect(await readJSONFile(inWorkspace(cwd, 'packages/app/package.json'))).toEqual(
      originalPackageJson,
    );
    expect(await fileExists(inWorkspace(cwd, 'packages/app/tsconfig.json'))).toBe(false);
  });

  it('reports no drift once files are normalized', async () => {
    const cwd = await makeWorkspace();

    await setupPackages({ check: false, cwd });
    const drift = await setupPackages({ check: true, cwd });

    expect(drift).toEqual([]);
  });

  it('reports drift when a generated file is stale', async () => {
    const cwd = await makeWorkspace();

    await setupPackages({ check: false, cwd });

    // Introduce drift by hand
    await writeJson(inWorkspace(cwd, 'packages/app/package.json'), {
      ...(await readJSONFile<Record<string, unknown>>(
        inWorkspace(cwd, 'packages/app/package.json'),
      )),
      scripts: { tsc: 'tsc --skipLibCheck' },
    });

    const drift = await setupPackages({ check: true, cwd });

    expect(drift).toEqual(['packages/app/package.json is outdated (scripts.tsc)']);
  });

  it('ignores array and object key ordering differences (oxfmt normalizes them)', async () => {
    const cwd = await makeWorkspace({
      name: 'app',
      version: '1.0.0',
      keywords: ['zebra', 'apple'],
      exports: { '.': './src/index.ts' },
    });

    await setupPackages({ check: false, cwd });

    // Reorder the keywords array and the top-level object keys
    const pkg = await readJSONFile<Record<string, unknown>>(
      inWorkspace(cwd, 'packages/app/package.json'),
    );
    const keywords = pkg['keywords'];
    if (!Array.isArray(keywords)) {
      throw new TypeError('expected the normalized package.json to have keywords');
    }
    await writeJson(inWorkspace(cwd, 'packages/app/package.json'), {
      ...Object.fromEntries(Object.entries(pkg).toReversed()),
      keywords: keywords.toReversed(),
    });

    const drift = await setupPackages({ check: true, cwd });

    expect(drift).toEqual([]);
  });
});

describe('setup-packages --check', () => {
  it('lists the drifted files, then says how to fix them', async () => {
    const cwd = await makeWorkspace();
    let stderr = '';
    vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
      stderr += String(chunk);
      return true;
    });
    // The CLI reads the workspace from process.cwd(); point it at the temp
    // workspace (process.chdir() is unavailable in worker threads).
    vi.spyOn(process, 'cwd').mockReturnValue(cwd);
    process.argv = [process.execPath, 'setup-packages', '--check'];

    await import('./bin.ts');

    expect(process.exitCode).toBe(1);
    expect(stderr).toContain('[would fix] packages/app/tsconfig.json is missing.\n');
    expect(stderr).toMatch(
      /Run `yarn setup-packages` to regenerate the setup files above\.\n$/,
    );
  });
});
