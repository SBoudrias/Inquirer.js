import { interpretTerminalOutput } from './terminal.ts';

// @xterm/headless is a CommonJS bundle: under jest's CommonJS transform the
// default export is undefined, so interpretTerminalOutput() crashed with
// 'Cannot read properties of undefined (reading Terminal)'. This regression
// test runs terminal.ts under that transform.
describe('interpretTerminalOutput', () => {
  it('resolves the xterm module across interop loaders', async () => {
    expect(await interpretTerminalOutput('hello\r\nworld')).toBe('hello\nworld');
  });
});
