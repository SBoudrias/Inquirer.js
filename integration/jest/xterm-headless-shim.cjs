// @xterm/headless v6 is CJS that sets __esModule and only exports named
// bindings (no default). Under a CJS transform (the only setup where Jest's
// jest.mock works), `import xterm from '@xterm/headless'` in
// @inquirer/testing's terminal.ts resolves to xterm.default — which does not
// exist. This shim re-exports the real module with a default binding, so the
// default import behaves like native ESM (module.exports itself).
// The direct file path is required: requiring the package name would
// re-enter this moduleNameMapper mapping in a loop.
const xterm = require('@xterm/headless/lib-headless/xterm-headless.js');

module.exports = {
  __esModule: true,
  default: xterm,
  Terminal: xterm.Terminal,
};
