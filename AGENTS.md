# Repository Guidelines

## Project Structure & Module Organization

The repo is a Yarn workspaces monorepo. Core runtime logic shared primitives and shared primitives live in `packages/core/src`, and individual prompt implementations under `packages/<prompt>/src`. Testing utilities sit in `packages/testing`, while `packages/demo` provides the interactive showcase. Integration suites reside in `integration/cjs` and `integration/esm` to verify bundling. Tooling scripts live in `tools/` and repo wiring (tsconfig, release helpers) in `internals/`. Treat `packages/*/dist` as generated output.

## Build, Test, and Development Commands

Install deps with `yarn install`. Use `yarn dev` for Turbo-powered incremental TypeScript builds. Launch the playground with `yarn demo`. Run `yarn tsc` for a project-wide compile. Execute `yarn pretest` for lint, format, and type gates, then `yarn test` for Vitest unit coverage followed by Node integration tests. After adding or moving workspaces, run `yarn setup` to refresh shared TS references.

## Coding Style & Naming Conventions

Code is ESM-first TypeScript targeting Node ≥ 18. Prettier enforces two-space indentation, trailing commas, and single quotes—lean on it rather than hand formatting. Prefer named exports, keep prompt IDs aligned with folder names, and store assets beside their entry points. Use `camelCase` for variables/functions and `PascalCase` for classes/components. Run `yarn oxlint --fix` and `yarn eslint --fix` before committing to maintain rule compliance.

## TypeScript Best Practices

Prioritize type safety and leverage existing types from the codebase. Use `Question<A>` from `packages/inquirer/src/types.ts` instead of generic `Record<string, unknown>` when working with question objects. Prefer `unknown` over `any` for truly unknown types, and use `Partial<T>` for optional properties. Leverage generic type parameters (like `<A extends Answers>`) throughout to maintain type consistency. Avoid eslint-disable comments by refactoring to proper types rather than suppressing warnings. When extending types, use intersection types (`Type & { prop: T }`) for explicit signatures rather than casting to `any`.

## Testing Guidelines

Vitest owns unit coverage via `vitest.config.ts`, with `coverage.all = true` so untested files fail CI. Co-locate specs as `*.test.ts` next to source, and model cross-package flows under `integration/**/**/*.test.ts`. Iterate with `yarn vitest --run packages`, then finish with `yarn test` to exercise the full matrix. Update snapshots using `yarn vitest --update`.

Keep tests simple and focused. Reuse existing test stubs and fixtures rather than creating custom mocks. If a behavior affects all prompts, test it with an existing prompt type rather than creating a specialized stub. Write tests that verify actual behavior rather than implementation details. Prefer straightforward assertions over complex validation logic.

## Package-Specific Code Style

### Type Declarations

Prefer `type` over `interface` for all object shapes. Never prefix type names with `I` (no `IEditorParams`, `IFileOptions`). Use descriptive names without Hungarian notation: `EditorParams`, `FileOptions`.

### Node.js Built-in Imports

Always use the `node:` protocol prefix for Node.js built-in modules: `import { spawn } from 'node:child_process'`, `import { readFileSync } from 'node:fs'`. This is enforced by linting.

### Error Classes

Model custom error classes after the style in `packages/core/src/lib/errors.ts`:

- Declare `override name = 'ErrorName'` as a class field (not set in the constructor).
- Pass `{ cause: originalError }` to `super()` to populate `this.cause` per the standard `Error` API.
- Do not add a separate `originalError` instance field.
- Do not include copyright header comments.

### Async Patterns

All async operations must be Promise-based. Do not use Node-style callbacks `(err, result) => void`. Do not use `setImmediate` to defer callbacks; use `await` and `Promise` directly. Wrap event-emitter-based APIs (like `child_process.spawn`) in `new Promise(...)`.

### Test File Location

Unit tests must be co-located as `*.test.ts` files beside their source files inside `src/`. Separate `test/` directories are not used.

## Commit & Pull Request Guidelines

Follow Conventional Commit prefixes such as `feat:`, `fix:`, `docs:`, or `chore:`; keep scopes lowercase (`feat(@inquirer/package-name): add fuzzy search`). Summaries should stay imperative and under 80 characters. Pull requests must describe the change, list the commands run (for example `yarn test`), and link issues or discussions. Attach terminal recordings or screenshots for UX-facing changes, and ensure lockfiles and generated readme fragments stay current.
