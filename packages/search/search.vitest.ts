import { afterEach, describe, it, expect, expectTypeOf, vi } from 'vitest';
import { render } from '@inquirer/testing';
import { withResolver } from '@inquirer/type';
import search, { Separator } from './src/index.ts';

afterEach(() => {
  vi.unstubAllEnvs();
});

// Array of all countries names as string
const PROVINCES = [
  { name: 'Alberta', value: 'AB' },
  { name: 'British Columbia', value: 'BC' },
  { name: 'Manitoba', value: 'MB' },
  { name: 'New Brunswick', value: 'NB' },
  { name: 'Newfoundland and Labrador', value: 'NL' },
  { name: 'Nova Scotia', value: 'NS' },
  { name: 'Ontario', value: 'ON' },
  { name: 'Prince Edward Island', value: 'PE' },
  { name: 'Quebec', value: 'QC' },
  { name: 'Saskatchewan', value: 'SK' },
  { name: 'Northwest Territories', value: 'NT' },
  { name: 'Nunavut', value: 'NU' },
  { name: 'Yukon', value: 'YT' },
];

function getListSearch(
  choices: ReadonlyArray<
    Separator | { value: string; name?: string; disabled?: boolean | string }
  >,
) {
  return (term: string = '') => {
    if (!term) return choices;

    return choices.filter((choice) => {
      return (
        Separator.isSeparator(choice) ||
        (choice.name ?? choice.value)
          .toLocaleLowerCase()
          .includes(term.toLocaleLowerCase())
      );
    });
  };
}

describe('search prompt', () => {
  it.each(['up', 'down'] as const)(
    'preserves the query when typing after %s navigation',
    async (key) => {
      const source = vi.fn(getListSearch(PROVINCES));
      const { answer, events, nextRender } = await render(search, {
        message: 'Select a Canadian province',
        source,
      });

      events.type('New');
      await nextRender();
      events.keypress(key);
      events.type('f');
      await nextRender();
      expect(source).toHaveBeenLastCalledWith('Newf', expect.anything());
      events.keypress('enter');
      await expect(answer).resolves.toEqual('NL');
    },
  );

  it('does not submit stale choices and keeps the search term while a search is pending', async () => {
    const { promise: resultsPromise, resolve: resolveResults } =
      withResolver<Array<string>>();
    const terms: Array<string | undefined> = [];
    const { answer, events, nextRender } = await render(search, {
      message: 'Select a Canadian province',
      source: (term: string | undefined) => {
        terms.push(term);
        return term ? resultsPromise : ['Alberta'];
      },
    });

    // A first enter while the search for "Que" is still pending must not
    // submit any stale choice.
    events.type('Que');
    await nextRender();
    events.keypress('enter');

    // The search term must survive the enter keypress.
    events.type('bec');
    await nextRender();

    resolveResults(['Quebec']);
    await nextRender();
    events.keypress('enter');
    await expect(answer).resolves.toEqual('Quebec');
    expect(terms.at(-1)).toBe('Quebec');
  });

  // Surface the prompt status in the message text: the default theme only
  // distinguishes `loading` through the spinner prefix (delayed 300ms), while
  // these tests assert the status painted at the moment a keystroke-triggered
  // search starts.
  const statusMessage = (text: string, status: string) => `«${status}» ${text}`;

  it('paints the loading status while a search triggered by typing is pending', async () => {
    const abortController = new AbortController();
    const { promise: pendingResults } = withResolver<Array<string>>();
    const { answer, events, getScreen, nextRender } = await render(
      search,
      {
        message: 'Select a Canadian province',
        source: (term: string | undefined) => (term ? pendingResults : ['Alberta']),
        theme: { style: { message: statusMessage } },
      },
      { signal: abortController.signal },
    );

    // The fetch triggered by the keystroke is pending: the `loading` status
    // set by the search effect must be on screen without waiting for the
    // fetch to settle.
    events.type('N');
    await nextRender();
    expect(getScreen()).toContain('«loading» Select a Canadian province N');

    abortController.abort();
    await expect(answer).rejects.toThrow();
  });

  it('clears a previous search error as soon as the retry starts', async () => {
    const abortController = new AbortController();
    const { promise: retryResults, resolve: resolveRetry } =
      withResolver<Array<string>>();
    const { answer, events, getScreen, nextRender } = await render(
      search,
      {
        message: 'Select a Canadian province',
        source: (term: string | undefined) => {
          if (!term) return ['Alberta'];
          if (term === 'N') throw new Error("You're being rate limited");
          return retryResults;
        },
        theme: { style: { message: statusMessage } },
      },
      { signal: abortController.signal },
    );

    // The first search fails: its error reaches the screen.
    events.type('N');
    await nextRender();
    expect(getScreen()).toContain("You're being rate limited");

    // Typing again starts a new search: the error must leave the screen as
    // soon as the retry is pending, together with the loading status.
    events.type('e');
    await nextRender();
    expect(getScreen()).toContain('«loading» Select a Canadian province Ne');
    expect(getScreen()).not.toContain("You're being rate limited");

    resolveRetry(['New Brunswick']);
    await nextRender();
    events.keypress('enter');
    await expect(answer).resolves.toEqual('New Brunswick');
  });

  it('does not start another validation while one is pending', async () => {
    const { promise: validation, resolve: resolveValidation } = withResolver<boolean>();
    const validate = vi.fn(() => validation);
    const { answer, events } = await render(search, {
      message: 'Select a Canadian province',
      source: () => ['Quebec'],
      validate,
    });

    events.keypress('enter');
    events.keypress('enter');
    resolveValidation(true);

    await expect(answer).resolves.toEqual('Quebec');
    expect(validate).toHaveBeenCalledOnce();
  });

  it('ignores query edits while validating the selected choice', async () => {
    const { promise: validation, resolve: resolveValidation } = withResolver<boolean>();
    const source = vi.fn(getListSearch(PROVINCES));
    const { answer, events, getScreen } = await render(search, {
      message: 'Select a Canadian province',
      source,
      validate: () => validation,
    });

    events.keypress('enter');
    events.type('Que');
    resolveValidation(true);

    await expect(answer).resolves.toEqual('AB');
    expect(source).toHaveBeenCalledOnce();
    expect(getScreen()).toContain('Alberta');
  });

  it('restores the completed query after validation fails despite ignored typing', async () => {
    const controller = new AbortController();
    const { promise: validation, resolve: resolveValidation } = withResolver<boolean>();
    const source = vi.fn(getListSearch(PROVINCES));
    const { answer, events, nextRender } = await render(
      search,
      {
        message: 'Select a Canadian province',
        initialValue: 'Al',
        source,
        validate: () => validation,
      },
      { signal: controller.signal },
    );

    events.keypress('enter');
    events.type('ignored');
    resolveValidation(false);
    await nextRender();
    events.type('x');

    expect(source).toHaveBeenLastCalledWith('Albertax', expect.anything());
    controller.abort();
    await expect(answer).rejects.toThrow();
  });

  it('allows to search', async () => {
    const { answer, events, getScreen, nextRender } = await render(search, {
      message: 'Select a Canadian province',
      source: getListSearch(PROVINCES),
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province
      ❯ Alberta
        British Columbia
        Manitoba
        New Brunswick
        Newfoundland and Labrador
        Nova Scotia
        Ontario

      ↑↓ navigate • ⏎ select"
    `);

    events.type('New');
    await nextRender();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province New
      ❯ New Brunswick
        Newfoundland and Labrador

      ↑↓ navigate • ⏎ select"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual('NB');
    expect(getScreen()).toMatchInlineSnapshot(
      `"✔ Select a Canadian province New Brunswick"`,
    );
  });

  it('starts searching with an initial value', async () => {
    const terms: Array<string | undefined> = [];
    const { answer, events, getScreen, nextRender } = await render(search, {
      message: 'Select a Canadian province',
      source: (term: string | undefined) => {
        terms.push(term);
        return getListSearch(PROVINCES)(term);
      },
      initialValue: 'New',
    });

    expect(terms[0]).toBe('New');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province New
      ❯ New Brunswick
        Newfoundland and Labrador

      ↑↓ navigate • ⏎ select"
    `);

    events.type('foundland');
    await nextRender();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province Newfoundland
      ❯ Newfoundland and Labrador

      ↑↓ navigate • ⏎ select"
    `);

    events.keypress({ name: 'backspace', ctrl: true });
    await nextRender();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province
      ❯ Alberta
        British Columbia
        Manitoba
        New Brunswick
        Newfoundland and Labrador
        Nova Scotia
        Ontario

      ↑↓ navigate • ⏎ select"
    `);

    events.type('Quebec');
    await nextRender();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province Quebec
      ❯ Quebec

      ↑↓ navigate • ⏎ select"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual('QC');
  });

  it('works with string results', async () => {
    const choices = [
      'Stark',
      'Lannister',
      'Targaryen',
      'Baratheon',
      'Greyjoy',
      'Martell',
      'Tyrell',
      'Arryn',
      'Tully',
    ];

    const { answer, events, getScreen, nextRender } = await render(search, {
      message: 'Select a family',
      source: (term: string = '') => {
        return choices.filter((choice) => choice.includes(term));
      },
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a family
      ❯ Stark
        Lannister
        Targaryen
        Baratheon
        Greyjoy
        Martell
        Tyrell

      ↑↓ navigate • ⏎ select"
    `);

    events.keypress('down');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a family
        Stark
      ❯ Lannister
        Targaryen
        Baratheon
        Greyjoy
        Martell
        Tyrell

      ↑↓ navigate • ⏎ select"
    `);

    events.type('Targ');
    await nextRender();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a family Targ
      ❯ Targaryen

      ↑↓ navigate • ⏎ select"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual('Targaryen');
  });

  it('allows to search and navigate the list', async () => {
    const { answer, events, getScreen, nextRender } = await render(search, {
      message: 'Select a Canadian province',
      source: getListSearch(PROVINCES),
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province
      ❯ Alberta
        British Columbia
        Manitoba
        New Brunswick
        Newfoundland and Labrador
        Nova Scotia
        Ontario

      ↑↓ navigate • ⏎ select"
    `);

    events.type('N');
    await nextRender();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province N
      ❯ Manitoba
        New Brunswick
        Newfoundland and Labrador
        Nova Scotia
        Ontario
        Prince Edward Island
        Saskatchewan

      ↑↓ navigate • ⏎ select"
    `);

    events.keypress('down');
    events.keypress('down');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province N
        Manitoba
        New Brunswick
      ❯ Newfoundland and Labrador
        Nova Scotia
        Ontario
        Prince Edward Island
        Saskatchewan

      ↑↓ navigate • ⏎ select"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual('NL');
    expect(getScreen()).toMatchInlineSnapshot(
      `"✔ Select a Canadian province Newfoundland and Labrador"`,
    );
  });

  it('controls bounds of the list when navigating', async () => {
    const { answer, events, getScreen, nextRender } = await render(search, {
      message: 'Select a Canadian province',
      source: getListSearch(PROVINCES),
    });

    events.type('New');
    await nextRender();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province New
      ❯ New Brunswick
        Newfoundland and Labrador

      ↑↓ navigate • ⏎ select"
    `);

    events.keypress('up');
    events.keypress('up');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province New
      ❯ New Brunswick
        Newfoundland and Labrador

      ↑↓ navigate • ⏎ select"
    `);
    events.keypress('down');
    events.keypress('down');
    events.keypress('down');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province New
        New Brunswick
      ❯ Newfoundland and Labrador

      ↑↓ navigate • ⏎ select"
    `);

    events.keypress('up');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province New
      ❯ New Brunswick
        Newfoundland and Labrador

      ↑↓ navigate • ⏎ select"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual('NB');
    expect(getScreen()).toMatchInlineSnapshot(
      `"✔ Select a Canadian province New Brunswick"`,
    );
  });

  it('handles search errors', async () => {
    const abortController = new AbortController();
    let failWith: string | Error = new Error("You're being rate limited");
    const { answer, events, getScreen, nextRender } = await render(
      search,
      {
        message: 'Select a Canadian province',
        source: (term: string | void) => {
          if (!term) return Promise.resolve([]);

          // A non-Error rejection is the fallback's input; that is the case tested here.
          /* eslint-disable-next-line prefer-promise-reject-errors */
          /* oxlint-disable-next-line typescript/prefer-promise-reject-errors */
          return Promise.reject(failWith);
        },
      },
      { signal: abortController.signal },
    );

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province

      ↑↓ navigate • ⏎ select"
    `);

    events.type('New');
    await nextRender();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province New
      > You're being rate limited

      ↑↓ navigate • ⏎ select"
    `);

    // A rejection that carries no usable message (a non-Error, or an empty
    // Error) shows the generic fallback instead of nothing at all.
    failWith = 'not an Error';
    events.type('!');
    await nextRender();
    expect(getScreen()).toContain('Search failed');

    abortController.abort();
    await expect(answer).rejects.toThrow();
  });

  it('stops loading after a source failure and lets the user search again', async () => {
    const { promise: failedSearch, reject } = withResolver<string[]>();
    const controller = new AbortController();
    const validate = vi.fn(() => true);
    const source = vi.fn((term: string | undefined) => {
      if (term === 'Q') return failedSearch;
      return term ? ['Quebec'] : ['Alberta', 'Manitoba'];
    });
    const { answer, events, getScreen, nextRender } = await render(
      search<string>,
      {
        message: 'Select a Canadian province',
        source,
        validate,
        theme: {
          style: { message: (text: string, status: string) => `${status} ${text}` },
        },
      },
      { signal: controller.signal },
    );

    try {
      expect(getScreen()).toContain('❯ Alberta');
      events.keypress('down');
      await nextRender();
      expect(getScreen()).toContain('❯ Manitoba');
      events.type('Q');
      expect(source).toHaveBeenLastCalledWith('Q', expect.anything());

      reject(new Error('Search request failed'));
      await nextRender();
      expect(getScreen()).toContain('Search request failed');
      expect(getScreen()).toContain('idle Select a Canadian province Q');

      events.keypress('up');
      events.keypress('enter');
      expect(validate).not.toHaveBeenCalled();

      events.type('ue');
      await vi.waitFor(() => {
        expect(getScreen()).toContain('idle Select a Canadian province Que');
        expect(getScreen()).toContain('❯ Quebec');
      });
      events.keypress('enter');
      await expect(answer).resolves.toBe('Quebec');
    } finally {
      controller.abort();
      await answer.catch(() => {});
    }
  });

  it('handles empty results', async () => {
    const abortController = new AbortController();
    const { answer, events, getScreen, nextRender } = await render(
      search,
      {
        message: 'Select a Canadian province',
        source: () => [],
      },
      { signal: abortController.signal },
    );

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province

      ↑↓ navigate • ⏎ select"
    `);

    events.type('N');
    await nextRender();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province N
      > No results found

      ↑↓ navigate • ⏎ select"
    `);

    events.keypress('backspace');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province

      ↑↓ navigate • ⏎ select"
    `);

    abortController.abort();
    await expect(answer).rejects.toThrow();
  });

  it('handles separators & disabled choices', async () => {
    const choices = [
      new Separator('~ Americas ~'),
      { value: 'Canada' },
      { value: 'United States' },
      { value: 'Mexico' },
      new Separator('~ Europe ~'),
      { value: 'France', disabled: 'Cannot be selected during the Olympics' },
      { value: 'Germany', disabled: true },
      { value: 'Spain' },
    ];

    const { answer, events, getScreen, nextRender } = await render(search, {
      message: 'Select a country',
      source: getListSearch(choices),
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a country
       ~ Americas ~
      ❯ Canada
        United States
        Mexico
       ~ Europe ~
      - France Cannot be selected during the Olympics
      - Germany (disabled)

      ↑↓ navigate • ⏎ select"
    `);

    events.type('France');
    await nextRender();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a country France
       ~ Americas ~
       ~ Europe ~
      - France Cannot be selected during the Olympics

      ↑↓ navigate • ⏎ select"
    `);

    // This event will be ignored;
    events.keypress('enter');

    Array.from({ length: 'France'.length }).forEach(() => events.keypress('backspace'));
    await nextRender();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a country
       ~ Americas ~
      ❯ Canada
        United States
        Mexico
       ~ Europe ~
      - France Cannot be selected during the Olympics
      - Germany (disabled)

      ↑↓ navigate • ⏎ select"
    `);

    events.type('United');
    await nextRender();
    events.keypress('enter');

    await expect(answer).resolves.toEqual('United States');
    expect(getScreen()).toMatchInlineSnapshot(`"✔ Select a country United States"`);
  });

  it('handles choices with descriptions', async () => {
    const choices = [
      { value: 'Stark', description: 'Winter is coming' },
      { value: 'Lannister', description: 'Hear me roar' },
      { value: 'Targaryen', description: 'Fire and blood' },
    ];

    const { answer, events, getScreen, nextRender } = await render(search, {
      message: 'Select a family',
      source: getListSearch(choices),
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a family
      ❯ Stark
        Lannister
        Targaryen

      Winter is coming
      ↑↓ navigate • ⏎ select"
    `);

    events.keypress('down');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a family
        Stark
      ❯ Lannister
        Targaryen

      Hear me roar
      ↑↓ navigate • ⏎ select"
    `);

    events.type('Targ');
    await nextRender();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a family Targ
      ❯ Targaryen

      Fire and blood
      ↑↓ navigate • ⏎ select"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual('Targaryen');
  });

  it('allows default parameters to be used as source function parameters', async () => {
    const abortController = new AbortController();
    const { answer } = await render(
      search,
      {
        message: 'Select a family',
        source: (term: string = '') => {
          expectTypeOf(term).toEqualTypeOf<string>();
          return [];
        },
      },
      { signal: abortController.signal },
    );

    abortController.abort();
    await expect(answer).rejects.toThrow();
  });

  it('Autocomplete with tab', async () => {
    const { answer, events, getScreen, nextRender } = await render(search, {
      message: 'Select a Canadian province',
      source: getListSearch(PROVINCES),
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province
      ❯ Alberta
        British Columbia
        Manitoba
        New Brunswick
        Newfoundland and Labrador
        Nova Scotia
        Ontario

      ↑↓ navigate • ⏎ select"
    `);

    events.type('New');

    await nextRender();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province New
      ❯ New Brunswick
        Newfoundland and Labrador

      ↑↓ navigate • ⏎ select"
    `);

    events.keypress('tab');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province New Brunswick
      ❯ New Brunswick
        Newfoundland and Labrador

      ↑↓ navigate • ⏎ select"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual('NB');
  });

  it('Autocomplete when pressing enter fail validation', async () => {
    const FOLDERS = ['src', 'dist'];
    const FILES = ['src/index.mts', 'dist/index.js'];

    const { answer, events, getScreen, nextRender } = await render(search, {
      message: 'Select a file',
      source: (term?: string) => {
        if (term && FOLDERS.includes(term)) {
          return FILES.filter((file) => file.includes(term)).map((file) => ({
            name: file,
            value: file,
          }));
        }

        return FOLDERS.filter((folder) => !term || folder.includes(term)).map((file) => ({
          name: file,
          value: file,
        }));
      },
      validate: (value: string) => {
        return FILES.includes(value) ? true : 'Invalid file';
      },
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a file
      ❯ src
        dist

      ↑↓ navigate • ⏎ select"
    `);

    events.type('di');
    await nextRender();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a file di
      ❯ dist

      ↑↓ navigate • ⏎ select"
    `);

    events.keypress('enter');
    await nextRender();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a file dist
      ❯ dist/index.js

      ↑↓ navigate • ⏎ select"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual('dist/index.js');
  });

  it('handles validation errors', async () => {
    const { answer, events, getScreen, nextRender } = await render(search, {
      message: 'Select a Canadian province',
      source: getListSearch(PROVINCES),
      validate: (value: string) => {
        if (value === 'NB') return 'New Brunswick is unavailable at the moment.';
        if (value === 'AB') return false; // Test default error
        return true;
      },
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province
      ❯ Alberta
        British Columbia
        Manitoba
        New Brunswick
        Newfoundland and Labrador
        Nova Scotia
        Ontario

      ↑↓ navigate • ⏎ select"
    `);

    events.keypress('enter');
    await nextRender();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province Alberta
      ❯ Alberta

      ↑↓ navigate • ⏎ select"
    `);

    events.keypress('enter');
    await nextRender();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province Alberta
      > You must provide a valid value

      ↑↓ navigate • ⏎ select"
    `);

    events.keypress({ name: 'backspace', ctrl: true });
    events.type('New Brun');
    await nextRender();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province New Brun
      ❯ New Brunswick

      ↑↓ navigate • ⏎ select"
    `);

    events.keypress('enter');
    await nextRender();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province New Brunswick
      ❯ New Brunswick

      ↑↓ navigate • ⏎ select"
    `);

    events.keypress('enter');
    await nextRender();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province New Brunswick
      > New Brunswick is unavailable at the moment.

      ↑↓ navigate • ⏎ select"
    `);

    // The rejected name is now restored to the readline line: one word
    // delete leaves "New " behind, so delete the rest before typing the
    // next query.
    events.keypress({ name: 'backspace', ctrl: true });
    events.keypress({ name: 'backspace', ctrl: true });
    events.type('Quebec');
    await nextRender();
    events.keypress('enter');
    await expect(answer).resolves.toEqual('QC');
  });

  it('Allows setting a default value', async () => {
    const { answer, events, getScreen } = await render(search, {
      message: 'Select a Canadian province',
      source: getListSearch(PROVINCES),
      default: 'ON',
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province
        New Brunswick
        Newfoundland and Labrador
        Nova Scotia
      ❯ Ontario
        Prince Edward Island
        Quebec
        Saskatchewan

      ↑↓ navigate • ⏎ select"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual('ON');
  });

  it('Falls back to first item when default value is not found', async () => {
    const { answer, events, getScreen } = await render(search, {
      message: 'Select a Canadian province',
      source: getListSearch(PROVINCES),
      default: 'INVALID',
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province
      ❯ Alberta
        British Columbia
        Manitoba
        New Brunswick
        Newfoundland and Labrador
        Nova Scotia
        Ontario

      ↑↓ navigate • ⏎ select"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual('AB');
  });

  it('Does not reapply default after searching', async () => {
    const { answer, events, getScreen, nextRender } = await render(search, {
      message: 'Select a Canadian province',
      source: getListSearch(PROVINCES),
      default: 'ON',
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province
        New Brunswick
        Newfoundland and Labrador
        Nova Scotia
      ❯ Ontario
        Prince Edward Island
        Quebec
        Saskatchewan

      ↑↓ navigate • ⏎ select"
    `);

    events.type('New');
    await nextRender();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province New
      ❯ New Brunswick
        Newfoundland and Labrador

      ↑↓ navigate • ⏎ select"
    `);

    events.keypress({ name: 'backspace', ctrl: true });
    await nextRender();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province
      ❯ Alberta
        British Columbia
        Manitoba
        New Brunswick
        Newfoundland and Labrador
        Nova Scotia
        Ontario

      ↑↓ navigate • ⏎ select"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual('AB');
  });

  // The displayed query and readline's line must stay in sync: after any
  // handler rewrites the shown value, the next keystroke edits what is shown
  // — typing appends, Backspace removes one character.
  describe('the shown query stays editable after the prompt rewrites it', () => {
    type Step =
      | 'enter'
      | 'tab'
      | 'up'
      | 'down'
      | 'backspace'
      | 'ctrl+backspace'
      | { type: string };

    const cases: Array<{
      after: string;
      steps: Step[];
      shown: string;
      probe: string;
      typed: string;
      edited: string;
      settle: Step[];
      answer: string;
      validate?: (value: string) => boolean | string;
    }> = [
      {
        // The selected name is also the exact query: validate rejects it and
        // the term must stay editable on the line.
        after: 'a rejected exact-name match',
        steps: [{ type: 'Alberta' }, 'enter'],
        shown: 'Alberta',
        probe: 'x',
        typed: 'Albertax',
        edited: 'Alberta',
        settle: ['ctrl+backspace', { type: 'Yukon' }, 'enter'],
        answer: 'YT',
        validate: (value: string) => value !== 'AB',
      },
      {
        after: 'tab autocompletion',
        steps: [{ type: 'New' }, 'tab'],
        shown: 'New Brunswick',
        probe: 's',
        typed: 'New Brunswicks',
        edited: 'New Brunswick',
        settle: ['ctrl+backspace', 'ctrl+backspace', { type: 'Yukon' }, 'enter'],
        answer: 'YT',
      },
      {
        after: 'arrow navigation',
        steps: [{ type: 'New' }, 'down'],
        shown: 'New',
        probe: 'f',
        typed: 'Newf',
        edited: 'New',
        settle: [{ type: 'foundland' }, 'enter'],
        answer: 'NL',
      },
    ];

    it.each(cases)('after $after', async (row) => {
      const { answer, events, getScreen, nextRender } = await render(search, {
        message: 'Select a Canadian province',
        source: getListSearch(PROVINCES),
        ...(row.validate === undefined ? {} : { validate: row.validate }),
      });

      // The source runs asynchronously, so every keystroke needs a render to
      // settle before the next one (and finally Enter) reads the results.
      const send = async (steps: Step[]) => {
        for (const step of steps) {
          if (step === 'ctrl+backspace') {
            events.keypress({ name: 'backspace', ctrl: true });
          } else if (typeof step === 'string') {
            events.keypress(step);
          } else {
            events.type(step.type);
          }
          await nextRender();
        }
      };
      const promptLine = () => (getScreen().split('\n')[0] ?? '').trimEnd();

      await send(row.steps);
      expect(promptLine()).toBe(`? Select a Canadian province ${row.shown}`);

      // Typing appends to the shown query...
      await send([{ type: row.probe }]);
      expect(promptLine()).toBe(`? Select a Canadian province ${row.typed}`);

      // ...and Backspace removes exactly one character.
      await send(['backspace']);
      expect(promptLine()).toBe(`? Select a Canadian province ${row.edited}`);

      await send(row.settle);
      await expect(answer).resolves.toEqual(row.answer);
    });
  });

  describe('keybindings', () => {
    it('keeps default behavior untouched when vim keybindings are not enabled', async () => {
      const { answer, events, getScreen, nextRender } = await render(search, {
        message: 'Select a Canadian province',
        source: getListSearch(PROVINCES),
      });

      expect(getScreen()).not.toContain('-- INSERT --');
      expect(getScreen()).not.toContain('-- NORMAL --');

      events.keypress({ name: 'escape' });
      events.type('Yuk');
      await nextRender();
      expect(getScreen()).toContain('? Select a Canadian province Yuk');
      expect(getScreen()).toContain('❯ Yukon');

      events.keypress('enter');
      await expect(answer).resolves.toEqual('YT');
    });

    it('supports emacs navigation keybindings via theme.keybindings and INQUIRER_KEYBINDINGS', async () => {
      vi.stubEnv('INQUIRER_KEYBINDINGS', 'emacs');
      const { answer, events, getScreen, nextRender } = await render(search, {
        message: 'Select a Canadian province',
        source: getListSearch(PROVINCES),
      });

      expect(getScreen()).not.toContain('-- INSERT --');

      events.type('New');
      await nextRender();
      expect(getScreen()).toContain('❯ New Brunswick');

      events.keypress({ name: 'n', ctrl: true });
      expect(getScreen()).toContain('❯ Newfoundland and Labrador');

      events.keypress({ name: 'p', ctrl: true });
      expect(getScreen()).toContain('❯ New Brunswick');

      // Typing j/k continues filtering in emacs-only mode.
      events.type('f');
      await nextRender();
      expect(getScreen()).toContain('? Select a Canadian province Newf');
      expect(getScreen()).toContain('❯ Newfoundland and Labrador');

      events.keypress('enter');
      await expect(answer).resolves.toEqual('NL');
    });

    it('enters normal mode with escape, navigates with j/k, and returns to insert mode', async () => {
      const { answer, events, getScreen, nextRender } = await render(search, {
        message: 'Select a Canadian province',
        source: getListSearch(PROVINCES),
        theme: { keybindings: ['vim'] },
      });

      expect(getScreen()).toContain('-- INSERT --');

      // Typing j/k in insert mode filters the query instead of moving selection.
      events.type('New');
      await nextRender();
      expect(getScreen()).toContain('? Select a Canadian province New');
      expect(getScreen()).toContain('❯ New Brunswick');

      // Escape enters normal mode without changing the search query.
      events.keypress({ name: 'escape' });
      expect(getScreen()).toContain('-- NORMAL --');
      expect(getScreen()).toContain('? Select a Canadian province New');

      // j/k navigate choices in normal mode without modifying the search query.
      events.keypress('j');
      expect(getScreen()).toContain('? Select a Canadian province New');
      expect(getScreen()).toContain('❯ Newfoundland and Labrador');

      events.keypress('k');
      expect(getScreen()).toContain('? Select a Canadian province New');
      expect(getScreen()).toContain('❯ New Brunswick');

      events.keypress('j');
      expect(getScreen()).toContain('❯ Newfoundland and Labrador');

      // Enter in normal mode submits the active choice and clears mode badge.
      events.keypress('enter');
      await expect(answer).resolves.toEqual('NL');
      expect(getScreen()).toBe('✔ Select a Canadian province Newfoundland and Labrador');
    });

    it('uses INQUIRER_KEYBINDINGS=vim by default and allows theme.keybindings override', async () => {
      vi.stubEnv('INQUIRER_KEYBINDINGS', 'vim');
      const first = await render(search, {
        message: 'Select a Canadian province',
        source: getListSearch(PROVINCES),
      });

      expect(first.getScreen()).toContain('-- INSERT --');
      first.events.keypress({ name: 'escape' });
      expect(first.getScreen()).toContain('-- NORMAL --');
      first.events.keypress('j');
      expect(first.getScreen()).toContain('❯ British Columbia');
      first.events.keypress('enter');
      await expect(first.answer).resolves.toEqual('BC');

      // Explicit theme.keybindings: [] overrides INQUIRER_KEYBINDINGS=vim.
      const second = await render(search, {
        message: 'Select a Canadian province',
        source: getListSearch(PROVINCES),
        theme: { keybindings: [] },
      });

      expect(second.getScreen()).not.toContain('-- INSERT --');
      second.events.keypress({ name: 'escape' });
      second.events.type('Yuk');
      await second.nextRender();
      expect(second.getScreen()).toContain('? Select a Canadian province Yuk');
      second.events.keypress('enter');
      await expect(second.answer).resolves.toEqual('YT');
    });

    it('supports Ctrl+[ to enter normal mode and custom vimMode theme styling', async () => {
      const { answer, events, getScreen } = await render(search, {
        message: 'Select a Canadian province',
        source: getListSearch(PROVINCES),
        theme: {
          keybindings: ['vim'],
          style: {
            vimMode: (mode: 'insert' | 'normal') =>
              mode === 'normal' ? '[NOR]' : '[INS]',
          },
        },
      });

      expect(getScreen()).toContain('[INS]');
      events.keypress({ name: '[', ctrl: true });
      expect(getScreen()).toContain('[NOR]');
      events.keypress('j');
      expect(getScreen()).toContain('❯ British Columbia');
      events.keypress('enter');
      await expect(answer).resolves.toEqual('BC');
    });

    it('supports count prefixes, gg, and G navigation while skipping separators and disabled choices', async () => {
      const choices = [
        new Separator('~ Start ~'),
        { name: 'One', value: 1 },
        { name: 'Two', value: 2 },
        { name: 'Disabled', value: 0, disabled: true },
        new Separator('~ Middle ~'),
        { name: 'Three', value: 3 },
        { name: 'Four', value: 4 },
        { name: 'Five', value: 5 },
      ];

      const { answer, events, getScreen } = await render(search, {
        message: 'Pick a number',
        source: () => choices,
        theme: { keybindings: ['vim'] },
      });

      events.keypress({ name: 'escape' });

      // 3j skips disabled + separator and lands on Four (1 -> 2 -> 3 -> 4).
      events.type('3j');
      expect(getScreen()).toContain('❯ Four');

      // 50j clamps at the last selectable choice (Five).
      events.type('50j');
      expect(getScreen()).toContain('❯ Five');

      // 2k moves up two selectable choices (Five -> Four -> Three).
      events.type('2k');
      expect(getScreen()).toContain('❯ Three');

      // gg jumps to the first selectable choice (One).
      events.type('gg');
      expect(getScreen()).toContain('❯ One');

      // G jumps to the last selectable choice (Five).
      events.keypress('G');
      expect(getScreen()).toContain('❯ Five');

      // 2gg jumps to the 2nd selectable choice (Two).
      events.type('2gg');
      expect(getScreen()).toContain('❯ Two');

      // 3G jumps to the 3rd selectable choice (Three).
      events.type('3G');
      expect(getScreen()).toContain('❯ Three');

      events.keypress('enter');
      await expect(answer).resolves.toEqual(3);
    });

    it('supports h, l, b, e, w, 0, $, i, I, a, A cursor motions and editing in search query', async () => {
      const { answer, events, getScreen, nextRender } = await render(search, {
        message: 'Select a Canadian province',
        source: getListSearch(PROVINCES),
        theme: { keybindings: ['vim'] },
      });

      const promptLine = () => (getScreen().split('\n')[0] ?? '').trimEnd();

      // Type "New Scot" (cursor at 8), press Esc -> cursor at 7 ('t').
      events.type('New Scot');
      await nextRender();
      events.keypress({ name: 'escape' });

      // 'b' jumps to start of "Scot" (index 4: 'S'), 'b' again to 'N' (0), 'e' to 'w' (2).
      events.keypress('b');
      events.keypress('b');
      events.keypress('e');
      // 'l' moves to ' ' (3), 'l' moves to 'S' (4), 'h' moves back to ' ' (3), 'l' back to 'S' (4).
      events.keypress('l');
      events.keypress('l');
      events.keypress('h');
      events.keypress('l');
      // 'a' appends after 'S' (index 5) and enters insert mode.
      events.keypress('a');
      expect(getScreen()).toContain('-- INSERT --');
      events.type('X');
      await nextRender();
      expect(promptLine()).toBe('? Select a Canadian province New SXcot');

      // Esc -> cursor on 'X' (5), 'x' deletes 'X' while staying in normal mode.
      events.keypress({ name: 'escape' });
      events.keypress('x');
      await nextRender();
      expect(getScreen()).toContain('-- NORMAL --');
      expect(promptLine()).toBe('? Select a Canadian province New Scot');

      // 'A' appends at the end of the line.
      events.keypress('A');
      events.type('ia');
      await nextRender();
      expect(promptLine()).toBe('? Select a Canadian province New Scotia');

      // Esc -> '0' -> 'I' inserts at start; let's change "New" to "Nova" using '0' + 'cw'.
      events.keypress({ name: 'escape' });
      events.keypress('0');
      events.type('cw');
      await nextRender();
      expect(getScreen()).toContain('-- INSERT --');
      expect(promptLine()).toBe('? Select a Canadian province  Scotia');

      events.type('Nova');
      await nextRender();
      expect(promptLine()).toBe('? Select a Canadian province Nova Scotia');
      expect(getScreen()).toContain('❯ Nova Scotia');

      events.keypress('enter');
      await expect(answer).resolves.toEqual('NS');
    });

    it('supports c (cc, C, ce, cb) and d (dd, dw) operators in normal mode', async () => {
      const { answer, events, getScreen, nextRender } = await render(search, {
        message: 'Select a Canadian province',
        source: getListSearch(PROVINCES),
        theme: { keybindings: ['vim'] },
      });

      const promptLine = () => (getScreen().split('\n')[0] ?? '').trimEnd();

      // cc clears the entire query and enters insert mode.
      events.type('British Col');
      await nextRender();
      events.keypress({ name: 'escape' });
      events.type('cc');
      await nextRender();
      expect(getScreen()).toContain('-- INSERT --');
      expect(promptLine()).toBe('? Select a Canadian province');

      // C clears from cursor to end and enters insert mode.
      events.type('New Wrong');
      await nextRender();
      events.keypress({ name: 'escape' });
      events.keypress('b'); // on 'W'
      events.keypress('C');
      await nextRender();
      expect(getScreen()).toContain('-- INSERT --');
      expect(promptLine()).toBe('? Select a Canadian province New');

      events.type('Brunswick');
      await nextRender();
      expect(promptLine()).toBe('? Select a Canadian province New Brunswick');

      // dd clears the query while staying in normal mode.
      events.keypress({ name: 'escape' });
      events.type('dd');
      await nextRender();
      expect(getScreen()).toContain('-- NORMAL --');
      expect(promptLine()).toBe('? Select a Canadian province');

      // 'a' on an empty query enters insert mode at index 0.
      events.keypress('a');
      events.type('Quebec');
      await nextRender();
      expect(promptLine()).toBe('? Select a Canadian province Quebec');

      events.keypress('enter');
      await expect(answer).resolves.toEqual('QC');
    });

    it('ignores unrecognized keys and cancels pending sequences on escape in normal mode', async () => {
      const { answer, events, getScreen, nextRender } = await render(search, {
        message: 'Select a Canadian province',
        source: getListSearch(PROVINCES),
        initialValue: 'New',
        theme: { keybindings: ['vim'] },
      });

      const promptLine = () => (getScreen().split('\n')[0] ?? '').trimEnd();

      events.keypress({ name: 'escape' });
      expect(getScreen()).toContain('-- NORMAL --');

      // Unrecognized keys must not leak into the search term.
      events.keypress('z');
      events.keypress('q');
      expect(promptLine()).toBe('? Select a Canadian province New');

      // Pending 'c' or 'g' or count cancelled by escape must not corrupt state.
      events.keypress('c');
      events.keypress({ name: 'escape' });
      expect(getScreen()).toContain('-- NORMAL --');
      expect(promptLine()).toBe('? Select a Canadian province New');

      events.keypress('g');
      events.keypress({ name: 'escape' });
      events.keypress('j');
      expect(getScreen()).toContain('❯ Newfoundland and Labrador');

      // Tab autocompletes in normal mode and stays editable.
      events.keypress('tab');
      await nextRender();
      expect(promptLine()).toBe('? Select a Canadian province Newfoundland and Labrador');

      events.keypress('enter');
      await expect(answer).resolves.toEqual('NL');
    });

    it('supports combined vim and emacs keybindings together', async () => {
      const { answer, events, getScreen, nextRender } = await render(search, {
        message: 'Select a Canadian province',
        source: getListSearch(PROVINCES),
        theme: { keybindings: ['vim', 'emacs'] },
      });

      // Ctrl+N works in insert mode.
      events.keypress({ name: 'n', ctrl: true });
      expect(getScreen()).toContain('❯ British Columbia');

      // Esc -> normal mode: both j/k and Ctrl+N/Ctrl+P work.
      events.keypress({ name: 'escape' });
      events.keypress('j');
      expect(getScreen()).toContain('❯ Manitoba');
      events.keypress({ name: 'p', ctrl: true });
      expect(getScreen()).toContain('❯ British Columbia');

      // Return to insert mode and filter.
      events.keypress('i');
      events.type('Yuk');
      await nextRender();
      expect(getScreen()).toContain('❯ Yukon');

      events.keypress('enter');
      await expect(answer).resolves.toEqual('YT');
    });

    it('handles normal-mode navigation safely while results are loading or empty', async () => {
      const { promise: pending, resolve } = withResolver<Array<string>>();
      const { answer, events, getScreen, nextRender } = await render(search, {
        message: 'Select an item',
        source: (term?: string) => (term ? pending : []),
        theme: { keybindings: ['vim'] },
      });

      events.keypress({ name: 'escape' });
      // Navigating an empty list must be a safe no-op.
      events.keypress('j');
      events.keypress('k');
      events.type('gg');
      events.keypress('G');
      expect(getScreen()).toContain('-- NORMAL --');

      // Trigger a pending search, then enter normal mode while still loading.
      events.keypress('i');
      events.type('a');
      await nextRender();
      events.keypress({ name: 'escape' });
      events.keypress('j');
      events.keypress('G');

      resolve(['alpha', 'beta']);
      await nextRender();
      events.keypress('j');
      expect(getScreen()).toContain('❯ beta');

      events.keypress('enter');
      await expect(answer).resolves.toEqual('beta');
    });

    it('keeps query editable after validation failure in normal mode', async () => {
      const { answer, events, getScreen, nextRender } = await render(search, {
        message: 'Select a Canadian province',
        source: getListSearch(PROVINCES),
        validate: (value: string) => (value === 'AB' ? 'Alberta is not allowed' : true),
        theme: { keybindings: ['vim'] },
      });

      events.type('Alberta');
      await nextRender();
      events.keypress({ name: 'escape' });
      events.keypress('enter');
      await nextRender();
      expect(getScreen()).toContain('Alberta is not allowed');
      expect(getScreen()).toContain('-- NORMAL --');

      // Clear rejected query with cc and select a valid province.
      events.type('cc');
      await nextRender();
      events.type('Yukon');
      await nextRender();
      events.keypress('enter');
      await expect(answer).resolves.toEqual('YT');
    });

    it('handles pending validation, autocomplete-on-invalid, enter-while-loading, and large G counts in normal mode', async () => {
      const { promise: validation, resolve: resolveValidation } = withResolver<
        boolean | string
      >();
      const { answer, events, getScreen, nextRender } = await render(search, {
        message: 'Select a Canadian province',
        source: getListSearch(PROVINCES),
        validate: (value: string) => (value === 'AB' ? validation : true),
        theme: {
          keybindings: ['vim'],
          style: { vimMode: () => undefined },
        },
      });

      const promptLine = () => (getScreen().split('\n')[0] ?? '').trimEnd();

      // vimMode returning undefined hides the badge while keeping vim active.
      expect(getScreen()).not.toContain('-- INSERT --');

      events.type('Al');
      await nextRender();
      events.keypress({ name: 'escape' });

      // Press enter in normal mode -> validation pending; extra keys are ignored.
      events.keypress('enter');
      events.type('ignored');
      resolveValidation(false);
      await nextRender();

      // Since selectedChoice.name ('Alberta') !== searchTerm ('Al'), enter
      // autocompleted to 'Alberta' while staying in normal mode.
      expect(promptLine()).toBe('? Select a Canadian province Alberta');

      // 99G clamps to the last selectable choice.
      events.type('dd');
      await nextRender();
      events.type('99G');
      expect(getScreen()).toContain('❯ Yukon');

      events.keypress('enter');
      await expect(answer).resolves.toEqual('YT');
    });

    it('keeps search term intact when pressing enter while loading in normal mode', async () => {
      const { promise: pending, resolve } = withResolver<Array<string>>();
      const { answer, events, nextRender } = await render(search, {
        message: 'Select an item',
        source: (term?: string) => (term ? pending : ['alpha']),
        theme: { keybindings: ['vim'] },
      });

      events.type('be');
      await nextRender();
      events.keypress({ name: 'escape' });
      events.keypress('enter');

      resolve(['beta']);
      await nextRender();
      events.keypress('enter');
      await expect(answer).resolves.toEqual('beta');
    });
  });
});

describe('search types', () => {
  it('infers exact string union from hardcoded string choices', async () => {
    const abortController = new AbortController();
    const { answer } = await render(
      search,
      {
        message: 'test',
        source: () => ['foo', 'bar'] as const,
      },
      { signal: abortController.signal },
    );
    expectTypeOf(answer).resolves.toExtend<'foo' | 'bar'>();
    abortController.abort();
    await expect(answer).rejects.toThrow();
  });

  it('infers number from Choice<number> choices', async () => {
    const abortController = new AbortController();
    const { answer } = await render(
      search,
      {
        message: 'test',
        source: () => [{ value: 1 }, { value: 2 }],
      },
      { signal: abortController.signal },
    );
    expectTypeOf(answer).resolves.toExtend<number>();
    abortController.abort();
    await expect(answer).rejects.toThrow();
  });
});
