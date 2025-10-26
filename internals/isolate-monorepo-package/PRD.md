# Product Requirements Document: @repo/isolated-build

## Context & Why Now

- **Current state**: Complex bash scripts in CI test package isolation, hard to maintain and debug
- **Pain point**: Testing that packages work when published to npm requires manual simulation of isolation
- **Opportunity**: Streamline CI/CD and local debugging with a purpose-built tool for monorepo package isolation testing

## Users & JTBD

**Primary users**: Internal development team

- **JTBD**: Test that my package builds correctly when isolated from the monorepo context, as it would when published to npm
- **JTBD**: Debug build failures locally without complex script setup

**Secondary users**: CI/CD pipeline

- **JTBD**: Automatically validate package isolation on every commit

## Business Goals & Success Metrics

**Leading indicators**:

- Time to debug build issues reduced by 50%
- CI script complexity reduced from ~100 lines to <10 lines
- Zero manual dependency resolution errors

**Lagging indicators**:

- 100% of packages testable in isolation
- CI pipeline time reduced by eliminating redundant dependency analysis
- Zero npm publish failures due to missing dependencies

## Functional Requirements

1. **CLI Interface**
   - Accept single argument: workspace package name (e.g., `@inquirer/demo`)
   - Output: temp directory path to stdout
   - Exit code: 0 on success, non-zero on failure
   - **Acceptance**: `isolated-build @inquirer/demo` outputs path like `/tmp/tmp.XXXXXX`

2. **Dependency Resolution**
   - Auto-detect all workspace dependencies (direct and transitive)
   - Handle workspace:\* protocol resolution
   - **Acceptance**: Given package A→B→C dependency chain, all three are detected

3. **Package Preparation**
   - Pack all monorepo dependencies to .tgz files using `yarn workspace <name> pack`
   - Cache packed files for performance (optional optimization)
   - **Acceptance**: All workspace dependencies available as .tgz files

4. **Isolated Environment Creation**
   - Create temp directory using mktemp
   - Copy target package source files
   - Modify package.json with file: references for direct deps
   - Add resolutions for transitive deps
   - **Acceptance**: Modified package.json installable with `yarn install`

5. **Package.json Modification**
   - Replace workspace:\* with file: references to .tgz files
   - Add resolutions block for all transitive workspace dependencies
   - Preserve all other package.json fields
   - **Acceptance**: `yarn install` succeeds in isolated directory

## Non-Functional Requirements

- **Performance**: Complete isolation setup in <5 seconds for typical package
- **Reliability**: Zero false positives/negatives in dependency detection
- **Compatibility**: Support Yarn 4.x workspace features
- **Observability**: Debug mode (-v flag) shows dependency resolution steps
- **Security**: Temp directories created with restricted permissions (700)
- **Maintainability**: Single TypeScript/JavaScript file, <500 LOC

## Scope

**In scope**:

- Yarn 4.x workspace support
- Automatic dependency detection
- Package.json modification
- Temp directory creation

**Out of scope**:

- Temp directory cleanup (caller's responsibility)
- Running build/test commands (caller's responsibility)
- Support for npm/pnpm workspaces
- Dependency version range modification
- Package publishing

## Rollout Plan

**Phase 1**: Local development (Week 1)

- Implement core functionality
- Test with 2-3 representative packages
- Document usage

**Phase 2**: CI integration (Week 2)

- Replace bash script in .github/workflows/main.yml
- Update scripts/test-e2e.sh to use new tool
- Monitor for failures

**Guardrails**:

- Keep old bash script for 2 weeks as fallback
- Kill switch: ENV var `USE_LEGACY_ISOLATION=true` reverts to bash script
- Success criteria: Zero CI failures for 5 consecutive days

## Risks & Open Questions

**Risks**:

- Yarn API changes in future versions may break dependency detection
- Large monorepos might hit filesystem limits with many .tgz files
- Circular dependencies could cause infinite loops

**Open questions**:

- Should we cache .tgz files between runs for performance?
- Should tool support multiple packages in single invocation?
- How to handle packages with postinstall scripts?

**Mitigations**:

- Pin Yarn version in CI
- Implement cycle detection with max depth limit
- Add --no-cache flag for debugging

## Usage Example

```bash
# CI workflow
TEST_DIR=$(yarn isolated-build @inquirer/demo)
cd "$TEST_DIR"
yarn install
yarn tsc

# Local debugging
TEST_DIR=$(yarn isolated-build @inquirer/core -v)
cd "$TEST_DIR"
yarn install && yarn test
```
