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

# Example

Here's an example of a test running with Jest (though `@inquirer/testing` will work with any runners).

```ts
import { render } from '@inquirer/testing';
import input from './src/index.mjs';

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
    // or events.keypress({ name: 'enter' })

    await expect(answer).resolves.toEqual('John');
    expect(getScreen()).toMatchInlineSnapshot(`"? What is your name John"`);
  });
});
```

# Usage

The core utility of `@inquirer/testing` is the `render()` function. This `render` function will create and instrument a command line like interface.

`render` takes 2 arguments:

1. The Inquirer prompt to test (the return value of `createPrompt()`)
2. The prompt configuration (the first prompt argument)

`render` then returns a promise that will resolve once the prompt is rendered and the test environment up and running. This promise returns the utilities we'll use to interact with our tests:

1. `answer` (`Promise`) This is the promise that'll be resolved once an answer is provided and valid.
2. `getScreen` (`({ raw: boolean }) => string`) This function returns the state of what is printed on the command line screen at any given time. You can use its return value to validate your prompt is properly rendered. By default this function will strip the ANSI codes (used for colors.)
3. `events` (`{ keypress: (name | Key) => void, type: (string) => void }`) Is the utilities allowing you to interact with the prompt. Use it to trigger keypress events, or typing any input.
4. `getFullOutput` (`() => string`) Return a raw dump of everything that got sent on the output stream.

You can refer to [the `@inquirer/input` prompt test suite](https://github.com/SBoudrias/Inquirer.js/blob/main/packages/input/input.test.ts) as a practical example.

# License

Copyright (c) 2023 Simon Boudrias (twitter: [@vaxilart](https://twitter.com/Vaxilart))<br/>
Licensed under the MIT license.
