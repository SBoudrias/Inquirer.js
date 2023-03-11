import path from 'node:path';
import fs from 'node:fs';
import { globby } from 'globby';

// Because we're using .mts files, TS compiles to .mjs files disregarding the target. So here we
// manually rename the common.js files to .js
const paths = await globby(['packages/**/dist/cjs/**/*.mjs', '!**/node_modules']);
paths.forEach(async (pathname) => {
  const newPath = path.format({
    ...path.parse(pathname),
    base: '',
    ext: '.js',
  });

  console.log(`Renaming ${pathname} to ${newPath}...`);
  await fs.promises.rename(pathname, newPath);
});
