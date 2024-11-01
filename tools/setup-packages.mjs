import path from 'node:path';
import fs from 'node:fs/promises';
import { globby } from 'globby';
import { fixPeerDeps } from '@repo/hoist-peer-dependencies';

function readFile(filepath) {
  return fs.readFile(filepath, 'utf8');
}

function readJSONFile(filepath) {
  return readFile(filepath).then(JSON.parse);
}

function fileExists(filepath) {
  return fs.access(filepath).then(
    () => true,
    () => false,
  );
}

async function writeFile(filepath, content) {
  if (!(await fileExists(filepath)) || (await readFile(filepath)) !== content) {
    await fs.writeFile(filepath, content);
  }
}

const versions = {};
const rootPkg = await readJSONFile(path.join(import.meta.dirname, '../package.json'));
const paths = await globby(['packages/**/package.json', '!**/node_modules']);

Promise.all(
  paths.map(async (pkgPath) => {
    const pkg = await readJSONFile(pkgPath);

    // Collect all dependencies versions
    Object.assign(versions, pkg.devDependencies, pkg.dependencies);

    return [pkgPath, pkg];
  }),
).then((packages) =>
  packages.forEach(async ([pkgPath, pkg]) => {
    const dir = path.dirname(pkgPath);
    fixPeerDeps(path.resolve(path.join(dir)));

    const isTS = await fileExists(path.join(dir, 'src/index.ts'));
    const hasReadme = await fileExists(path.join(dir, 'README.md'));

    // Replicate configs that should always be the same.
    pkg.engines = rootPkg.engines;
    pkg.author = rootPkg.author;
    pkg.license = rootPkg.license;
    pkg.repository = rootPkg.repository;
    pkg.keywords = [...new Set([...rootPkg.keywords, ...(pkg.keywords ?? [])])];
    pkg.sideEffects = pkg.sideEffects ?? false;

    if (hasReadme) {
      const repoPath = dir.split('/').slice(-2).join('/');
      pkg.homepage = `https://github.com/SBoudrias/Inquirer.js/blob/main/${repoPath}/README.md`;
    }

    if (isTS) {
      pkg.files = ['dist'];

      pkg.devDependencies = pkg.devDependencies ?? {};
      pkg.devDependencies['tshy'] = versions['tshy'];

      pkg.tshy = pkg.tshy ?? {};
      pkg.tshy.exclude = ['src/**/*.test.ts'];

      pkg.scripts = pkg.scripts ?? {};
      pkg.scripts.tsc = 'tshy';

      // Only set attw if the package is using commonjs
      const shouldUseAttw =
        !Array.isArray(pkg.tshy.dialects) || pkg.tshy.dialects.includes('commonjs');
      pkg.scripts.attw = shouldUseAttw ? 'attw --pack' : undefined;
      if (shouldUseAttw) {
        pkg.devDependencies['@arethetypeswrong/cli'] = versions['@arethetypeswrong/cli'];
      }

      const tsconfig = (await fileExists(path.join(dir, 'tsconfig.json')))
        ? await readJSONFile(path.join(dir, 'tsconfig.json'))
        : { extends: '@repo/tsconfig' };
      writeFile(
        path.join(dir, 'tsconfig.json'),
        JSON.stringify(tsconfig, null, 2) + '\n',
      );

      if (tsconfig.extends === '@repo/tsconfig') {
        pkg.devDependencies['@repo/tsconfig'] = 'workspace:*';
      }
    }

    writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  }),
);
