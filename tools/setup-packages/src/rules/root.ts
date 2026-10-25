import { validRange } from 'semver';
import type { PackageJson } from 'type-fest';

/**
 * Validate the root package.json, and return it typed with what the other
 * rules rely on: a list of workspace globs and a valid engines.node range.
 */
export function validateRootPackage(rootPkg: PackageJson) {
  const { workspaces } = rootPkg;
  const nodeRange = rootPkg.engines?.['node'];
  if (
    !Array.isArray(workspaces) ||
    typeof nodeRange !== 'string' ||
    validRange(nodeRange) == null
  ) {
    throw new Error(
      'The scaffolding tool requires `workspaces` and `engines.node` in the root package.json',
    );
  }

  return { ...rootPkg, workspaces, engines: { ...rootPkg.engines, node: nodeRange } };
}
