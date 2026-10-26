import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { readWorkspaceProject } from './workspaces.ts';

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => fs.rm(dir, { recursive: true, force: true })));
  tempDirs.length = 0;
});

async function makeTempDir() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'package-workspaces-'));
  tempDirs.push(dir);
  return dir;
}

async function writeJson(filepath: string, value: unknown) {
  await fs.mkdir(path.dirname(filepath), { recursive: true });
  await fs.writeFile(filepath, JSON.stringify(value, null, 2) + '\n');
}

describe('readWorkspaceProject', () => {
  it('uses the root package when the project has no workspaces', async () => {
    const cwd = await makeTempDir();
    await writeJson(path.join(cwd, 'package.json'), {
      name: 'root',
    });

    const project = await readWorkspaceProject(cwd);

    expect(project.packages.map((workspace) => workspace.packagePath)).toEqual([
      'package.json',
    ]);
  });

  it('discovers package.json workspace package object patterns', async () => {
    const cwd = await makeTempDir();
    await writeJson(path.join(cwd, 'package.json'), {
      name: 'root',
      private: true,
      workspaces: {
        packages: ['packages/*'],
      },
    });
    await writeJson(path.join(cwd, 'packages/alpha/package.json'), {
      name: 'alpha',
    });

    const project = await readWorkspaceProject(cwd);

    expect(project.packages.map((workspace) => workspace.packagePath)).toEqual([
      'packages/alpha/package.json',
    ]);
  });

  it('discovers pnpm workspace package patterns', async () => {
    const cwd = await makeTempDir();
    await writeJson(path.join(cwd, 'package.json'), {
      name: 'root',
      private: true,
    });
    await fs.writeFile(
      path.join(cwd, 'pnpm-workspace.yaml'),
      ['packages:', '  - packages/*', '  - tools/*'].join('\n'),
    );
    await writeJson(path.join(cwd, 'packages/alpha/package.json'), {
      name: 'alpha',
    });
    await writeJson(path.join(cwd, 'tools/beta/package.json'), {
      name: 'beta',
    });

    const project = await readWorkspaceProject(cwd);

    expect(project.packages.map((workspace) => workspace.packagePath)).toEqual([
      'packages/alpha/package.json',
      'tools/beta/package.json',
    ]);
  });
});
