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

# Usage

```bash
package lint
```

`package lint` validates public workspace packages and fixes safe package metadata issues in place.

```bash
package lint --check
```

`package lint --check` runs the same validation without writing files. It exits non-zero when any package needs a fix or has a manual conflict.

# Lint Rules

## Valid Peer Dependencies

Runtime dependencies can declare their own peer dependencies. `package lint` makes those peer requirements visible on the package that uses the runtime dependency.

It adds missing peers to `peerDependencies` and copies matching `peerDependenciesMeta` entries so optional peers stay optional.

## Matching engines

Packages should only advertise Node.js support that their runtime dependencies can also support.

`package lint` sets missing, invalid, or out-of-root-range `engines.node` values to the root package `engines.node` range. It fails when a runtime dependency supports a narrower Node.js range than the package.

That failure is intentional. Bumping a dependency can raise the minimum supported Node.js version and break dependants that still install the package under the previous `engines.node` range. In that case, manually narrow the package engine range or choose a compatible dependency version.

## Ensure package.json is exposed

Packages should expose their manifest for tools that inspect package metadata at runtime.

`package lint` ensures public packages expose `"./package.json": "./package.json"` in `exports`.

# Workspace Discovery

The CLI discovers workspaces from `package.json` `workspaces` fields and `pnpm-workspace.yaml` files.

If no workspaces are configured, the root `package.json` is linted as a single-package project.

Private packages are ignored by default.
