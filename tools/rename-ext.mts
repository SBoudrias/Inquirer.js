import path from 'node:path';
import fs from 'node:fs/promises';
import { globby } from 'globby';

// Because we're using .mts files, TS compiles to .mjs files disregarding the target. So here we
// manually rename the common.js files to .js
const paths: string[] = await globby([
  'packages/**/dist/cjs/**/*.mjs',
  '!**/node_modules',
]);

paths.forEach(async (pathname: string) => {
  const fileContent = await fs.readFile(pathname, 'utf-8');
  await fs.writeFile(pathname, fileContent.replace(/\.mjs/g, '.js'));

  const newPath = path.format({
    ...path.parse(pathname),
    base: '',
    ext: '.js',
  });

  console.log(`Renaming ${pathname} to ${newPath}...`);
  await fs.rename(pathname, newPath);
});
