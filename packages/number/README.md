# `@inquirer/number`

Interactive free number input component for command line interfaces. Supports validation, filtering, transformation, etc.

# Installation

<table>
<tr>
  <th>yarn</th>
  <th>pnpm</th>
</tr>
<tr>
<td>

```sh
yarn add @inquirer/prompts
```

</td>
<td>

```sh
pnpm add @inquirer/prompts
```

</td>
</tr>
<tr>
  <th>bun</th>
  <th>deno</th>
</tr>
<tr>
<td>

```sh
bun add @inquirer/prompts
```

</td>
<td>

```sh
deno add npm:@inquirer/prompts
```

</td>
</tr>
<tr>
<th colSpan="2">npm</th>
</tr>
<tr>
<td colSpan="2">

```sh
npm install @inquirer/prompts
```

</td>
</tr>
<tr>
<td colSpan="2" align="center">Or</td>
</tr>
<tr>
  <th>yarn</th>
  <th>pnpm</th>
</tr>
<tr>
<td>

```sh
yarn add @inquirer/number
```

</td>
<td>

```sh
pnpm add @inquirer/number
```

</td>
</tr>
<tr>
  <th>bun</th>
  <th>deno</th>
</tr>
<tr>
<td>

```sh
bun add @inquirer/number
```

</td>
<td>

```sh
deno add npm:@inquirer/number
```

</td>
</tr>
<tr>
<th colSpan="2">npm</th>
</tr>
<tr>
<td colSpan="2">

```sh
npm install @inquirer/number
```

</td>
</tr>
</table>

On Deno, prompts detect the terminal's unicode and color support from the environment, so run your script with `--allow-env`.

# Usage

```js
import { number } from '@inquirer/prompts';
// Or
// import number from '@inquirer/number';

const answer = await number({ message: 'Enter your age' });
```

## Options

| Property | Type                                                                       | Required | Description                                                                                                                                                                                                                                                     |
| -------- | -------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| message  | `string`                                                                   | yes      | The question to ask                                                                                                                                                                                                                                             |
| default  | `number`                                                                   | no       | Default value if no answer is provided (clear it by pressing backspace)                                                                                                                                                                                         |
| min      | `number`                                                                   | no       | The minimum value to accept for this input.                                                                                                                                                                                                                     |
| max      | `number`                                                                   | no       | The maximum value to accept for this input.                                                                                                                                                                                                                     |
| step     | `number \| 'any'`                                                          | no       | The step option is a number that specifies the granularity that the value must adhere to. Only values which are equal to the basis for stepping (min if specified) are valid. This value defaults to 1, meaning by default the prompt will only allow integers. |
| required | `boolean`                                                                  | no       | Defaults to `false`. If set to true, `undefined` (empty) will not be accepted for this.                                                                                                                                                                         |
| validate | `(number \| undefined) => boolean \| string \| Promise<boolean \| string>` | no       | On submit, validate the filtered answered content. When returning a string, it'll be used as the error message displayed to the user. Note: returning a rejected promise, we'll assume a code error happened and crash.                                         |
| theme    | [See Theming](#Theming)                                                    | no       | Customize look of the prompt.                                                                                                                                                                                                                                   |

## Theming

You can theme a prompt by passing a `theme` object option. The theme object only need to includes the keys you wish to modify, we'll fallback on the defaults for the rest.

```ts
type Theme = {
  prefix: string | { idle: string; done: string };
  spinner: {
    interval: number;
    frames: string[];
  };
  style: {
    answer: (text: string) => string;
    message: (text: string, status: 'idle' | 'done' | 'loading') => string;
    error: (text: string) => string;
    defaultAnswer: (text: string) => string;
  };
};
```

# License

Copyright (c) 2023 Simon Boudrias (twitter: [@vaxilart](https://twitter.com/Vaxilart))<br/>
Licensed under the MIT license.
