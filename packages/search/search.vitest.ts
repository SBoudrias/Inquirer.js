import { describe, it, expect, expectTypeOf, vi } from 'vitest';
import { render } from '@inquirer/testing';
import { withResolver } from '@inquirer/type';
import search, { Separator } from './src/index.ts';

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
