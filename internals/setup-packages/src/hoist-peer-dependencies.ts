import { writeFileSync } from 'node:fs';
import Module from 'node:module';
import type { PackageJson } from 'type-fest';

const require = Module.createRequire(import.meta.url);

export function fixPeerDeps(target: string) {
  const pkg = require(`${target}/package.json`) as PackageJson;

  for (const name of Object.keys(pkg.dependencies ?? {})) {
    // Import the dependency package.json file and parse it
    let depPkg: PackageJson;
    try {
      depPkg = require(`${name}/package.json`) as PackageJson;
    } catch {
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

  // Write the updated package.json file
  writeFileSync(`${target}/package.json`, JSON.stringify(pkg, null, 2) + '\n');
}
