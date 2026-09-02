# @sboudrias/package

Package metadata tools for JavaScript packages and monorepos.

# Installation

<table>
<tr>
  <th>npm</th>
  <th>yarn</th>
  <th>pnpm</th>
  <th>bun</th>
</tr>
<tr>
<td>

```sh
npm install @sboudrias/package --save-dev
```

</td>
<td>

```sh
yarn add @sboudrias/package --dev
```

</td>
<td>

```sh
pnpm add @sboudrias/package --save-dev
```

</td>
<td>

```sh
bun add @sboudrias/package --dev
```

</td>
</tr>
</table>

# Commands

| Command                                               | Description                                                   |
| ----------------------------------------------------- | ------------------------------------------------------------- |
| [`package lint`](#package-lint)                       | Validate and fix package metadata.                            |
| [`package normalize`](#package-normalize)             | Fix workspace manifests so they are valid for npm publishing. |
| [`package pin <dependency>`](#package-pin-dependency) | Pin exact versions of a workspace dependency.                 |

All commands operate on public workspace packages (see [Workspace Discovery](#workspace-discovery)) and write manifests in place.

## package lint

```bash
package lint
```

`package lint` validates public workspace packages and fixes safe package metadata issues in place.

```bash
package lint --check
```

`package lint --check` runs the same validation without writing files. It exits non-zero when any package needs a fix or has a manual conflict.

### Valid Peer Dependencies

Runtime dependencies can declare their own peer dependencies. `package lint` makes those peer requirements visible on the package that uses the runtime dependency.

It adds missing peers to `peerDependencies` and copies matching `peerDependenciesMeta` entries so optional peers stay optional.

### Matching engines

Packages should only advertise Node.js support that their runtime dependencies can also support.

`package lint` sets missing, invalid, or out-of-root-range `engines.node` values to the root package `engines.node` range. It fails when a runtime dependency supports a narrower Node.js range than the package.

That failure is intentional. Bumping a dependency can raise the minimum supported Node.js version and break dependants that still install the package under the previous `engines.node` range. In that case, manually narrow the package engine range or choose a compatible dependency version.

### Ensure package.json is exposed

Packages should expose their manifest for tools that inspect package metadata at runtime.

`package lint` ensures public packages expose `"./package.json": "./package.json"` in `exports`.

## package normalize

```bash
package normalize
```

`package normalize` applies every manifest fixup required to make public workspace packages valid for npm publishing, in place.

Currently it removes dev dependencies declared with the `workspace:*` protocol: those specs only resolve inside the workspace and are invalid once the package is published, so they must be stripped from the manifest before it is packed. Dev dependencies with other specs are left untouched.

As new npm-validity issues are identified, their fixups join this command instead of the calling pipeline. The Inquirer.js release pipeline runs it at `prepack` time, right before packing the tarballs.

## package pin <dependency>

```bash
package pin <dependency>
```

`package pin <dependency>` rewrites semver ranges (`^1.2.3`, `~1.2.3`) of the given dependency to exact versions (`1.2.3`) across all public workspace packages, in place.

Exact specs, `workspace:` protocols, and dev dependencies are left untouched. It exits non-zero when a range cannot be resolved to a single exact version (e.g. `>=1.0.0`, `1.x`); such ranges must be fixed manually.

The Inquirer.js release pipeline uses this at `prepack` time to pin `@inquirer/type` exactly in published manifests: type-only dependencies leak into consumers' `.d.ts` compilation, so an uncontrolled range can break downstream TypeScript builds even when the runtime behavior is unchanged.

# Workspace Discovery

The CLI discovers workspaces from `package.json` `workspaces` fields and `pnpm-workspace.yaml` files.

If no workspaces are configured, the root `package.json` is treated as a single-package project.

Private packages are ignored by default.
