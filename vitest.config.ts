import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, defaultExclude, coverageConfigDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: ['integration/**', ...defaultExclude],
    coverage: {
      provider: 'v8',
      all: true,
      exclude: [
        ...coverageConfigDefaults.exclude,
        'tools/**',
        'packages/inquirer/examples/**',
        'packages/demo/**',
        '.yarn/**',
        '**/*.type.mts',
      ],
    },
    testTimeout: 300,
  },
  resolve: {
    alias: [
      {
        // Resolve @inquirer/* packages to their source code
        find: /@inquirer\/(.*)/,
        replacement: '$1', //fileURLToPath(new URL('packages/$1/src', import.meta.url)),
        customResolver: (source) => {
          const [pkgName, path] = source.split('/');

          if (!path) {
            return fileURLToPath(
              new URL(`packages/${pkgName}/src/index.ts`, import.meta.url),
            );
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
          const pkgJSON: any = JSON.parse(
            readFileSync(
              new URL(`packages/${pkgName}/package.json`, import.meta.url),
              'utf8',
            ),
          );

          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          const resolvedPath = String(pkgJSON.tshy.exports[`./${path}`]);
          return fileURLToPath(
            new URL(`packages/${pkgName}/${resolvedPath}`, import.meta.url),
          );
        },
      },
    ],
  },
});
