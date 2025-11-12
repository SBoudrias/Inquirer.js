#!/usr/bin/env node
import path from 'node:path';
import fs from 'node:fs/promises';
import semver from 'semver';
import { globby } from 'globby';
import type { PackageJson as FestPackageJson, TsConfigJson } from 'type-fest';
import { fixPeerDeps } from './hoist-peer-dependencies.ts';

type PackageJson = FestPackageJson & {
  tshy?: {
    dialects?: string[];
    exclude?: string[];
  };
};

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
  pkg.tshy ??= {};
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

    pkg.files = ['dist'];
    pkg.devDependencies['tshy'] = versions['tshy'];
    pkg.tshy.exclude = ['src/**/*.test.ts'];
    pkg.scripts['tsc'] = 'tshy';

    // Only set attw if the package is using commonjs
    const shouldUseAttw =
      !Array.isArray(pkg.tshy.dialects) || pkg.tshy.dialects.includes('commonjs');
    pkg.scripts['attw'] = shouldUseAttw ? 'attw --pack' : undefined;
    if (shouldUseAttw) {
      pkg.devDependencies['@arethetypeswrong/cli'] = versions['@arethetypeswrong/cli'];
    }

    await writeJSONFile(path.join(dir, 'tsconfig.json'), tsconfig);
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
