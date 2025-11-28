# `@inquirer/list`

Interactive list input component for command line interfaces. Allows users to build a list by adding entries one at a time, with validation, navigation, and editing capabilities.

<!-- ![List prompt](https://cdn.rawgit.com/SBoudrias/Inquirer.js/28ae8337ba51d93e359ef4f7ee24e79b69898962/assets/screenshots/list.svg) -->

# Installation

<table>
<tr>
  <th>npm</th>
  <th>yarn</th>
</tr>
<tr>
<td>

```sh
npm install @inquirer/prompts
```

</td>
<td>

```sh
yarn add @inquirer/prompts
```

</td>
</tr>
<tr>
<td colSpan="2" align="center">Or</td>
</tr>
<tr>
<td>

```sh
npm add @inquirer/list
```

</td>
<td>

```sh
yarn add @inquirer/list
```

</td>
</tr>
</table>

# Usage

```js
import { list } from '@inquirer/prompts';
// Or
// import list from '@inquirer/list';

const tags = await list({
  message: 'Enter tags for your post',
  validate: (value) => value.length >= 2 || 'Tag must be at least 2 characters',
});
```

## Options

| Property      | Type                                                          | Required | Description                                                                                                                                                                                                            |
| ------------- | ------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| message       | `string`                                                      | yes      | The question to ask                                                                                                                                                                                                    |
| default       | `string[]`                                                    | no       | Default list of values if provided                                                                                                                                                                                     |
| min           | `number`                                                      | no       | Minimum number of entries required. Defaults to `0`.                                                                                                                                                                   |
| max           | `number`                                                      | no       | Maximum number of entries allowed. Defaults to `Infinity`.                                                                                                                                                             |
| unique        | `true`                                                        | no       | If set to `true`, duplicate entries will not be allowed.                                                                                                                                                               |
| uniqueError   | `string`                                                      | no       | Custom error message when a duplicate entry is detected. Defaults to `'This entry is already in the list'`.                                                                                                            |
| validateEntry | `string => boolean \| string \| Promise<boolean \| string>`   | no       | Validate each entry before adding it to the list. When returning a string, it'll be used as the error message displayed to the user. Note: returning a rejected promise, we'll assume a code error happened and crash. |
| validateList  | `string[] => boolean \| string \| Promise<boolean \| string>` | no       | Validate the entire list. Called after each entry is added and on final submission. When returning a string, it'll be used as the error message.                                                                       |
| pattern       | `RegExp`                                                      | no       | Regular expression to validate each entry against. If an entry doesn't match the pattern, validation will fail with the error message specified in `patternError`.                                                     |
| patternError  | `string`                                                      | no       | Error message to display when an entry doesn't match the `pattern`. Defaults to `'Invalid input'`.                                                                                                                     |
| transformer   | `(string, { isFinal: boolean }) => string`                    | no       | Transform/Format the raw value entered by the user. Once the prompt is completed, `isFinal` will be `true`. This function is purely visual, modify the answer in your code if needed.                                  |
| theme         | [See Theming](#Theming)                                       | no       | Customize look of the prompt.                                                                                                                                                                                          |

## Keyboard Controls

The list prompt operates in two modes:

### Edit Mode (default)

- **Type**: Enter text for a new list entry
- **Enter**: Add the current entry to the list (after validation)
- **Tab**: Switch to navigation mode (if list is not empty)
- **Ctrl+S**: Submit the final list

### Navigation Mode

- **↑/↓**: Navigate through existing entries
- **Backspace/Delete**: Remove the selected entry
- **Tab**: Return to edit mode
- **Ctrl+S**: Submit the final list

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
    highlight: (text: string) => string;
    keysHelpTip: (keys: [key: string, action: string][]) => string | undefined;
  };
  icon: {
    cursor: string;
  };
  validationFailureMode: 'keep' | 'clear';
};
```

`validationFailureMode` defines the behavior of the prompt when an entry submitted is invalid. By default, we'll keep the value allowing the user to edit it. When the theme option is set to `clear`, we'll remove and reset to an empty string.

### `theme.style.keysHelpTip`

This function allows you to customize the keyboard shortcuts help tip displayed below the prompt. It receives an array of key-action pairs and should return a formatted string. You can also hook here to localize the labels to different languages.

It can also returns `undefined` to hide the help tip entirely.

```js
theme: {
  style: {
    keysHelpTip: (keys) => {
      // Return undefined to hide the help tip completely.
      return undefined;

      // Or customize the formatting. Or localize the labels.
      return keys.map(([key, action]) => `${key}: ${action}`).join(' | ');
    };
  }
}
```

## Examples

### Basic list with validation

```js
const technologies = await list({
  message: 'Enter technologies you use',
  validateEntry: (value) => {
    if (value.length < 2) return 'Technology name must be at least 2 characters';
    return true;
  },
  min: 1,
  max: 5,
});
```

### Unique entries with custom error

```js
const emails = await list({
  message: 'Enter team member emails',
  unique: true,
  uniqueError: 'This email is already in the team',
  pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  patternError: 'Please enter a valid email address',
});
```

### List validation with complex rules

```js
const numbers = await list({
  message: 'Enter numbers',
  validateEntry: (value) => /^\d+$/.test(value) || 'Must be a number',
  validateList: (values) => {
    const sum = values.reduce((acc, v) => acc + Number(v), 0);
    return sum <= 100 || 'Sum of all numbers must not exceed 100';
  },
});
```

### With transformer

```js
const items = await list({
  message: 'Enter items',
  transformer: (value, { isFinal }) => {
    return isFinal ? value.toUpperCase() : `[${value}]`;
  },
});
```

# License

Copyright (c) 2025 Simon Boudrias (twitter: [@vaxilart](https://twitter.com/Vaxilart))<br/>
Licensed under the MIT license.
