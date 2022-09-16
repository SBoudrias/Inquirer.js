import path from 'node:path';
import fs from 'node:fs';
import * as url from 'node:url';
import { globby } from 'globby';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

function readJSONFile(filepath: string): Promise<any> {
  return fs.promises.readFile(filepath, 'utf-8').then(JSON.parse);
}

function fileExists(filepath: string): Promise<boolean> {
  return fs.promises.access(filepath).then(
    () => true,
    () => false
  );
}

const rootPkg = await readJSONFile(path.join(__dirname, '../package.json'));
const paths = await globby(['packages/**/package.json', '!**/node_modules']);

paths.forEach(async (pkgPath) => {
  const dir = path.dirname(pkgPath);

  // Set multi-module system builds exports
  const pkg = await readJSONFile(pkgPath);
  const isTS = await fileExists(path.join(dir, 'tsconfig.json'));
  const hasReadme = await fileExists(path.join(dir, 'README.md'));

  // Replicate configs that should always be the same.
  pkg.engines = rootPkg.engines;
  pkg.author = rootPkg.author;
  pkg.license = rootPkg.license;
  pkg.repository = rootPkg.repository;
  pkg.keywords = Array.from(new Set([...rootPkg.keywords, ...(pkg.keywords ?? [])]));

  if (hasReadme) {
    const repoPath = dir.split('/').slice(-2).join('/');
    pkg.homepage = `https://github.com/SBoudrias/Inquirer.js/blob/master/${repoPath}/README.md`;
  }

  if (isTS) {
    pkg.scripts = pkg.scripts ?? {};
    pkg.scripts.tsc = 'tsc';
  }

  fs.promises.writeFile(pkgPath, JSON.stringify(pkg, null, 2));
});
