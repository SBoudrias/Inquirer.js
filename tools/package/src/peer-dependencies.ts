import type { PackageJson } from 'type-fest';
import { resolveDependencyPackageJson } from './package-json.ts';

export type ResolvePackageJson = (
  dependencyName: string,
  fromDirectory: string,
) => PackageJson | undefined;

export type PeerDependencyHoist =
  | {
      kind: 'peer-dependency';
      dependencyName: string;
      peerName: string;
      peerVersion: string;
    }
  | {
      kind: 'peer-dependency-meta';
      dependencyName: string;
      peerName: string;
      peerMeta: NonNullable<PackageJson['peerDependenciesMeta']>[string];
    };

export type PeerDependencyHoistResult = {
  hoists: PeerDependencyHoist[];
  missingDependencies: string[];
};

function runtimeDependencyNames(pkg: PackageJson) {
  return new Set([
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.optionalDependencies ?? {}),
  ]);
}

function hasRuntimeDependency(pkg: PackageJson, dependencyName: string) {
  return (
    pkg.dependencies?.[dependencyName] != null ||
    pkg.optionalDependencies?.[dependencyName] != null
  );
}

export function getPeerDependencyHoists(
  pkg: PackageJson,
  packageDir: string,
  resolvePackageJson: ResolvePackageJson = resolveDependencyPackageJson,
): PeerDependencyHoistResult {
  const hoists: PeerDependencyHoist[] = [];
  const missingDependencies: string[] = [];

  for (const dependencyName of runtimeDependencyNames(pkg)) {
    const dependencyPackage = resolvePackageJson(dependencyName, packageDir);
    if (dependencyPackage == null) {
      missingDependencies.push(dependencyName);
      continue;
    }

    for (const peerName of Object.keys(dependencyPackage.peerDependencies ?? {})) {
      const peerVersion = dependencyPackage.peerDependencies?.[peerName];
      if (typeof peerVersion !== 'string') continue;

      let packageShouldHavePeer =
        !hasRuntimeDependency(pkg, peerName) && pkg.peerDependencies?.[peerName] == null;

      if (packageShouldHavePeer) {
        hoists.push({
          kind: 'peer-dependency',
          dependencyName,
          peerName,
          peerVersion,
        });
      }

      packageShouldHavePeer ||= pkg.peerDependencies?.[peerName] != null;
      const peerMeta = dependencyPackage.peerDependenciesMeta?.[peerName];
      if (
        packageShouldHavePeer &&
        peerMeta != null &&
        pkg.peerDependenciesMeta?.[peerName] == null
      ) {
        hoists.push({
          kind: 'peer-dependency-meta',
          dependencyName,
          peerName,
          peerMeta,
        });
      }
    }
  }

  return { hoists, missingDependencies };
}

export function applyPeerDependencyHoists(
  pkg: PackageJson,
  hoists: PeerDependencyHoist[],
) {
  for (const hoist of hoists) {
    if (hoist.kind === 'peer-dependency') {
      pkg.peerDependencies ??= {};
      pkg.peerDependencies[hoist.peerName] = hoist.peerVersion;
    } else {
      pkg.peerDependenciesMeta ??= {};
      pkg.peerDependenciesMeta[hoist.peerName] = hoist.peerMeta;
    }
  }
}

export function hoistPeerDependencies(
  pkg: PackageJson,
  packageDir: string,
  resolvePackageJson?: ResolvePackageJson,
) {
  const { hoists } = getPeerDependencyHoists(pkg, packageDir, resolvePackageJson);
  applyPeerDependencyHoists(pkg, hoists);
  return hoists.length > 0;
}
