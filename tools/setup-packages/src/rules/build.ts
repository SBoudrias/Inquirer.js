import path from 'node:path';
import type { PackageJson, TsConfigJson } from 'type-fest';
import { fileExists } from '../utils/fs.ts';

type ExportDef = Exclude<PackageJson['exports'], undefined | null>;

const isTsFile = (file: string) => path.posix.extname(file) === '.ts';

// `./src/a/b.ts` -> `./dist/a/b<ext>`. POSIX paths: they land in package.json.
function toDist(file: string, ext: string) {
  const { dir, name } = path.posix.parse(file);
  return './' + path.posix.join(dir.replace(/^\.\/src/, 'dist'), name + ext);
}

/**
 * Wire a TypeScript package (one with a `.ts` export): tsconfig.json, exports,
 * publishConfig (exports/main/types/bin) and the tsc build script.
 * Returns the tsconfig.json to write, or undefined for non-TS packages.
 */
export async function applyTypeScriptRules(
  pkg: PackageJson,
  {
    dir,
    tsconfig = { extends: '@repo/tsconfig' },
    typescriptVersion,
  }: {
    dir: string;
    tsconfig: TsConfigJson | undefined;
    typescriptVersion: string | undefined;
  },
): Promise<TsConfigJson | undefined> {
  const isTS = Object.values(pkg.exports ?? {}).some(
    (exportPath) => typeof exportPath === 'string' && isTsFile(exportPath),
  );
  if (!isTS) {
    delete pkg.scripts?.['tsc'];
    return undefined;
  }

  tsconfig.include = ['src'];
  tsconfig.exclude = ['src/**/*.test.ts', 'src/**/*.jest.ts'];
  tsconfig.compilerOptions ??= {};
  tsconfig.compilerOptions.outDir = 'dist';
  tsconfig.compilerOptions.rootDir = 'src';
  tsconfig.compilerOptions.types = [
    'node',
    ...(tsconfig.compilerOptions.types ?? []).filter((t) => t !== 'node'),
  ];

  pkg.files = ['dist'];

  const exports: ExportDef =
    pkg.exports && typeof pkg.exports === 'object' && !Array.isArray(pkg.exports)
      ? pkg.exports
      : {};
  exports['./package.json'] = './package.json';
  if (await fileExists(path.join(dir, 'src/index.ts'))) {
    exports['.'] = './src/index.ts';
  }
  pkg.exports = exports;

  const publishExports: Record<string, { types: string; default: string } | string> = {};
  for (const [exportName, file] of Object.entries(exports)) {
    if (typeof file !== 'string') continue;
    publishExports[exportName] = isTsFile(file)
      ? { types: toDist(file, '.d.ts'), default: toDist(file, '.js') }
      : file;
  }

  pkg.publishConfig ??= {};
  pkg.publishConfig['exports'] = publishExports;
  if (typeof publishExports['.'] === 'object') {
    pkg.publishConfig['main'] = publishExports['.'].default;
    pkg.publishConfig['types'] = publishExports['.'].types;
  }

  const tscCommand = ['tsc'];
  if (pkg.bin) {
    if (!pkg.name) {
      throw new Error(
        `Package name in ${path.posix.join(dir, 'package.json')} is required`,
      );
    }

    const toBin = (file: string) => (isTsFile(file) ? toDist(file, '.js') : file);
    const publishBin =
      typeof pkg.bin === 'string'
        ? toBin(pkg.bin)
        : Object.fromEntries(
            Object.entries(pkg.bin).flatMap(([name, file]) =>
              typeof file === 'string' ? [[name, toBin(file)]] : [],
            ),
          );
    const executables =
      typeof publishBin === 'string' ? [publishBin] : Object.values(publishBin);
    if (executables.length > 0) {
      pkg.publishConfig['bin'] = publishBin;
      tscCommand.push(`chmod +x ${executables.join(' ')}`);
    }
  }

  pkg.scripts ??= {};
  pkg.scripts['tsc'] = tscCommand.join(' && ');
  pkg.devDependencies ??= {};
  pkg.devDependencies['typescript'] = typescriptVersion;
  if (tsconfig.extends === '@repo/tsconfig') {
    pkg.devDependencies['@repo/tsconfig'] = 'workspace:*';
  }

  return tsconfig;
}
