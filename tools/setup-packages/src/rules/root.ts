import { validRange } from 'semver';
import type { PackageJson } from 'type-fest';
import { githubUrl } from './metadata.ts';

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

  // Warned once here: the metadata rule then skips the homepage of every package.
  const { repository } = rootPkg;
  if (repository !== undefined && githubUrl(repository) === undefined) {
    const url = typeof repository === 'string' ? repository : repository.url;
    console.warn(
      `Cannot link package READMEs from repository "${url}": only GitHub repositories are supported`,
    );
  }

  return { ...rootPkg, workspaces, engines: { ...rootPkg.engines, node: nodeRange } };
}
