import path from 'node:path';
import fs from 'node:fs';
import url from 'node:url';
import { globby } from 'globby';
import prettier from 'prettier';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

function readFile(filepath) {
  return fs.promises.readFile(filepath, 'utf-8');
}

function readJSONFile(filepath) {
  return readFile(filepath).then(JSON.parse);
}

function fileExists(filepath) {
  return fs.promises.access(filepath).then(
    () => true,
    () => false,
  );
}

async function writeFile(filepath, content) {
  if ((await fileExists(filepath)) && (await readFile(filepath)) !== content) {
    await fs.promises.writeFile(filepath, content);
  }
}

const rootPkg = await readJSONFile(path.join(__dirname, '../package.json'));
const paths = await globby(['packages/**/package.json', '!**/node_modules']);

paths.forEach(async (pkgPath) => {
  const dir = path.dirname(pkgPath);

  const prettierJsonOption = await prettier.resolveConfig('tsconfig.json');
  const formatJSON = (content) =>
    prettier.format(JSON.stringify(content), { ...prettierJsonOption, parser: 'json' });

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
    delete pkg.type;
    pkg.scripts = pkg.scripts ?? {};

    // If the package supports Typescript, then apply the configs.
    pkg.exports = {
      '.': {
        import: {
          types: './dist/esm/types/index.d.mts',
          default: './dist/esm/index.mjs',
        },
        require: {
          types: './dist/cjs/types/index.d.ts',
          default: './dist/cjs/index.js',
        },
      },
    };

    pkg.main = pkg.exports['.'].require.default;
    pkg.typings = pkg.exports['.'].require.types;
    pkg.files = ['dist/**/*'];

    pkg.scripts = {
      tsc: 'yarn run clean && yarn run tsc:esm && yarn run tsc:cjs',
      clean: 'rm -rf dist',
      'tsc:esm': 'tsc -p ./tsconfig.json',
      'tsc:cjs': 'node ../../tools/fix-ext.mjs',
      'fix-ext':
        'node --no-warnings=ExperimentalWarning --loader=ts-node/esm ../../tools/fix-ext.mts',
    };

    // Set ESM tsconfig
    const esmTsconfig = {
      extends: '../../tsconfig.json',
      include: ['./src'],
      compilerOptions: {
        lib: ['ESNext'],
        target: 'es2022',
        moduleResolution: 'nodenext',
        outDir: 'dist/esm',
        declarationDir: 'dist/esm/types',
      },
    };

    // Set CJS tsconfig
    const cjsTsconfig = {
      extends: './tsconfig.json',
      include: ['./src'],
      compilerOptions: {
        lib: ['ES6'],
        target: 'es6',
        moduleResolution: 'node',
        outDir: 'dist/cjs',
        declarationDir: 'dist/cjs/types',
      },
    };

    writeFile(path.join(dir, 'tsconfig.json'), await formatJSON(esmTsconfig));
    writeFile(path.join(dir, 'tsconfig.cjs.json'), await formatJSON(cjsTsconfig));
  }

  writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
});
