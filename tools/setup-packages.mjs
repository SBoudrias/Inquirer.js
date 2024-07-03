import path from 'node:path';
import fs from 'node:fs/promises';
import { globby } from 'globby';
import prettier from 'prettier';

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

const prettierJsonOption = await prettier.resolveConfig('tsconfig.json');
const formatJSON = (content) =>
  prettier.format(JSON.stringify(content), { ...prettierJsonOption, parser: 'json' });

const rootPkg = await readJSONFile(path.join(import.meta.dirname, '../package.json'));
const paths = await globby(['packages/**/package.json', '!**/node_modules']);

paths.forEach(async (pkgPath) => {
  const dir = path.dirname(pkgPath);
  const tsconfigPath = path.join(dir, 'tsconfig.json');

  // Set multi-module system builds exports
  const pkg = await readJSONFile(pkgPath);
  const isTS = await fileExists(tsconfigPath);
  const hasReadme = await fileExists(path.join(dir, 'README.md'));

  // Replicate configs that should always be the same.
  pkg.engines = rootPkg.engines;
  pkg.author = rootPkg.author;
  pkg.license = rootPkg.license;
  pkg.repository = rootPkg.repository;
  pkg.keywords = [...new Set([...rootPkg.keywords, ...(pkg.keywords ?? [])])];

  if (hasReadme) {
    const repoPath = dir.split('/').slice(-2).join('/');
    pkg.homepage = `https://github.com/SBoudrias/Inquirer.js/blob/master/${repoPath}/README.md`;
  }

  if (!('sideEffects' in pkg)) {
    pkg.sideEffects = false;
  }

  if (isTS) {
    const tsconfig = await readJSONFile(tsconfigPath);
    const emitDeclaration = tsconfig?.compilerOptions?.declaration !== false;

    delete pkg.type;
    pkg.scripts = pkg.scripts ?? {};
    pkg.files = ['dist/**/*'];

    // If the package supports Typescript, then apply the configs.
    pkg.exports = {
      '.': {
        import: './dist/esm/index.mjs',
        require: './dist/cjs/index.js',
        types: emitDeclaration ? './dist/types/index.d.ts' : undefined,
      },
    };

    pkg.main = pkg.exports['.'].require;
    pkg.types = emitDeclaration ? './dist/types/index.d.ts' : undefined;
    pkg.typings = undefined;

    pkg.scripts = {
      tsc: 'yarn run tsc:esm && yarn run tsc:cjs',
      'tsc:esm':
        'rm -rf dist/esm && tsc -p ./tsconfig.json && node ../../tools/fix-ext.mjs',
      'tsc:cjs': 'rm -rf dist/cjs && tsc -p ./tsconfig.cjs.json',
      dev: 'tsc -p ./tsconfig.json --watch',
      attw: emitDeclaration ? 'attw --pack' : undefined,
    };

    // Set ESM tsconfig
    const esmTsconfig = {
      extends: '../../tsconfig.json',
      include: ['./src'],
      exclude: ['**/*.test.mts'],
      compilerOptions: {
        lib: ['es2023'],
        target: 'esnext',
        module: 'esnext',
        moduleResolution: 'node',
        outDir: 'dist/esm',
        declarationDir: emitDeclaration ? 'dist/types' : undefined,
      },
    };

    // Set CJS tsconfig
    const cjsTsconfig = {
      extends: '../../tsconfig.json',
      include: ['./src'],
      exclude: ['**/*.test.mts'],
      compilerOptions: {
        lib: ['es2023'],
        target: 'es6',
        module: 'commonjs',
        moduleResolution: 'node',
        outDir: 'dist/cjs',
        declaration: false,
      },
    };

    writeFile(tsconfigPath, await formatJSON(esmTsconfig));
    writeFile(path.join(dir, 'tsconfig.cjs.json'), await formatJSON(cjsTsconfig));
  }

  writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
});
