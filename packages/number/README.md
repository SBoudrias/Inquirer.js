# `@inquirer/number`

Interactive free number input component for command line interfaces. Supports validation, filtering, transformation, etc.

# Installation

```sh
npm install @inquirer/number

yarn add @inquirer/number
```

# Usage

```js
import number from '@inquirer/number';

const answer = await number({ message: 'Enter your age' });
```

## Options

| Property | Type                                                                     | Required | Description                                                                                                                                                                                                             |
| -------- | ------------------------------------------------------------------------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| message  | `string`                                                                 | yes      | The question to ask                                                                                                                                                                                                     |
| default  | `number`                                                                 | no       | Default value if no answer is provided (clear it by pressing backspace)                                                                                                                                                 |
| validate | `(number\|undefined) => boolean \| string \| Promise<string \| boolean>` | no       | On submit, validate the filtered answered content. When returning a string, it'll be used as the error message displayed to the user. Note: returning a rejected promise, we'll assume a code error happened and crash. |
| theme    | [See Theming](#Theming)                                                  | no       | Customize look of the prompt.                                                                                                                                                                                           |

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
    defaultAnswer: (text: string) => string;
  };
};
```

# License

Copyright (c) 2023 Simon Boudrias (twitter: [@vaxilart](https://twitter.com/Vaxilart))<br/>
Licensed under the MIT license.
