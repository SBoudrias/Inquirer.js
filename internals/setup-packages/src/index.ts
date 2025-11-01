#!/usr/bin/env node
import path from 'node:path';
import fs from 'node:fs/promises';
import semver from 'semver';
import { globby } from 'globby';
import type { PackageJson, TsConfigJson } from 'type-fest';
import { fixPeerDeps } from './hoist-peer-dependencies.ts';

type TshyPackageJson = PackageJson & {
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

const versions: Record<string, string> = {};
const rootPkg = await readJSONFile<TshyPackageJson>(
  path.join(process.cwd(), 'package.json'),
);
if (!Array.isArray(rootPkg.workspaces) || !rootPkg.engines.node) {
  throw new Error(
    '[Inquirer] The scaffolding tool requires `workspaces` and `engines.node` in the root package.json',
  );
}
const paths = await globby([
  ...rootPkg.workspaces.map((workspace) => path.join(workspace, 'package.json')),
  '!**/node_modules',
]);

const packages = await Promise.all(
  paths.map(async (pkgPath: string): Promise<[string, TshyPackageJson]> => {
    const pkg = await readJSONFile<TshyPackageJson>(pkgPath);

    // Collect all dependencies versions
    Object.assign(versions, pkg.devDependencies, pkg.dependencies);

    return [pkgPath, pkg];
  }),
);

for (const [pkgPath, pkg] of packages) {
  const dir = path.dirname(pkgPath);
  fixPeerDeps(path.resolve(path.join(dir)));

  const isTS =
    (await fileExists(path.join(dir, 'src/index.ts'))) ||
    (await fileExists(path.join(dir, 'tsconfig.json')));
  const hasReadme = await fileExists(path.join(dir, 'README.md'));
  const isPrivate = pkg.private === true;

  pkg.sideEffects ??= false;

  // Set min engines version.
  if (
    !pkg.engines?.node ||
    semver.lt(semver.coerce(pkg.engines.node), semver.coerce(rootPkg.engines.node))
  ) {
    pkg.engines ??= {};
    pkg.engines.node = rootPkg.engines.node;
  }

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
  } else {
    // Remove publishing metadata for private packages
    delete pkg.author;
    delete pkg.license;
    delete pkg.repository;
    delete pkg.keywords;
    delete pkg.homepage;
    delete pkg.publishConfig;
    delete pkg.files;
  }

  if (isTS && !isPrivate) {
    pkg.files = ['dist'];

    pkg.devDependencies ??= {};
    pkg.devDependencies['tshy'] = versions['tshy'];

    pkg.tshy ??= {};
    pkg.tshy.exclude = ['src/**/*.test.ts'];

    pkg.scripts ??= {};
    pkg.scripts['tsc'] = 'tshy';

    // Only set attw if the package is using commonjs
    const shouldUseAttw =
      !Array.isArray(pkg.tshy.dialects) || pkg.tshy.dialects.includes('commonjs');
    pkg.scripts['attw'] = shouldUseAttw ? 'attw --pack' : undefined;
    if (shouldUseAttw) {
      pkg.devDependencies['@arethetypeswrong/cli'] = versions['@arethetypeswrong/cli'];
    }

    const tsconfig: TsConfigJson = (await fileExists(path.join(dir, 'tsconfig.json')))
      ? await readJSONFile<TsConfigJson>(path.join(dir, 'tsconfig.json'))
      : { extends: '@repo/tsconfig' };
    await writeFile(
      path.join(dir, 'tsconfig.json'),
      JSON.stringify(tsconfig, null, 2) + '\n',
    );

    if (tsconfig.extends === '@repo/tsconfig') {
      pkg.devDependencies['@repo/tsconfig'] = 'workspace:*';
    }
  }

  await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
}
