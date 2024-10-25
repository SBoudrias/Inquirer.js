// @ts-check

import { writeFileSync } from 'node:fs';
import Module from 'node:module';
const require = Module.createRequire(import.meta.url);

/**
 * @param {string} target
 */
export function fixPeerDeps(target) {
  const pkg = require(`${target}/package.json`);

  for (const name of Object.keys(pkg.dependencies ?? {})) {
    // Import the dependency package.json file and parse it
    let depPkg;
    try {
      depPkg = require(`${name}/package.json`);
    } catch {
      // If the sub package doesn't expose their package.json; skip it.
      console.error(`Could not find package.json for ${name}. Skipping...`);
      continue;
    }

    for (const [peerName, peerVersion] of Object.entries(depPkg.peerDependencies ?? {})) {
      // If the peer dependency is not already a dependency, add it
      if (!pkg.dependencies[peerName]) {
        pkg.peerDependencies = pkg.peerDependencies ?? {};
        pkg.peerDependencies[peerName] = peerVersion;
      }
    }
  }

  // Write the updated package.json file
  writeFileSync(`${target}/package.json`, JSON.stringify(pkg, null, 2) + '\n');
}
