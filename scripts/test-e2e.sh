#!/bin/bash
set -e

echo "Running E2E build tests locally..."

# Build the project first (if not already built)
if [ ! -d "packages/core/dist" ]; then
  echo "Building TypeScript..."
  yarn tsc
else
  echo "TypeScript already built, skipping..."
fi

# Use isolated-build tool to set up isolated environment
echo "Setting up isolated build environment for @inquirer/demo..."
TEST_DIR=$(yarn workspace @repo/isolated-build node bin/index.js @inquirer/demo -v)

echo "Using test directory: $TEST_DIR"

# Build in the isolated environment
cd "$TEST_DIR"

echo "Setting up Yarn..."
yarn set version stable

echo "Installing dependencies with local packages..."
yarn install

echo "Building..."
yarn tsc

echo "E2E test completed successfully!"
echo "Temp directory: $TEST_DIR (not cleaned up for inspection)"
