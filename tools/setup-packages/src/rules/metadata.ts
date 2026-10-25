import path from 'node:path';
import { subset, validRange } from 'semver';
import type { PackageJson } from 'type-fest';
import { fileExists } from '../utils/fs.ts';
import { isJsonObject } from '../utils/jsonc.ts';

/**
 * Normalize the fields every workspace package shares: default structures,
 * the engines.node floor, and the root metadata mirrored on public packages.
 */
export async function applyMetadataRules(
  pkg: PackageJson,
  {
    rootPkg,
    dir,
  }: {
    rootPkg: Pick<PackageJson, 'author' | 'license' | 'repository' | 'keywords'> & {
      engines: { node: string };
    };
    dir: string;
  },
) {
  pkg.devDependencies ??= {};
  pkg.engines ??= {};
  pkg.publishConfig ??= {};
  pkg.scripts ??= {};
  pkg.exports ??= {};
  pkg.sideEffects ??= false;

  // A package range must be valid and a subset of the root range.
  const pkgNodeRange = pkg.engines['node'];
  if (
    typeof pkgNodeRange !== 'string' ||
    validRange(pkgNodeRange) == null ||
    !subset(pkgNodeRange, rootPkg.engines.node)
  ) {
    pkg.engines['node'] = rootPkg.engines.node;
  }

  if (pkg.private === true) return;

  pkg.author = rootPkg.author;
  pkg.license = rootPkg.license;
  pkg.repository = rootPkg.repository;
  if (!dir.startsWith('tools/')) {
    pkg.keywords = [...new Set([...(rootPkg.keywords ?? []), ...(pkg.keywords ?? [])])];
  }
  pkg.publishConfig = { access: 'public' };

  if (await fileExists(path.join(dir, 'README.md'))) {
    pkg.homepage = `https://github.com/SBoudrias/Inquirer.js/blob/main/${dir}/README.md`;
  }
}

/**
 * Last step: strip publishing metadata from private packages, and return the
 * package without the keys holding empty objects.
 */
export function cleanupPackage(pkg: PackageJson): PackageJson {
  if (pkg.private === true) {
    delete pkg.author;
    delete pkg.license;
    delete pkg.repository;
    delete pkg.keywords;
    delete pkg.homepage;
    delete pkg.publishConfig;
    delete pkg.files;
  }

  return Object.fromEntries(
    Object.entries(pkg).filter(
      ([, value]) => !isJsonObject(value) || Object.keys(value).length > 0,
    ),
  );
}
