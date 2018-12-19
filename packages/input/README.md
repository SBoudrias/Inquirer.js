# `@inquirer/input`

Interactive free text input component for command line interfaces. Supports validation, filtering, transformation, etc.

# Installation

```sh
npm install @inquirer/input
```

# Usage

```js
import input from '@inquirer/input/';

const answer = await input({ message: 'Enter your name' });
```

## Options

| Property    | Type                                                     | Required | Description                                                                                                                                                                                                             |
| ----------- | -------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| message     | `string`                                                 | yes      | The question to ask                                                                                                                                                                                                     |
| default     | `string`                                                 | no       | Default value if no answer is provided (clear it by pressing backspace)                                                                                                                                                 |
| transformer | `(string, { isFinal: boolean }) => string`               | no       | Transform/Format the raw value entered by the user. Once the prompt is completed, `isFinal` will be `true`. This function is purely visual; to modify the answer, use the `filter` option.                              |
| filter      | `string => string \| Promise<string>`                     | no       | Transform the answer                                                                                                                                                                                                    |
| validate    | `string => boolean \| string \| Promise<string \| boolean>` | no       | On submit, validate the filtered answered content. When returning a string, it'll be used as the error message displayed to the user. Note: returning a rejected promise, we'll assume a code error happened and crash. |

# License

Copyright (c) 2018 Simon Boudrias (twitter: [@vaxilart](https://twitter.com/Vaxilart))
Licensed under the MIT license.
