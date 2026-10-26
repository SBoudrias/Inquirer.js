import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { resolveDependencyPackageJson } from './package-json.ts';

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => fs.rm(dir, { recursive: true, force: true })));
  tempDirs.length = 0;
});

async function makeTempDir() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'package-json-'));
  tempDirs.push(dir);
  return dir;
}

describe('resolveDependencyPackageJson', () => {
  it('falls back to the package entrypoint when package.json is not exported', async () => {
    const cwd = await makeTempDir();
    const packageDir = path.join(cwd, 'node_modules', 'hidden-package-json');
    await fs.mkdir(packageDir, { recursive: true });
    await fs.writeFile(path.join(packageDir, 'index.js'), 'module.exports = {};\n');
    await fs.writeFile(
      path.join(packageDir, 'package.json'),
      JSON.stringify(
        {
          name: 'hidden-package-json',
          version: '1.0.0',
          exports: './index.js',
          peerDependencies: {
            react: '^19.0.0',
          },
        },
        null,
        2,
      ),
    );

    const pkg = resolveDependencyPackageJson('hidden-package-json', cwd);

    expect(pkg?.peerDependencies).toEqual({ react: '^19.0.0' });
  });

  it('falls back to node_modules when package.json and the entrypoint are not exported', async () => {
    const cwd = await makeTempDir();
    const packageDir = path.join(cwd, 'node_modules', 'no-entrypoint');
    await fs.mkdir(packageDir, { recursive: true });
    await fs.writeFile(
      path.join(packageDir, 'package.json'),
      JSON.stringify(
        {
          name: 'no-entrypoint',
          version: '1.0.0',
          exports: {},
          engines: {
            node: '>=20.0.0',
          },
        },
        null,
        2,
      ),
    );

    const pkg = resolveDependencyPackageJson('no-entrypoint', cwd);

    expect(pkg?.engines).toEqual({ node: '>=20.0.0' });
  });
});
