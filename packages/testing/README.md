# `@inquirer/testing`

The `@inquirer/testing` package is Inquirer's answer to testing prompts [built with `@inquirer/core`](https://github.com/SBoudrias/Inquirer.js/tree/main/packages/core).

# Installation

<table>
<tr>
  <th>npm</th>
  <th>yarn</th>
</tr>
<tr>
<td>

```sh
npm install @inquirer/testing --save-dev
```

</td>
<td>

```sh
yarn add @inquirer/testing --dev
```

</td>
</tr>
</table>

# Usage

This package provides two ways to test Inquirer prompts:

1. **Unit testing** with `render()` - Test individual prompts in isolation
2. **E2E testing** with `screen` - Test full CLI applications that use Inquirer

## Unit Testing with `render()`

The `render()` function creates and instruments a command line interface for testing a single prompt.

```ts
import { render } from '@inquirer/testing';
import input from '@inquirer/input';

describe('input prompt', () => {
  it('handle simple use case', async () => {
    const { answer, events, getScreen } = await render(input, {
      message: 'What is your name',
    });

    expect(getScreen()).toMatchInlineSnapshot(`"? What is your name"`);

    events.type('J');
    expect(getScreen()).toMatchInlineSnapshot(`"? What is your name J"`);

    events.type('ohn');
    events.keypress('enter');

    await expect(answer).resolves.toEqual('John');
    expect(getScreen()).toMatchInlineSnapshot(`"? What is your name John"`);
  });
});
```

### `render()` API

`render` takes 2 arguments:

1. The Inquirer prompt to test (the return value of `createPrompt()`)
2. The prompt configuration (the first prompt argument)

`render` returns a promise that resolves once the prompt is rendered. This promise returns:

- `answer` (`Promise`) - Resolves when an answer is provided and valid
- `getScreen` (`({ raw?: boolean }) => string`) - Returns the current screen content. By default strips ANSI codes
- `events` - Utilities to interact with the prompt:
  - `keypress(key: string | KeyObject)` - Trigger a keypress event
  - `type(text: string)` - Type text into the prompt
- `getFullOutput` (`() => Promise<string>`) - Returns the full output interpreted through a virtual terminal, resolving ANSI escape sequences into the actual screen state

### Unit Testing Example

You can refer to the [`@inquirer/input` test suite](https://github.com/SBoudrias/Inquirer.js/blob/main/packages/input/input.test.ts) for a comprehensive unit testing example using `render()`.

## E2E Testing with `screen`

For testing full CLI applications that use Inquirer prompts internally, use the framework-specific entry points:

### Vitest

```ts
import { describe, it, expect } from 'vitest';
import { screen } from '@inquirer/testing/vitest';

// Import your CLI AFTER @inquirer/testing/vitest
import { runMyCli } from './my-cli.js';

describe('my CLI', () => {
  it('asks for name and confirms', async () => {
    const result = runMyCli();
    await screen.nextPrompt();

    // First prompt
    expect(screen.getScreen()).toContain('What is your name?');
    screen.type('John');
    screen.keypress('enter');

    // Wait for next prompt
    await screen.nextPrompt();
    expect(screen.getScreen()).toContain('Confirm?');
    screen.keypress('enter');

    await result;
  });
});
```

### Jest

```ts
import { screen } from '@inquirer/testing/jest';
import { runMyCli } from './my-cli.js';

describe('my CLI', () => {
  it('asks for name and confirms', async () => {
    const result = runMyCli();
    await screen.nextPrompt();

    // First prompt
    expect(screen.getScreen()).toContain('What is your name?');
    screen.type('John');
    screen.keypress('enter');

    // Wait for next prompt
    await screen.nextPrompt();
    expect(screen.getScreen()).toContain('Confirm?');
    screen.keypress('enter');

    await result;
  });
});
```

### `screen` API

The `screen` object provides:

- `nextPrompt()` - Wait for the current prompt to be ready, or for it to complete and the next prompt to render. Call this after starting your CLI and after sending input that completes a prompt (e.g., pressing enter)
- `getScreen({ raw?: boolean })` - Get the current prompt screen content. By default strips ANSI codes
- `getFullOutput({ raw?: boolean })` - Get all accumulated output interpreted through a virtual terminal (returns a `Promise`). By default resolves ANSI escape sequences into actual screen state
- `type(text)` - Type text (writes to stream AND emits keypresses)
- `keypress(key)` - Send a keypress event
- `clear()` - Reset screen state (called automatically before each test)

### Mocking Third-Party Prompts

All `@inquirer/*` prompts are mocked automatically. To mock a third-party or custom prompt package, use `wrapPrompt` in your own `vi.mock()` call:

```ts
import { screen, wrapPrompt } from '@inquirer/testing/vitest';

vi.mock('@my-company/custom-prompt', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@my-company/custom-prompt')>();
  return { ...actual, default: wrapPrompt(actual.default) };
});
```

### Important Notes

1. **Import order matters**: Import `@inquirer/testing/vitest` or `@inquirer/testing/jest` BEFORE importing modules that use Inquirer prompts
2. **Editor prompt not supported**: The `@inquirer/editor` prompt opens an external editor and isn't currently supported in E2E testing.
3. **Sequential prompts**: Multiple prompts are supported, but they must run sequentially (not concurrently)

### E2E Testing Example

You can refer to the [`@inquirer/demo` test suite](https://github.com/SBoudrias/Inquirer.js/blob/main/packages/demo/demo.test.ts) for a comprehensive E2E testing example using `screen`.

# License

Copyright (c) 2023 Simon Boudrias (twitter: [@vaxilart](https://twitter.com/Vaxilart))<br/>
Licensed under the MIT license.
