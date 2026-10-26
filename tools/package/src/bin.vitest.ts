import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

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

async function makeTempDir() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'package-cli-'));
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

function captureStderr() {
  let output = '';
  vi.spyOn(process.stderr, 'write').mockImplementation((chunk, ...args) => {
    output += String(chunk);

    const callback = args.find((arg) => typeof arg === 'function');
    callback?.();

    return true;
  });

  return () => output;
}

describe('package CLI', () => {
  it('runs lint in check mode without writing package files', async () => {
    const cwd = await makeTempDir();
    const packagePath = path.join(cwd, 'packages/app/package.json');
    const originalPackageJson = {
      name: 'app',
      version: '1.0.0',
      exports: './src/index.ts',
    };
    await writeJson(path.join(cwd, 'package.json'), {
      name: 'root',
      private: true,
      workspaces: ['packages/*'],
      engines: {
        node: '>=20.17.0',
      },
    });
    await writeJson(packagePath, originalPackageJson);
    const stderr = captureStderr();
    process.chdir(cwd);
    process.argv = [
      process.execPath,
      path.join(originalCwd, 'tools/package/src/bin.ts'),
      'lint',
      '--check',
    ];

    await import('./bin.ts');

    expect(process.exitCode).toBe(1);
    expect(stderr()).toContain(
      '[would fix] app must define an engines.node range within the root range ">=20.17.0".',
    );
    expect(stderr()).toContain('[would fix] app must export ./package.json.');
    expect(await readJson(packagePath)).toEqual(originalPackageJson);
  });
});
