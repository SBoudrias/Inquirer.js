# `@inquirer/rawlist`

Simple interactive command line prompt to display a raw list of choices (single value select) with minimal interaction.

![rawlist prompt](https://cdn.rawgit.com/SBoudrias/Inquirer.js/28ae8337ba51d93e359ef4f7ee24e79b69898962/assets/screenshots/rawlist.svg)

# Installation

<table>
<tr>
  <th>npm</th>
  <th>yarn</th>
</tr>
<tr>
<td>

```sh
npm install @inquirer/rawlist
```

</td>
<td>

```sh
yarn add @inquirer/rawlist
```

</td>
</tr>
</table>

# Usage

```js
import rawlist from '@inquirer/rawlist';

const answer = await rawlist({
  message: 'Select a package manager',
  choices: [
    { name: 'npm', value: 'npm' },
    { name: 'yarn', value: 'yarn' },
    { name: 'pnpm', value: 'pnpm' },
  ],
});
```

## Options

| Property | Type                                                    | Required | Description                                                                                                                                                                                                              |
| -------- | ------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| message  | `string`                                                | yes      | The question to ask                                                                                                                                                                                                      |
| choices  | `Array<{ value: string, name?: string, key?: string }>` | yes      | List of the available choices. The `value` will be returned as the answer, and used as display if no `name` is defined. By default, choices will be selected by index. This can be customized by using the `key` option. |
| theme    | [See Theming](#Theming)                                 | no       | Customize look of the prompt.                                                                                                                                                                                            |

## Theming

You can theme a prompt by passing a `theme` object option. The theme object only need to includes the keys you wish to modify, we'll fallback on the defaults for the rest.

```ts
type Theme = {
  prefix: string;
  spinner: {
    interval: number;
    frames: string[];
  };
  style: {
    answer: (text: string) => string;
    message: (text: string) => string;
    error: (text: string) => string;
    highlight: (text: string) => string;
  };
};
```

# License

Copyright (c) 2023 Simon Boudrias (twitter: [@vaxilart](https://twitter.com/Vaxilart))<br/>
Licensed under the MIT license.
