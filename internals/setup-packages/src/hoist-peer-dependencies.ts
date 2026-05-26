import type { PackageJson } from 'type-fest';
import { resolveDependencyPackageJson } from './package-json.ts';

export function fixPeerDeps(pkg: PackageJson, target: string) {
  for (const name of Object.keys(pkg.dependencies ?? {})) {
    // Import the dependency package.json file and parse it
    const depPkg = resolveDependencyPackageJson(name, target);
    if (depPkg == null) {
      // If the sub package doesn't expose their package.json; skip it.
      console.error(`Could not find package.json for ${name}. Skipping...`);
      continue;
    }

    for (const [peerName, peerVersion] of Object.entries(depPkg.peerDependencies ?? {})) {
      // If the peer dependency is not already a dependency, add it
      if (pkg.dependencies && !pkg.dependencies[peerName]) {
        pkg.peerDependencies = pkg.peerDependencies ?? {};
        pkg.peerDependencies[peerName] = peerVersion;
      }
    }
  }
}
