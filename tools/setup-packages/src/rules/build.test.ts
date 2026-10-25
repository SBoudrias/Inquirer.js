import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it, onTestFinished } from 'vitest';
import type { PackageJson, TsConfigJson } from 'type-fest';
import { applyTypeScriptRules } from './build.ts';

function apply(
  pkg: PackageJson,
  overrides: { tsconfig?: TsConfigJson; dir?: string } = {},
) {
  return applyTypeScriptRules(pkg, {
    dir: 'packages/app',
    tsconfig: undefined,
    typescriptVersion: '^5.9.2',
    ...overrides,
  });
}

describe('applyTypeScriptRules', () => {
  it('drops the tsc script and returns no tsconfig for non-TS packages', async () => {
    const pkg: PackageJson = {
      exports: { '.': './src/index.js' },
      scripts: { tsc: 'x' },
    };

    expect(await apply(pkg)).toBeUndefined();
    expect(pkg).toEqual({ exports: { '.': './src/index.js' }, scripts: {} });
  });

  it('creates the tsconfig of a TS package lacking one', async () => {
    expect(await apply({ exports: { '.': './src/index.ts' } })).toEqual({
      extends: '@repo/tsconfig',
      include: ['src'],
      exclude: ['src/**/*.test.ts', 'src/**/*.jest.ts'],
      compilerOptions: { outDir: 'dist', rootDir: 'src', types: ['node'] },
    });
  });

  it('keeps custom tsconfig entries while normalizing the wiring', async () => {
    const tsconfig = await apply(
      { exports: { '.': './src/index.ts' } },
      { tsconfig: { compilerOptions: { lib: ['es2023'], types: ['jest', 'node'] } } },
    );

    expect(tsconfig?.compilerOptions?.lib).toEqual(['es2023']);
    expect(tsconfig?.compilerOptions?.types).toEqual(['node', 'jest']);
  });

  it('keeps the "." export absent when there is no src/index.ts', async () => {
    const pkg: PackageJson = { exports: { './a': './src/a.ts' } };

    await apply(pkg);

    expect(pkg.exports).toEqual({
      './a': './src/a.ts',
      './package.json': './package.json',
    });
    expect(pkg.publishConfig?.['main']).toBeUndefined();
  });

  it('adds the "." export when src/index.ts exists', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'setup-build-'));
    onTestFinished(() => fs.rm(dir, { recursive: true, force: true }));
    await fs.mkdir(path.join(dir, 'src'));
    await fs.writeFile(path.join(dir, 'src/index.ts'), '');
    const pkg: PackageJson = { exports: { './a': './src/a.ts' } };

    await apply(pkg, { dir });

    expect(pkg.exports).toMatchObject({ '.': './src/index.ts' });
  });

  it('maps exports to POSIX dist paths and wires the build', async () => {
    const pkg: PackageJson = {
      exports: { '.': './src/index.ts', './helper': './src/lib/helper.ts' },
    };

    await apply(pkg);

    expect(pkg).toMatchObject({
      files: ['dist'],
      scripts: { tsc: 'tsc' },
      devDependencies: { typescript: '^5.9.2', '@repo/tsconfig': 'workspace:*' },
      publishConfig: {
        exports: {
          '.': { types: './dist/index.d.ts', default: './dist/index.js' },
          './helper': {
            types: './dist/lib/helper.d.ts',
            default: './dist/lib/helper.js',
          },
          './package.json': './package.json',
        },
        main: './dist/index.js',
        types: './dist/index.d.ts',
      },
    });
  });

  it('rewrites .ts bin entries to dist with a chmod step', async () => {
    const single: PackageJson = {
      name: 'app',
      bin: './src/cli.ts',
      exports: { '.': './src/index.ts' },
    };
    await apply(single);
    expect(single.publishConfig?.['bin']).toBe('./dist/cli.js');
    expect(single.scripts?.['tsc']).toBe('tsc && chmod +x ./dist/cli.js');

    const many: PackageJson = {
      name: 'app',
      bin: { a: './src/a.ts', b: './bin/b.js' },
      exports: { '.': './src/index.ts' },
    };
    await apply(many);
    expect(many.publishConfig?.['bin']).toEqual({ a: './dist/a.js', b: './bin/b.js' });
    expect(many.scripts?.['tsc']).toBe('tsc && chmod +x ./dist/a.js ./bin/b.js');
  });

  it('requires a package name when a bin is declared', async () => {
    await expect(
      apply({ bin: './src/cli.ts', exports: { '.': './src/index.ts' } }),
    ).rejects.toThrow('Package name in packages/app/package.json is required');
  });
});
