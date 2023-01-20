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

    // If the package supports Typescript, then apply the configs.
    pkg.exports = {
      '.': {
        import: {
          types: './dist/esm/types/index.d.ts',
          default: './dist/esm/index.mjs',
        },
        require: {
          types: './dist/cjs/types/index.d.ts',
          default: './dist/cjs/index.js',
        },
      },
    };

    pkg.main = './dist/cjs/index.js';
    pkg.files = ['dist/**/*'];
    delete pkg.typings;
    delete pkg.type;
    pkg.scripts = {
      tsc: 'yarn run tsc:esm && yarn run tsc:cjs',
      'tsc:esm': 'tsc -p ./tsconfig.esm.json && mv dist/esm/index.js dist/esm/index.mjs',
      'tsc:cjs': 'tsc -p ./tsconfig.cjs.json',
    };

    // Set CJS tsconfig
    const cjsTsconfig = {
      extends: '../../tsconfig.json',
      compilerOptions: {
        lib: ['ES6'],
        target: 'ES6',
        module: 'CommonJS',
        moduleResolution: 'Node',
        outDir: 'dist/cjs',
        declarationDir: 'dist/cjs/types',
      },
    };

    // Set ESM tsconfig
    const esmTsconfig = {
      extends: '../../tsconfig.json',
      compilerOptions: {
        lib: ['ES2022'],
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'NodeNext',
        outDir: 'dist/esm',
        declarationDir: 'dist/esm/types',
      },
    };

    fs.promises.writeFile(
      path.join(dir, 'tsconfig.cjs.json'),
      JSON.stringify(cjsTsconfig, null, 2)
    );
    fs.promises.writeFile(
      path.join(dir, 'tsconfig.esm.json'),
      JSON.stringify(esmTsconfig, null, 2)
    );
  }

  fs.promises.writeFile(pkgPath, JSON.stringify(pkg, null, 2));
});
