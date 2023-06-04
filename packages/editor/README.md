# `@inquirer/editor`

Prompt that'll open the user preferred editor with default content and allow for a convenient multi-line input controlled through the command line.

# Installation

```sh
npm install @inquirer/editor

yarn add @inquirer/editor
```

# Usage

```js
import editor from '@inquirer/editor';

const answer = await editor({
  message: 'Enter a description',
});
```

## Options

| Property        | Type                                                        | Required               | Description                                                                                                                                                                                                                            |
| --------------- | ----------------------------------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| message         | `string`                                                    | yes                    | The question to ask                                                                                                                                                                                                                    |
| default         | `string`                                                    | no                     | Default value which will automatically be present in the editor                                                                                                                                                                        |
| validate        | `string => boolean \| string \| Promise<string \| boolean>` | no                     | On submit, validate the content. When returning a string, it'll be used as the error message displayed to the user. Note: returning a rejected promise, we'll assume a code error happened and crash.                                  |
| postfix         | `string`                                                    | no (default to `.txt`) | The postfix of the file being edited. Adding this will add color highlighting to the file content in most editors.                                                                                                                     |
| waitForUseInput | `boolean`                                                   | no (default to `true`) | Open the editor automatically without waiting for the user to press enter. Note that this mean the user will not see the question! So make sure you have a default value that provide guidance if it's unclear what input is expected. |

# License

Copyright (c) 2023 Simon Boudrias (twitter: [@vaxilart](https://twitter.com/Vaxilart))<br/>
Licensed under the MIT license.
