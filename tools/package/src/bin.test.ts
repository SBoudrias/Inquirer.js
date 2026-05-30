import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Writable } from 'node:stream';
import { afterEach, describe, expect, it } from 'vitest';
import { main } from './bin.ts';

const tempDirs: string[] = [];
const originalCwd = process.cwd();

afterEach(async () => {
  process.chdir(originalCwd);
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

function createWritableCapture() {
  let output = '';
  const stream = new Writable({
    write(chunk, _encoding, callback) {
      output += String(chunk);
      callback();
    },
  });

  return {
    stream,
    output: () => output,
  };
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
    const stderr = createWritableCapture();
    process.chdir(cwd);

    const exitCode = await main(['lint', '--check'], {
      stderr: stderr.stream,
    });

    expect(exitCode).toBe(1);
    expect(stderr.output()).toContain(
      '[would fix] app must define an engines.node range within the root range ">=20.17.0".',
    );
    expect(stderr.output()).toContain('[would fix] app must export ./package.json.');
    expect(await readJson(packagePath)).toEqual(originalPackageJson);
  });
});
