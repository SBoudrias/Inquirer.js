# Repository Guidelines

## Project Structure & Module Organization

The repo is a Yarn workspaces monorepo. Core runtime logic shared primitives and shared primitives live in `packages/core/src`, and individual prompt implementations under `packages/<prompt>/src`. Testing utilities sit in `packages/testing`, while `packages/demo` provides the interactive showcase. Integration suites reside in `integration/cjs` and `integration/esm` to verify bundling. Tooling scripts live in `tools/` and repo wiring (tsconfig, release helpers) in `internals/`. Treat `packages/*/dist` as generated output.

## Build, Test, and Development Commands

Install deps with `yarn install`. Use `yarn dev` for Turbo-powered incremental TypeScript builds. Launch the playground with `yarn demo`. Run `yarn tsc` for a project-wide compile. Execute `yarn pretest` for lint, format, and type gates, then `yarn test` for Vitest unit coverage followed by Node integration tests. After adding or moving workspaces, run `yarn setup` to refresh shared TS references.

## Coding Style & Naming Conventions

Code is ESM-first TypeScript targeting Node ≥ 18. Prettier enforces two-space indentation, trailing commas, and single quotes—lean on it rather than hand formatting. Prefer named exports, keep prompt IDs aligned with folder names, and store assets beside their entry points. Use `camelCase` for variables/functions and `PascalCase` for classes/components. Run `yarn oxlint --fix` and `yarn eslint --fix` before committing to maintain rule compliance.

## Testing Guidelines

Vitest owns unit coverage via `vitest.config.ts`, with `coverage.all = true` so untested files fail CI. Co-locate specs as `*.test.ts` next to source, and model cross-package flows under `integration/**/**/*.test.ts`. Iterate with `yarn vitest --run packages`, then finish with `yarn test` to exercise the full matrix. Update snapshots using `yarn vitest --update`.

## Commit & Pull Request Guidelines

Follow Conventional Commit prefixes such as `feat:`, `fix:`, `docs:`, or `chore:`; keep scopes lowercase (`feat(@inquirer/package-name): add fuzzy search`). Summaries should stay imperative and under 80 characters. Pull requests must describe the change, list the commands run (for example `yarn test`), and link issues or discussions. Attach terminal recordings or screenshots for UX-facing changes, and ensure lockfiles and generated readme fragments stay current.
