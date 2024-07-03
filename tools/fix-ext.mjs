import path from 'node:path';
import fs from 'node:fs/promises';
import { globby } from 'globby';

// Because we're using .mts files, TS compiles to .mjs files disregarding the target. So here we
// manually rename the common.js files and their imports to .js
const mjsFiles = await globby(['dist/esm/**/*.js', '!**/node_modules']);
mjsFiles.forEach(async (pathname) => {
  // 1. Rename imports
  const fileContent = await fs.readFile(pathname, 'utf8');
  await fs.writeFile(
    pathname,
    fileContent.replaceAll(/from ["']([^"']*)\.js["']/g, "from '$1.mjs'"),
  );

  // 2. Rename file
  const newPath = path.format({
    ...path.parse(pathname),
    base: '',
    ext: '.mjs',
  });

  console.log(`Renaming ${pathname} to ${newPath}...`);
  await fs.rename(pathname, newPath);
});
