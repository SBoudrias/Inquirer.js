/**
 * Paginated list
 */

import inquirer from 'inquirer';

const alphaChoices = Array.from({ length: 26 }).map((_, y) => ({
  value: String.fromCodePoint(y + 65),
}));

const multiLineChoices = [
  { value: 'Multiline option 1\n  super cool feature \n  more lines' },
  { value: 'Multiline option 2\n  super cool feature \n  more lines' },
  { value: 'Multiline option 3\n  super cool feature \n  more lines' },
  { value: 'Multiline option 4\n  super cool feature \n  more lines' },
  { value: 'Multiline option 5\n  super cool feature \n  more lines' },
  new inquirer.Separator(),
  { value: 'Multiline option \n  super cool feature' },
  {
    name: 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium.',
    value: 'foo',
    short: 'The long option',
  },
];

const answers = await inquirer.prompt<{ letter: string; name: string[] }>([
  {
    type: 'list',
    loop: false,
    name: 'letter',
    message: "What's your favorite letter?",
    choices: [...alphaChoices, ...multiLineChoices],
  },
  {
    type: 'checkbox',
    name: 'name',
    message: 'Select the letter contained in your name:',
    choices: [...alphaChoices, ...multiLineChoices],
  },
]);

console.log(JSON.stringify(answers, null, '  '));
