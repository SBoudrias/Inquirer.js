import path from 'node:path';
import fs from 'node:fs/promises';
import { globby } from 'globby';
import { fixPeerDeps } from '@repo/hoist-peer-dependencies';
import type { PackageJson, TsConfigJson } from 'type-fest';

type ExportDef = Exclude<PackageJson['exports'], undefined | null>;

function readFile(filepath: string) {
  return fs.readFile(filepath, 'utf8');
}

function readJSONFile<T>(filepath: string): Promise<T> {
  return readFile(filepath).then(JSON.parse);
}

function fileExists(filepath: string) {
  return fs.access(filepath).then(
    () => true,
    () => false,
  );
}

async function writeFile(filepath: string, content: string) {
  if (!(await fileExists(filepath)) || (await readFile(filepath)) !== content) {
    await fs.writeFile(filepath, content);
  }
}

const versions: Record<string, string> = {};
const rootPkg = await readJSONFile<PackageJson>(
  path.join(import.meta.dirname, '../package.json'),
);
const paths = await globby(['packages/**/package.json', '!**/node_modules']);

const packages = await Promise.all(
  paths.map(async (pkgPath: string): Promise<[string, PackageJson]> => {
    const pkg = await readJSONFile<PackageJson>(pkgPath);

    // Collect all dependencies versions
    Object.assign(versions, pkg.devDependencies, pkg.dependencies);

    return [pkgPath, pkg];
  }),
);

for (const [pkgPath, pkg] of packages) {
  const dir = path.dirname(pkgPath);
  fixPeerDeps(path.resolve(path.join(dir)));

  const isTS = await fileExists(path.join(dir, 'src/index.ts'));
  const hasReadme = await fileExists(path.join(dir, 'README.md'));

  // Replicate configs that should always be the same.
  pkg.engines = rootPkg.engines;
  pkg.author = rootPkg.author;
  pkg.license = rootPkg.license;
  pkg.repository = rootPkg.repository;
  pkg.keywords = [...new Set([...(rootPkg.keywords ?? []), ...(pkg.keywords ?? [])])];
  pkg.sideEffects = pkg.sideEffects ?? false;
  pkg.publishConfig = { access: 'public' };

  if (hasReadme) {
    const repoPath = dir.split('/').slice(-2).join('/');
    pkg.homepage = `https://github.com/SBoudrias/Inquirer.js/blob/main/${repoPath}/README.md`;
  }

  if (isTS) {
    pkg.files = ['dist'];

    pkg.scripts ??= {};
    pkg.scripts['tsc'] = 'tsc -p tsconfig.json';

    const tsconfig: TsConfigJson = (await fileExists(path.join(dir, 'tsconfig.json')))
      ? await readJSONFile<TsConfigJson>(path.join(dir, 'tsconfig.json'))
      : { extends: '@repo/tsconfig' };

    tsconfig.include = ['src'];
    tsconfig.exclude = ['src/**/*.test.ts'];
    tsconfig.compilerOptions = tsconfig.compilerOptions ?? {};
    tsconfig.compilerOptions.outDir = 'dist';

    const exports: ExportDef = {
      ...(typeof pkg.exports === 'object' && !Array.isArray(pkg.exports)
        ? pkg.exports
        : {}),
      './package.json': './package.json',
      '.': './src/index.ts',
    };
    pkg.exports = exports;

    const publishExports: ExportDef = {};
    for (const [exportName, value] of Object.entries(exports)) {
      if (typeof value === 'string') {
        const { dir, name, ext } = path.parse(value);
        const distDir = dir.replace(/^\.\/src/, './dist');

        if (ext === '.ts') {
          publishExports[exportName] = {
            types: path.join(distDir, name + '.d.ts'),
            default: path.join(distDir, name + '.js'),
          };
        } else {
          publishExports[exportName] = path.join(distDir, name + ext);
        }
      }
    }

    pkg.publishConfig ??= {};
    pkg.publishConfig['exports'] = publishExports;

    // Remove legacy exports definitions
    delete pkg.main;
    delete pkg.types;
    delete pkg.module;
    delete pkg['tshy'];

    if (tsconfig.extends === '@repo/tsconfig') {
      pkg.devDependencies ??= {};
      pkg.devDependencies['@repo/tsconfig'] = 'workspace:*';
    }

    await writeFile(
      path.join(dir, 'tsconfig.json'),
      JSON.stringify(tsconfig, null, 2) + '\n',
    );
  }

  await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
}
