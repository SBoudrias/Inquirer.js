import { describe, expect, it } from 'vitest';
import type { PackageJson } from 'type-fest';
import { validateEngineCompatibility } from './validate-engines.ts';

function workspacePackage(packageJson: PackageJson) {
  return {
    packageJson,
    packagePath: `${packageJson.name ?? 'anonymous'}/package.json`,
    packageDir: process.cwd(),
  };
}

describe('validateEngineCompatibility', () => {
  it('reports public packages whose dependencies support a narrower Node range', () => {
    const issues = validateEngineCompatibility(
      [
        workspacePackage({
          name: '@inquirer/core',
          engines: {
            node: '>=23.5.0 || ^22.13.0 || ^21.7.0 || ^20.12.0',
          },
          dependencies: {
            'mute-stream': '^4.0.0',
          },
        }),
      ],
      () => ({
        engines: {
          node: '^22.22.2 || ^24.15.0 || >=26.0.0',
        },
      }),
    );

    expect(issues).toEqual([
      {
        packageName: '@inquirer/core',
        packagePath: '@inquirer/core/package.json',
        packageRange: '>=23.5.0 || ^22.13.0 || ^21.7.0 || ^20.12.0',
        dependencyName: 'mute-stream',
        dependencyRange: '^22.22.2 || ^24.15.0 || >=26.0.0',
        reason: 'narrower-dependency-range',
      },
    ]);
  });

  it('accepts dependencies whose Node range covers the package range', () => {
    const issues = validateEngineCompatibility(
      [
        workspacePackage({
          name: '@inquirer/core',
          engines: {
            node: '>=23.5.0 || ^22.13.0 || ^20.17.0',
          },
          dependencies: {
            'mute-stream': '^3.0.0',
          },
        }),
      ],
      () => ({
        engines: {
          node: '^20.17.0 || >=22.9.0',
        },
      }),
    );

    expect(issues).toEqual([]);
  });

  it('reports public packages with invalid Node ranges', () => {
    const issues = validateEngineCompatibility([
      workspacePackage({
        name: '@inquirer/core',
        engines: {
          node: 'unsupported',
        },
      }),
    ]);

    expect(issues).toEqual([
      {
        packageName: '@inquirer/core',
        packagePath: '@inquirer/core/package.json',
        packageRange: 'unsupported',
        reason: 'invalid-package-range',
      },
    ]);
  });

  it('ignores private packages', () => {
    const issues = validateEngineCompatibility(
      [
        workspacePackage({
          name: 'setup-packages',
          private: true,
          engines: {
            node: '>=20.12.0',
          },
          dependencies: {
            semver: '^7.0.0',
          },
        }),
      ],
      () => ({
        engines: {
          node: '>=20.17.0',
        },
      }),
    );

    expect(issues).toEqual([]);
  });
});
