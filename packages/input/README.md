# `@inquirer/input`

Interactive free text input component for command line interfaces. Supports validation, filtering, transformation, etc.

![Input prompt](https://cdn.rawgit.com/SBoudrias/Inquirer.js/28ae8337ba51d93e359ef4f7ee24e79b69898962/assets/screenshots/input.svg)

# Installation

```sh
npm install @inquirer/input

yarn add @inquirer/input
```

# Usage

```js
import input from '@inquirer/input';

const answer = await input({ message: 'Enter your name' });
```

## Options

| Property    | Type                                                        | Required | Description                                                                                                                                                                                                             |
| ----------- | ----------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| message     | `string`                                                    | yes      | The question to ask                                                                                                                                                                                                     |
| default     | `string`                                                    | no       | Default value if no answer is provided (clear it by pressing backspace)                                                                                                                                                 |
| transformer | `(string, { isFinal: boolean }) => string`                  | no       | Transform/Format the raw value entered by the user. Once the prompt is completed, `isFinal` will be `true`. This function is purely visual, modify the answer in your code if needed.                                   |
| validate    | `string => boolean \| string \| Promise<string \| boolean>` | no       | On submit, validate the filtered answered content. When returning a string, it'll be used as the error message displayed to the user. Note: returning a rejected promise, we'll assume a code error happened and crash. |

# License

Copyright (c) 2023 Simon Boudrias (twitter: [@vaxilart](https://twitter.com/Vaxilart))<br/>
Licensed under the MIT license.
