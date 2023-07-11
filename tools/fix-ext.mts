import path from 'node:path';
import fs from 'node:fs/promises';
import { globby } from 'globby';

// Because we're using .mts files, TS compiles to .mjs files disregarding the target. So here we
// manually rename the common.js files and their imports to .js
const mjsFiles: string[] = await globby(['dist/cjs/**/*.mjs', '!**/node_modules']);
mjsFiles.forEach(async (pathname: string) => {
  // 1. Rename imports
  const fileContent = await fs.readFile(pathname, 'utf-8');
  await fs.writeFile(
    pathname,
    fileContent.replace(/require\(['"]([^'"]*)\.mjs['"]\)/g, "require('$1.js')"),
  );

  // 2. Rename files
  const newPath = path.format({
    ...path.parse(pathname),
    base: '',
    ext: '.js',
  });

  console.log(`Renaming ${pathname} to ${newPath}...`);
  await fs.rename(pathname, newPath);
});

// Similarly, we rename the .d.mts files to .d.cts. This is because Typescript `node16` target will
// masquerade as ESM otherwise.
const dmtsFiles: string[] = await globby(['dist/cjs/**/*.d.mts', '!**/node_modules']);
dmtsFiles.forEach(async (pathname: string) => {
  // 1. Rename imports
  const fileContent = await fs.readFile(pathname, 'utf-8');
  await fs.writeFile(
    pathname,
    fileContent.replace(/from '([^']*)\.mjs'/g, "from '$1.d.cts'"),
  );

  // 2. Rename files
  const newPath = path.format({
    ...path.parse(pathname),
    base: '',
    ext: '.cts',
  });

  console.log(`Renaming ${pathname} to ${newPath}...`);
  await fs.rename(pathname, newPath);
});
