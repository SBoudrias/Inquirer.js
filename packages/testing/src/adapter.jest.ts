// Jest globals come from @types/jest (see jest.config.js and the root
// tsconfig). The adapter must be imported BEFORE the prompt imports so its
// mocks intercept them, and through the package's exports map, the way
// consumers use it.
import { screen, wrapPrompt } from '@inquirer/testing/jest';
import {
  createPrompt,
  isEnterKey,
  useKeypress,
  useState,
  type Status,
} from '@inquirer/core';

import input from '@inquirer/input';
import { editor, select, Separator } from '@inquirer/prompts';
import { main } from '../fixtures/program.ts';

// A minimal custom prompt, the subject for wrapPrompt() — defined inline;
// the fixture program stays built-ins only.
const yesNoPrompt = createPrompt<'yes' | 'no', { message: string }>((config, done) => {
  const [status, setStatus] = useState<Status>('idle');
  const [value, setValue] = useState<'yes' | 'no'>('no');
  useKeypress((key, rl) => {
    if (status !== 'idle') return;
    if (isEnterKey(key)) {
      setStatus('done');
      done(value);
      return;
    }
    const line = rl.line.trim().toLowerCase();
    if (line === 'y') setValue('yes');
    else if (line === 'n') setValue('no');
  });
  return `${status === 'done' ? '✔' : '?'} ${config.message} ${value}`;
});

describe('jest adapter (public API)', () => {
  it('auto-mocks individually imported prompt packages', async () => {
    const answer = input({ message: 'Your name' });
    expect(screen.getScreen()).toContain('Your name');
    screen.type('ada');
    screen.keypress('enter');
    expect(await answer).toBe('ada');
  });

  it('auto-mocks the @inquirer/prompts barrel and passes Separator through', async () => {
    const answer = select({
      message: 'Favorite flavor',
      choices: [
        'vanilla',
        'chocolate',
        'strawberry',
        // Non-prompt exports (like Separator) pass through the barrel mock
        // unmodified — verify by rendering one.
        new Separator('---'),
      ],
    });
    expect(screen.getScreen()).toContain('Favorite flavor');
    screen.keypress('down');
    // Synchronous re-renders (arrow keys) are visible immediately;
    // screen.next() is only needed for async transitions. The cursor line
    // moved — assert it, not just the choice text (present since render 1).
    expect(screen.getScreen()).toContain('❯ chocolate');
    screen.keypress('enter');
    expect(await answer).toBe('chocolate');
  });

  it('mocks the external editor to type-and-enter', async () => {
    const answer = editor({ message: 'Notes' });
    expect(screen.getScreen()).toContain('Notes');
    screen.keypress('enter'); // launch the (mocked) editor
    screen.type('some notes');
    screen.keypress('enter'); // submit it
    await screen.next();
    expect(await answer).toBe('some notes');
  });

  it('wraps custom prompts via wrapPrompt', async () => {
    const wrapped = wrapPrompt(yesNoPrompt);
    const answer = wrapped({ message: 'Happy?' });
    expect(screen.getScreen()).toContain('Happy?');
    screen.type('y');
    screen.keypress('enter');
    expect(await answer).toBe('yes');
  });

  it('drives the full fixture CLI flow', async () => {
    const result = main();

    expect(screen.getScreen()).toContain('Your name');
    screen.type('ada');
    screen.keypress('enter');
    await screen.next();
    expect(screen.getScreen()).toContain('Favorite flavor');
    expect(screen.getScreen()).toContain('---'); // the Separator passed through

    screen.keypress('down');
    screen.keypress('enter');
    await screen.next();
    expect(screen.getScreen()).toContain('Notes');

    screen.keypress('enter'); // launch the editor
    screen.type('some notes');
    screen.keypress('enter'); // submit it
    await screen.next();
    expect(screen.getScreen()).toContain('Order again?');

    screen.keypress('enter'); // confirm's default (true)

    expect(await result).toEqual({
      name: 'ada',
      flavor: 'chocolate',
      notes: 'some notes',
      again: true,
    });
  });

  it('captures the accumulated session output', async () => {
    const result = main();
    screen.type('ada');
    screen.keypress('enter');
    await screen.next();
    screen.keypress('down');
    screen.keypress('enter');
    await screen.next();
    screen.keypress('enter'); // launch the editor
    screen.type('some notes');
    screen.keypress('enter'); // submit it
    await screen.next();
    screen.keypress('enter'); // confirm's default (true)
    await result;

    const full = await screen.getFullOutput();
    expect(full).toContain('Your name');
    expect(full).toContain('Favorite flavor');
    expect(full).toContain('Order again?');
  });
});
