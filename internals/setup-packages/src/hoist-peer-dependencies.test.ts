import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PackageJson } from 'type-fest';
import { fixPeerDeps } from './hoist-peer-dependencies.ts';
import { resolveDependencyPackageJson } from './package-json.ts';

vi.mock('./package-json.ts', () => ({
  resolveDependencyPackageJson: vi.fn(),
}));

const resolveDependencyPackageJsonMock = vi.mocked(resolveDependencyPackageJson);

describe('fixPeerDeps', () => {
  beforeEach(() => {
    resolveDependencyPackageJsonMock.mockReset();
  });

  it('adds missing peer dependencies from runtime dependencies', () => {
    const pkg: PackageJson = {
      dependencies: {
        'uses-react': '^1.0.0',
      },
    };

    resolveDependencyPackageJsonMock.mockReturnValue({
      peerDependencies: {
        react: '^19.0.0',
      },
    });

    fixPeerDeps(pkg, process.cwd());

    expect(pkg.peerDependencies).toEqual({ react: '^19.0.0' });
  });

  it('does not add peers that are already runtime dependencies', () => {
    const pkg: PackageJson = {
      dependencies: {
        react: '^19.0.0',
        'uses-react': '^1.0.0',
      },
    };

    resolveDependencyPackageJsonMock.mockReturnValue({
      peerDependencies: {
        react: '^19.0.0',
      },
    });

    fixPeerDeps(pkg, process.cwd());

    expect(pkg.peerDependencies).toBeUndefined();
  });
});
