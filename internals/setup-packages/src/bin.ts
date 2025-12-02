#!/usr/bin/env node
import path from 'node:path';
import fs from 'node:fs/promises';
import semver from 'semver';
import { globby } from 'globby';
import type { PackageJson, TsConfigJson } from 'type-fest';
import { fixPeerDeps } from './hoist-peer-dependencies.ts';

type ExportDef = Exclude<PackageJson['exports'], undefined | null>;

function readFile(filepath: string) {
  return fs.readFile(filepath, 'utf8');
}

function readJSONFile<T>(filepath: string): Promise<T> {
  return readFile(filepath)
    .then(JSON.parse)
    .catch((error: unknown) => {
      console.error(`Error reading ${filepath}: ${error}`);
      throw error;
    });
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

async function writeJSONFile(filepath: string, content: unknown) {
  await writeFile(filepath, JSON.stringify(content, null, 2) + '\n');
}

const rootPkg = await readJSONFile<PackageJson>(path.join(process.cwd(), 'package.json'));
const rootNodeVersion = semver.coerce(rootPkg.engines?.['node']);
if (!Array.isArray(rootPkg.workspaces) || rootNodeVersion == null) {
  throw new Error(
    '[Inquirer] The scaffolding tool requires `workspaces` and `engines.node` in the root package.json',
  );
}
const paths = await globby([
  ...rootPkg.workspaces.map((workspace) => path.join(workspace, 'package.json')),
  '!**/node_modules',
]);

const versions: Record<string, string> = {};
const packages = await Promise.all(
  paths.map(async (pkgPath: string): Promise<[string, PackageJson]> => {
    const pkg = await readJSONFile<PackageJson>(pkgPath);

    // Collect all dependencies versions
    Object.assign(versions, pkg.devDependencies, pkg.dependencies);

    return [pkgPath, pkg];
  }),
);

for (const [pkgPath, pkg] of packages) {
  // Set default values to normalize the package structure
  pkg.devDependencies ??= {};
  pkg.engines ??= {};
  pkg.publishConfig ??= {};
  pkg.scripts ??= {};
  pkg.exports ??= {};
  pkg.sideEffects ??= false;

  // Set min engines version.
  const pkgNodeVersion = semver.coerce(pkg.engines['node']);
  if (pkgNodeVersion == null || semver.lt(pkgNodeVersion, rootNodeVersion)) {
    pkg.engines['node'] = rootPkg.engines?.['node'];
  }

  const dir = path.dirname(pkgPath);
  fixPeerDeps(path.resolve(path.join(dir)));

  const isTS = Object.values(pkg.exports).some(
    (exportPath) => typeof exportPath === 'string' && exportPath.endsWith('.ts'),
  );
  const hasReadme = await fileExists(path.join(dir, 'README.md'));
  const isPrivate = pkg.private === true;

  if (!isPrivate) {
    // Only set publishing metadata for public packages
    pkg.author = rootPkg.author;
    pkg.license = rootPkg.license;
    pkg.repository = rootPkg.repository;
    pkg.keywords = [...new Set([...(rootPkg.keywords ?? []), ...(pkg.keywords ?? [])])];
    pkg.publishConfig = { access: 'public' };

    if (hasReadme) {
      const repoPath = dir.split('/').slice(-2).join('/');
      pkg.homepage = `https://github.com/SBoudrias/Inquirer.js/blob/main/${repoPath}/README.md`;
    }
  }

  if (isTS) {
    const tsconfig: TsConfigJson = (await fileExists(path.join(dir, 'tsconfig.json')))
      ? await readJSONFile<TsConfigJson>(path.join(dir, 'tsconfig.json'))
      : { extends: '@repo/tsconfig' };

    tsconfig.include = ['src'];
    tsconfig.exclude = ['src/**/*.test.ts'];
    tsconfig.compilerOptions ??= {};
    tsconfig.compilerOptions.outDir = 'dist';

    pkg.files = ['dist'];

    const exports: ExportDef =
      pkg.exports && typeof pkg.exports === 'object' && !Array.isArray(pkg.exports)
        ? pkg.exports
        : {};

    exports['./package.json'] = './package.json';
    // Only add index.ts export if the file exists
    if (await fileExists(path.join(dir, 'src/index.ts'))) {
      exports['.'] = './src/index.ts';
    }

    pkg.exports = exports;

    const publishExports: Record<string, { types: string; default: string } | string> =
      {};
    for (const [exportName, value] of Object.entries(exports)) {
      if (typeof value === 'string') {
        const { dir, name, ext } = path.parse(value);
        const distDir = dir.replace(/^\.\/src/, 'dist');

        if (ext === '.ts') {
          publishExports[exportName] = {
            types: './' + path.join(distDir, name + '.d.ts'),
            default: './' + path.join(distDir, name + '.js'),
          };
        } else {
          publishExports[exportName] = value;
        }
      }
    }

    pkg.publishConfig['exports'] = publishExports;
    if (typeof publishExports['.'] === 'object') {
      pkg.publishConfig['main'] = publishExports['.'].default;
      pkg.publishConfig['types'] = publishExports['.'].types;
    }

    // Build tsc command with chmod for bin files if needed
    let tscCommand = 'tsc';

    // Handle bin field in publishConfig
    if (pkg.bin) {
      if (!pkg.name) throw new Error(`Package name in ${pkgPath} is required`);

      const publishBin: Record<string, string> = {};
      const binEntries = typeof pkg.bin === 'string' ? { [pkg.name]: pkg.bin } : pkg.bin;

      for (const [binName, binPath] of Object.entries(binEntries)) {
        if (typeof binPath !== 'string') continue;

        const { dir, name, ext } = path.parse(binPath);
        const distDir = dir.replace(/^\.\/src/, 'dist');

        if (ext === '.ts') {
          publishBin[binName] = './' + path.join(distDir, name + '.js');
        } else {
          publishBin[binName] = binPath;
        }
      }

      if (Object.values(publishBin).length > 0) {
        tscCommand += ` && chmod +x ${Object.values(publishBin).join(' ')}`;
        pkg.publishConfig['bin'] = publishBin;
      }
    }

    pkg.scripts['tsc'] = tscCommand;
    pkg.devDependencies['typescript'] = versions['typescript'];

    if (tsconfig.extends === '@repo/tsconfig') {
      pkg.devDependencies['@repo/tsconfig'] = 'workspace:*';
    }

    await writeJSONFile(path.join(dir, 'tsconfig.json'), tsconfig);
  } else {
    delete pkg.scripts['tsc'];
  }

  if (isPrivate) {
    // Remove publishing metadata for private packages
    delete pkg.author;
    delete pkg.license;
    delete pkg.repository;
    delete pkg.keywords;
    delete pkg.homepage;
    delete pkg.publishConfig;
    delete pkg.files;
  }

  // Clean up empty object
  for (const [key, value] of Object.entries(pkg)) {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      Object.keys(value).length === 0
    ) {
      /* eslint-disable-next-line @typescript-eslint/no-dynamic-delete */
      delete pkg[key];
    }
  }

  await writeJSONFile(pkgPath, pkg);
}
