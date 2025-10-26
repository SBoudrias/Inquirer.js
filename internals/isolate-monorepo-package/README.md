# isolate-monorepo-package

Internal tool for testing package isolation in the Inquirer.js Yarn workspace monorepo.

## Purpose

This tool simulates how packages work when published to npm by creating an isolated build environment. It:

1. Auto-discovers all workspace dependencies (direct and transitive)
2. Packs workspace dependencies as tarballs
3. Creates an isolated temp directory with modified package.json
4. Outputs the temp directory path for testing

## Installation

This tool is automatically available in the workspace. No separate installation needed.

## Usage

```bash
# From the monorepo root (using the direct node command)
TEST_DIR=$(node internals/isolate-monorepo-package/dist/cli.js @inquirer/demo)
cd "$TEST_DIR"

# With verbose output
node internals/isolate-monorepo-package/dist/cli.js @inquirer/core -v

# Output cd command (for interactive use with eval)
eval $(node internals/isolate-monorepo-package/dist/cli.js @inquirer/demo --cd)

# Example with @inquirer/demo (traditional approach for scripts/CI)
TEST_DIR=$(node internals/isolate-monorepo-package/dist/cli.js @inquirer/demo)
cd "$TEST_DIR"
yarn install
yarn tsc

# Example with --cd flag (convenient for interactive use)
eval $(node internals/isolate-monorepo-package/dist/cli.js @inquirer/demo --cd)
yarn install
yarn tsc
```

### Convenience Shell Function

Add this to your shell configuration file (`~/.bashrc`, `~/.zshrc`, etc.) for easier interactive use:

```bash
# Shell function for isolate-monorepo-package with automatic cd
isolate() {
  local dir
  dir=$(node internals/isolate-monorepo-package/dist/cli.js "$@")
  if [ $? -eq 0 ] && [ -n "$dir" ]; then
    cd "$dir"
    echo "Changed to isolated build directory: $dir"
  else
    return 1
  fi
}

# Usage:
# isolate @inquirer/demo
# isolate @inquirer/core -v
```

Alternatively, you can use the `--cd` flag with eval:

```bash
# One-liner to build and enter the isolated environment
eval $(node internals/isolate-monorepo-package/dist/cli.js @inquirer/demo --cd) && yarn install
```

## How it works

1. **Discovery**: Scans all workspace packages to find dependencies
2. **Collection**: Recursively collects direct and transitive workspace dependencies
3. **Packing**: Creates tarballs for all workspace dependencies using `yarn workspace pack`
4. **Isolation**: Creates a temp directory and copies the target package
5. **Modification**: Updates package.json to use `file:` references for workspace deps
6. **Resolutions**: Adds resolutions for transitive dependencies

## Command Line Options

- `<package-name>`: The workspace package to isolate (required)
- `-v, --verbose`: Show detailed progress information
- `--cd`: Output a `cd` command instead of just the path (for use with `eval`)

## Output

The tool outputs only the path to the isolated directory to stdout (or a `cd` command when using `--cd`). All other messages go to stderr, making it easy to capture the path in scripts:

```bash
TEST_DIR=$(node internals/isolate-monorepo-package/dist/cli.js @inquirer/demo)
```

When using the `--cd` flag, the tool outputs a complete cd command:

```bash
eval $(node internals/isolate-monorepo-package/dist/cli.js @inquirer/demo --cd)
```

## Implementation Details

- Written in TypeScript
- Under 500 lines of code
- Handles Yarn 4.x workspace protocols
- Supports both `workspace:*` protocol and regular version dependencies
- Creates artifacts in `/tmp/artifacts/`
- Preserves `.yarnrc.yml` configuration

## Troubleshooting

If the tool fails:

1. Check that you're in a Yarn workspace (`.yarnrc.yml` must exist)
2. Verify the package name exists in the workspace
3. Use `-v` flag for detailed output
4. Ensure `/tmp/artifacts/` is writable

## Development

```bash
# Build the tool
cd internals/isolate-monorepo-package
yarn build

# Watch mode for development
yarn dev
```
