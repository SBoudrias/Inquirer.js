import path from 'node:path';
import fs from 'node:fs/promises';
import { globby } from 'globby';

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
      pkg.devDependencies['@repo/tsconfig'] = 'workspace:*';
      pkg.devDependencies['tshy'] = versions['tshy'];

      pkg.tshy = pkg.tshy ?? {};
      pkg.tshy.exclude = ['src/**/*.test.ts'];

      pkg.scripts = pkg.scripts ?? {};
      pkg.scripts.tsc = 'tshy';
      pkg.scripts.attw = 'attw --pack';

      const tsconfig = {
        extends: '@repo/tsconfig',
      };
      writeFile(
        path.join(dir, 'tsconfig.json'),
        JSON.stringify(tsconfig, null, 2) + '\n',
      );
    }

    writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  }),
);
