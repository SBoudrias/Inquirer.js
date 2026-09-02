import path from 'node:path';
import { writePackageJsonFile } from '../package-json.ts';
import { readWorkspaceProject, type WorkspacePackage } from '../workspaces.ts';

export type ManifestFixup = {
  kind: 'remove-workspace-dev-dependency';
  packagePath: string;
  name: string;
  dependencyName: string;
};

type PackageFixup = (pkg: WorkspacePackage) => ManifestFixup[];

/**
 * Removes dev dependencies declared with the `workspace:*` protocol. Those
 * specs only resolve inside the workspace and are invalid once the package is
 * published, so they must be stripped from the manifest before it is packed
 * into the tarball. Dev dependencies with other specs are left untouched.
 */
function fixWorkspaceDevDependencies(pkg: WorkspacePackage): ManifestFixup[] {
  const { packageJson, packagePath } = pkg;
  if (packageJson.private === true) return [];

  const name = packageJson.name ?? packagePath;
  const devDependencies = packageJson.devDependencies;
  if (devDependencies == null) return [];

  const entries = Object.entries(devDependencies);
  const kept = entries.filter(([, spec]) => spec !== 'workspace:*');
  if (kept.length === entries.length) return [];

  packageJson.devDependencies = Object.fromEntries(kept);

  return entries.flatMap(([dependencyName, spec]) =>
    spec === 'workspace:*'
      ? [
          {
            kind: 'remove-workspace-dev-dependency' as const,
            packagePath,
            name,
            dependencyName,
          },
        ]
      : [],
  );
}

const FIXUPS: PackageFixup[] = [fixWorkspaceDevDependencies];

/**
 * Applies every manifest fixup required to make public workspace packages
 * valid for npm publishing. Run before packing tarballs.
 */
export async function normalizeManifests(
  options: { cwd?: string } = {},
): Promise<ManifestFixup[]> {
  const cwd = options.cwd ?? process.cwd();
  const { packages } = await readWorkspaceProject(cwd);

  const fixups = packages.flatMap((pkg) => FIXUPS.flatMap((fixup) => fixup(pkg)));

  const changedPackagePaths = new Set(fixups.map((fixup) => fixup.packagePath));
  await Promise.all(
    packages
      .filter(({ packagePath }) => changedPackagePaths.has(packagePath))
      .map(({ packageJson, packagePath }) =>
        writePackageJsonFile(path.join(cwd, packagePath), packageJson),
      ),
  );

  return fixups;
}
