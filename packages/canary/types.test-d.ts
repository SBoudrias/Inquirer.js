import inquirer from './src/index.js';

describe('Library types work properly', () => {
  it('input', () => {
    expect(() => {
      return inquirer.prompt([
        {
          type: 'input',
          name: 'first_name',
          message: "What's your first name",
        },
        {
          type: 'input',
          name: 'first_name',
          message: "What's your first name",
          default: 'John',
        },
        {
          type: 'input',
          name: 'first_name',
          message: "What's your first name",
          /* @ts-expect-error: type shouldn't allow this format */
          default: 6,
        },
        {
          type: 'input',
          name: 'foo',
          message: 'foo',
          filter(answer: string) {
            return 'other string';
          },
          transformer(answer: string, { isFinal }: { isFinal: boolean }) {
            return 'other string';
          },
          validate(answer: string) {
            return 'oh no';
          },
          when() {
            return true;
          },
        },
        {
          type: 'input',
          name: 'foo',
          message: 'foo',
          /* @ts-expect-error: type shouldn't allow this format */
          filter(answer: number) {
            return 3;
          },
          /* @ts-expect-error: type shouldn't allow this format */
          transformer(answer: string) {
            return 45;
          },
          /* @ts-expect-error: type shouldn't allow this format */
          validate(answer: string) {
            return 1;
          },
        },
      ]);
    }).toBeInstanceOf(Function);
  });

  it('select', () => {
    expect(() => {
      return inquirer.prompt([
        {
          type: 'select',
          name: 'ask_last_name',
          message: 'Are you willing to share your last name',
          choices: [
            { value: '1', name: 'Yes' },
            { value: '', name: 'No' },
          ],
        },
        /* @ts-expect-error: choices option is required */
        {
          type: 'select',
          name: 'ask_last_name',
          message: 'Are you willing to share your last name',
        },
      ]);
    }).toBeInstanceOf(Function);
  });
});
