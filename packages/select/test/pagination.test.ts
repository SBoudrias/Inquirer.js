import { describe, it, expect } from 'vitest';
import { render } from '@inquirer/testing';
import select, { Separator } from '../src/index.ts';

const italianMenu = [
  {
    name: 'Spaghetti Carbonara\n    Eggs, Pecorino Romano, Pancetta\n    30 minutes',
    short: 'Spaghetti Carbonara',
    value: 'carbonara',
  },
  {
    name: 'Margherita Pizza\n    Tomatoes, Mozzarella, Basil\n    45 minutes',
    short: 'Margherita Pizza',
    value: 'pizza',
  },
  {
    name: 'Caesar Salad\n    Romaine, Croutons, Parmesan\n    15 minutes',
    short: 'Caesar Salad',
    value: 'salad',
  },
];

const numberedChoices = [
  { value: 1 },
  { value: 2 },
  { value: 3 },
  { value: 4 },
  { value: 5 },
  { value: 6 },
  { value: 7 },
  { value: 8 },
  { value: 9 },
  { value: 10 },
  { value: 11 },
  { value: 12 },
] as const;

describe('select() prompt pagination', () => {
  describe('loop: true', () => {
    describe('choices fitting in pageSize', () => {
      it('multi-line choices', async () => {
        const { answer, events, getScreen } = await render(select, {
          message: 'Select a recipe',
          choices: italianMenu,
          pageSize: 9,
          loop: true,
        });

        expect(getScreen()).toMatchInlineSnapshot(`
          "? Select a recipe
          ❯ Spaghetti Carbonara
              Eggs, Pecorino Romano, Pancetta
              30 minutes
            Margherita Pizza
              Tomatoes, Mozzarella, Basil
              45 minutes
            Caesar Salad
              Romaine, Croutons, Parmesan
              15 minutes

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('down');
        expect(getScreen()).toMatchInlineSnapshot(`
          "? Select a recipe
            Spaghetti Carbonara
              Eggs, Pecorino Romano, Pancetta
              30 minutes
          ❯ Margherita Pizza
              Tomatoes, Mozzarella, Basil
              45 minutes
            Caesar Salad
              Romaine, Croutons, Parmesan
              15 minutes

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('down');
        expect(getScreen()).toMatchInlineSnapshot(`
          "? Select a recipe
            Spaghetti Carbonara
              Eggs, Pecorino Romano, Pancetta
              30 minutes
            Margherita Pizza
              Tomatoes, Mozzarella, Basil
              45 minutes
          ❯ Caesar Salad
              Romaine, Croutons, Parmesan
              15 minutes

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('down');
        expect(getScreen()).toMatchInlineSnapshot(`
          "? Select a recipe
          ❯ Spaghetti Carbonara
              Eggs, Pecorino Romano, Pancetta
              30 minutes
            Margherita Pizza
              Tomatoes, Mozzarella, Basil
              45 minutes
            Caesar Salad
              Romaine, Croutons, Parmesan
              15 minutes

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('up');
        expect(getScreen()).toMatchInlineSnapshot(`
          "? Select a recipe
            Spaghetti Carbonara
              Eggs, Pecorino Romano, Pancetta
              30 minutes
            Margherita Pizza
              Tomatoes, Mozzarella, Basil
              45 minutes
          ❯ Caesar Salad
              Romaine, Croutons, Parmesan
              15 minutes

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('up');
        expect(getScreen()).toMatchInlineSnapshot(`
          "? Select a recipe
            Spaghetti Carbonara
              Eggs, Pecorino Romano, Pancetta
              30 minutes
          ❯ Margherita Pizza
              Tomatoes, Mozzarella, Basil
              45 minutes
            Caesar Salad
              Romaine, Croutons, Parmesan
              15 minutes

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('up');
        expect(getScreen()).toMatchInlineSnapshot(`
          "? Select a recipe
          ❯ Spaghetti Carbonara
              Eggs, Pecorino Romano, Pancetta
              30 minutes
            Margherita Pizza
              Tomatoes, Mozzarella, Basil
              45 minutes
            Caesar Salad
              Romaine, Croutons, Parmesan
              15 minutes

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('up');
        expect(getScreen()).toMatchInlineSnapshot(`
          "? Select a recipe
            Spaghetti Carbonara
              Eggs, Pecorino Romano, Pancetta
              30 minutes
            Margherita Pizza
              Tomatoes, Mozzarella, Basil
              45 minutes
          ❯ Caesar Salad
              Romaine, Croutons, Parmesan
              15 minutes

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('enter');
        await expect(answer).resolves.toEqual('salad');
      });

      it('multi-line choices + separators', async () => {
        const { answer, events, getScreen } = await render(select, {
          message: 'Select a recipe',
          choices: [new Separator(), ...italianMenu, new Separator()],
          pageSize: 11,
          loop: true,
        });

        expect(getScreen()).toMatchInlineSnapshot(`
          "? Select a recipe
           ──────────────
          ❯ Spaghetti Carbonara
              Eggs, Pecorino Romano, Pancetta
              30 minutes
            Margherita Pizza
              Tomatoes, Mozzarella, Basil
              45 minutes
            Caesar Salad
              Romaine, Croutons, Parmesan
              15 minutes
           ──────────────

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('down');
        expect(getScreen()).toMatchInlineSnapshot(`
          "? Select a recipe
           ──────────────
            Spaghetti Carbonara
              Eggs, Pecorino Romano, Pancetta
              30 minutes
          ❯ Margherita Pizza
              Tomatoes, Mozzarella, Basil
              45 minutes
            Caesar Salad
              Romaine, Croutons, Parmesan
              15 minutes
           ──────────────

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('down');
        expect(getScreen()).toMatchInlineSnapshot(`
          "? Select a recipe
           ──────────────
            Spaghetti Carbonara
              Eggs, Pecorino Romano, Pancetta
              30 minutes
            Margherita Pizza
              Tomatoes, Mozzarella, Basil
              45 minutes
          ❯ Caesar Salad
              Romaine, Croutons, Parmesan
              15 minutes
           ──────────────

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('down');
        expect(getScreen()).toMatchInlineSnapshot(`
          "? Select a recipe
           ──────────────
          ❯ Spaghetti Carbonara
              Eggs, Pecorino Romano, Pancetta
              30 minutes
            Margherita Pizza
              Tomatoes, Mozzarella, Basil
              45 minutes
            Caesar Salad
              Romaine, Croutons, Parmesan
              15 minutes
           ──────────────

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('up');
        expect(getScreen()).toMatchInlineSnapshot(`
          "? Select a recipe
           ──────────────
            Spaghetti Carbonara
              Eggs, Pecorino Romano, Pancetta
              30 minutes
            Margherita Pizza
              Tomatoes, Mozzarella, Basil
              45 minutes
          ❯ Caesar Salad
              Romaine, Croutons, Parmesan
              15 minutes
           ──────────────

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('up');
        expect(getScreen()).toMatchInlineSnapshot(`
          "? Select a recipe
           ──────────────
            Spaghetti Carbonara
              Eggs, Pecorino Romano, Pancetta
              30 minutes
          ❯ Margherita Pizza
              Tomatoes, Mozzarella, Basil
              45 minutes
            Caesar Salad
              Romaine, Croutons, Parmesan
              15 minutes
           ──────────────

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('up');
        expect(getScreen()).toMatchInlineSnapshot(`
          "? Select a recipe
           ──────────────
          ❯ Spaghetti Carbonara
              Eggs, Pecorino Romano, Pancetta
              30 minutes
            Margherita Pizza
              Tomatoes, Mozzarella, Basil
              45 minutes
            Caesar Salad
              Romaine, Croutons, Parmesan
              15 minutes
           ──────────────

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('up');
        expect(getScreen()).toMatchInlineSnapshot(`
          "? Select a recipe
           ──────────────
            Spaghetti Carbonara
              Eggs, Pecorino Romano, Pancetta
              30 minutes
            Margherita Pizza
              Tomatoes, Mozzarella, Basil
              45 minutes
          ❯ Caesar Salad
              Romaine, Croutons, Parmesan
              15 minutes
           ──────────────

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('enter');
        await expect(answer).resolves.toEqual('salad');
      });
    });

    describe('choices longer than pageSize', () => {
      it('multi-line choices', async () => {
        const { answer, events, getScreen } = await render(select, {
          message: 'Select a recipe',
          choices: italianMenu,
          pageSize: 7,
          loop: true,
        });

        expect(getScreen()).toMatchInlineSnapshot(`
          "? Select a recipe
          ❯ Spaghetti Carbonara
              Eggs, Pecorino Romano, Pancetta
              30 minutes
            Margherita Pizza
              Tomatoes, Mozzarella, Basil
              45 minutes
            Caesar Salad

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('down');
        expect(getScreen()).toMatchInlineSnapshot(`
          "? Select a recipe
            Spaghetti Carbonara
              Eggs, Pecorino Romano, Pancetta
              30 minutes
          ❯ Margherita Pizza
              Tomatoes, Mozzarella, Basil
              45 minutes
            Caesar Salad

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('down');
        expect(getScreen()).toMatchInlineSnapshot(`
          "? Select a recipe
            Margherita Pizza
              Tomatoes, Mozzarella, Basil
              45 minutes
          ❯ Caesar Salad
              Romaine, Croutons, Parmesan
              15 minutes
            Spaghetti Carbonara

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('down');
        expect(getScreen()).toMatchInlineSnapshot(`
          "? Select a recipe
            Caesar Salad
              Romaine, Croutons, Parmesan
              15 minutes
          ❯ Spaghetti Carbonara
              Eggs, Pecorino Romano, Pancetta
              30 minutes
            Margherita Pizza

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('up');
        expect(getScreen()).toMatchInlineSnapshot(`
          "? Select a recipe
            Margherita Pizza
              Tomatoes, Mozzarella, Basil
              45 minutes
          ❯ Caesar Salad
              Romaine, Croutons, Parmesan
              15 minutes
            Spaghetti Carbonara

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('up');
        expect(getScreen()).toMatchInlineSnapshot(`
          "? Select a recipe
            Spaghetti Carbonara
              Eggs, Pecorino Romano, Pancetta
              30 minutes
          ❯ Margherita Pizza
              Tomatoes, Mozzarella, Basil
              45 minutes
            Caesar Salad

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('up');
        expect(getScreen()).toMatchInlineSnapshot(`
          "? Select a recipe
            Caesar Salad
              Romaine, Croutons, Parmesan
              15 minutes
          ❯ Spaghetti Carbonara
              Eggs, Pecorino Romano, Pancetta
              30 minutes
            Margherita Pizza

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('enter');
        await expect(answer).resolves.toEqual('carbonara');
      });

      it('multi-line choices + separators', async () => {
        const { answer, events, getScreen } = await render(select, {
          message: 'Select a recipe',
          choices: [new Separator(), ...italianMenu, new Separator()],
          pageSize: 7,
          loop: true,
        });

        expect(getScreen()).toMatchInlineSnapshot(`
          "? Select a recipe
           ──────────────
          ❯ Spaghetti Carbonara
              Eggs, Pecorino Romano, Pancetta
              30 minutes
            Margherita Pizza
              Tomatoes, Mozzarella, Basil
              45 minutes

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('down');
        expect(getScreen()).toMatchInlineSnapshot(`
          "? Select a recipe
            Spaghetti Carbonara
              Eggs, Pecorino Romano, Pancetta
              30 minutes
          ❯ Margherita Pizza
              Tomatoes, Mozzarella, Basil
              45 minutes
            Caesar Salad

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('down');
        expect(getScreen()).toMatchInlineSnapshot(`
          "? Select a recipe
            Margherita Pizza
              Tomatoes, Mozzarella, Basil
              45 minutes
          ❯ Caesar Salad
              Romaine, Croutons, Parmesan
              15 minutes
           ──────────────

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('down');
        expect(getScreen()).toMatchInlineSnapshot(`
          "? Select a recipe
              15 minutes
           ──────────────
           ──────────────
          ❯ Spaghetti Carbonara
              Eggs, Pecorino Romano, Pancetta
              30 minutes
            Margherita Pizza

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('up');
        expect(getScreen()).toMatchInlineSnapshot(`
          "? Select a recipe
            Margherita Pizza
              Tomatoes, Mozzarella, Basil
              45 minutes
          ❯ Caesar Salad
              Romaine, Croutons, Parmesan
              15 minutes
           ──────────────

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('up');
        expect(getScreen()).toMatchInlineSnapshot(`
          "? Select a recipe
            Spaghetti Carbonara
              Eggs, Pecorino Romano, Pancetta
              30 minutes
          ❯ Margherita Pizza
              Tomatoes, Mozzarella, Basil
              45 minutes
            Caesar Salad

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('up');
        expect(getScreen()).toMatchInlineSnapshot(`
          "? Select a recipe
              15 minutes
           ──────────────
           ──────────────
          ❯ Spaghetti Carbonara
              Eggs, Pecorino Romano, Pancetta
              30 minutes
            Margherita Pizza

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('enter');
        await expect(answer).resolves.toEqual('carbonara');
      });

      it('single line choices, progressive cursor', async () => {
        const { answer, events, getScreen } = await render(select, {
          message: 'Select a number',
          choices: numberedChoices,
          pageSize: 7,
          loop: true,
        });

        expect(getScreen()).toMatchInlineSnapshot(`
          "? Select a number
          ❯ 1
            2
            3
            4
            5
            6
            7

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('down');
        expect(getScreen()).toMatchInlineSnapshot(`
          "? Select a number
            1
          ❯ 2
            3
            4
            5
            6
            7

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('down');
        expect(getScreen()).toMatchInlineSnapshot(`
          "? Select a number
            1
            2
          ❯ 3
            4
            5
            6
            7

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('up');
        expect(getScreen()).toMatchInlineSnapshot(`
          "? Select a number
            12
            1
          ❯ 2
            3
            4
            5
            6

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('up');
        expect(getScreen()).toMatchInlineSnapshot(`
          "? Select a number
            11
            12
          ❯ 1
            2
            3
            4
            5

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('down');
        expect(getScreen()).toMatchInlineSnapshot(`
          "? Select a number
            12
            1
          ❯ 2
            3
            4
            5
            6

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('enter');
        await expect(answer).resolves.toEqual(2);
      });
    });

    it('single line choices, going up a while and down', async () => {
      const { answer, events, getScreen } = await render(select, {
        message: 'Select a number',
        choices: numberedChoices,
        pageSize: 7,
        loop: true,
      });

      expect(getScreen()).toMatchInlineSnapshot(`
        "? Select a number
        ❯ 1
          2
          3
          4
          5
          6
          7

        ↑↓ navigate • ⏎ select"
      `);

      events.keypress('up');
      events.keypress('up');
      events.keypress('up');
      events.keypress('up');
      expect(getScreen()).toMatchInlineSnapshot(`
        "? Select a number
        ❯ 9
          10
          11
          12
          1
          2
          3

        ↑↓ navigate • ⏎ select"
      `);

      events.keypress('down');
      expect(getScreen()).toMatchInlineSnapshot(`
        "? Select a number
          9
        ❯ 10
          11
          12
          1
          2
          3

        ↑↓ navigate • ⏎ select"
      `);

      events.keypress('enter');
      await expect(answer).resolves.toEqual(10);
    });
  });

  describe('loop: false', () => {
    describe('choices fitting in pageSize', () => {
      it('multi-line choices', async () => {
        const { answer, events, getScreen } = await render(select, {
          message: 'Select a recipe',
          choices: italianMenu,
          pageSize: 9,
          loop: false,
        });

        expect(getScreen()).toMatchInlineSnapshot(`
          "? Select a recipe
          ❯ Spaghetti Carbonara
              Eggs, Pecorino Romano, Pancetta
              30 minutes
            Margherita Pizza
              Tomatoes, Mozzarella, Basil
              45 minutes
            Caesar Salad
              Romaine, Croutons, Parmesan
              15 minutes

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('down');
        expect(getScreen()).toMatchInlineSnapshot(`
          "? Select a recipe
            Spaghetti Carbonara
              Eggs, Pecorino Romano, Pancetta
              30 minutes
          ❯ Margherita Pizza
              Tomatoes, Mozzarella, Basil
              45 minutes
            Caesar Salad
              Romaine, Croutons, Parmesan
              15 minutes

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('down');
        const bottomScreen = getScreen();
        expect(bottomScreen).toMatchInlineSnapshot(`
          "? Select a recipe
            Spaghetti Carbonara
              Eggs, Pecorino Romano, Pancetta
              30 minutes
            Margherita Pizza
              Tomatoes, Mozzarella, Basil
              45 minutes
          ❯ Caesar Salad
              Romaine, Croutons, Parmesan
              15 minutes

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('down');
        expect(bottomScreen).toEqual(getScreen());

        events.keypress('up');
        expect(getScreen()).toMatchInlineSnapshot(`
          "? Select a recipe
            Spaghetti Carbonara
              Eggs, Pecorino Romano, Pancetta
              30 minutes
          ❯ Margherita Pizza
              Tomatoes, Mozzarella, Basil
              45 minutes
            Caesar Salad
              Romaine, Croutons, Parmesan
              15 minutes

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('up');
        const topScreen = getScreen();
        expect(topScreen).toMatchInlineSnapshot(`
          "? Select a recipe
          ❯ Spaghetti Carbonara
              Eggs, Pecorino Romano, Pancetta
              30 minutes
            Margherita Pizza
              Tomatoes, Mozzarella, Basil
              45 minutes
            Caesar Salad
              Romaine, Croutons, Parmesan
              15 minutes

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('up');
        expect(topScreen).toEqual(getScreen());

        events.keypress('enter');
        await expect(answer).resolves.toEqual('carbonara');
      });

      it('multi-line choices + separators', async () => {
        const { answer, events, getScreen } = await render(select, {
          message: 'Select a recipe',
          choices: [new Separator(), ...italianMenu, new Separator()],
          pageSize: 11,
          loop: false,
        });

        expect(getScreen()).toMatchInlineSnapshot(`
          "? Select a recipe
           ──────────────
          ❯ Spaghetti Carbonara
              Eggs, Pecorino Romano, Pancetta
              30 minutes
            Margherita Pizza
              Tomatoes, Mozzarella, Basil
              45 minutes
            Caesar Salad
              Romaine, Croutons, Parmesan
              15 minutes
           ──────────────

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('down');
        expect(getScreen()).toMatchInlineSnapshot(`
          "? Select a recipe
           ──────────────
            Spaghetti Carbonara
              Eggs, Pecorino Romano, Pancetta
              30 minutes
          ❯ Margherita Pizza
              Tomatoes, Mozzarella, Basil
              45 minutes
            Caesar Salad
              Romaine, Croutons, Parmesan
              15 minutes
           ──────────────

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('down');
        expect(getScreen()).toMatchInlineSnapshot(`
          "? Select a recipe
           ──────────────
            Spaghetti Carbonara
              Eggs, Pecorino Romano, Pancetta
              30 minutes
            Margherita Pizza
              Tomatoes, Mozzarella, Basil
              45 minutes
          ❯ Caesar Salad
              Romaine, Croutons, Parmesan
              15 minutes
           ──────────────

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('down');
        expect(getScreen()).toMatchInlineSnapshot(`
          "? Select a recipe
           ──────────────
            Spaghetti Carbonara
              Eggs, Pecorino Romano, Pancetta
              30 minutes
            Margherita Pizza
              Tomatoes, Mozzarella, Basil
              45 minutes
          ❯ Caesar Salad
              Romaine, Croutons, Parmesan
              15 minutes
           ──────────────

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('up');
        expect(getScreen()).toMatchInlineSnapshot(`
          "? Select a recipe
           ──────────────
            Spaghetti Carbonara
              Eggs, Pecorino Romano, Pancetta
              30 minutes
          ❯ Margherita Pizza
              Tomatoes, Mozzarella, Basil
              45 minutes
            Caesar Salad
              Romaine, Croutons, Parmesan
              15 minutes
           ──────────────

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('up');
        const topScreen = getScreen();
        expect(topScreen).toMatchInlineSnapshot(`
          "? Select a recipe
           ──────────────
          ❯ Spaghetti Carbonara
              Eggs, Pecorino Romano, Pancetta
              30 minutes
            Margherita Pizza
              Tomatoes, Mozzarella, Basil
              45 minutes
            Caesar Salad
              Romaine, Croutons, Parmesan
              15 minutes
           ──────────────

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('up');
        expect(topScreen).toEqual(getScreen());

        events.keypress('enter');
        await expect(answer).resolves.toEqual('carbonara');
      });
    });

    describe('choices longer than pageSize', () => {
      it('multi-line choices', async () => {
        const { answer, events, getScreen } = await render(select, {
          message: 'Select a recipe',
          choices: italianMenu,
          pageSize: 7,
          loop: false,
        });

        expect(getScreen()).toMatchInlineSnapshot(`
          "? Select a recipe
          ❯ Spaghetti Carbonara
              Eggs, Pecorino Romano, Pancetta
              30 minutes
            Margherita Pizza
              Tomatoes, Mozzarella, Basil
              45 minutes
            Caesar Salad

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('down');
        expect(getScreen()).toMatchInlineSnapshot(`
          "? Select a recipe
            Spaghetti Carbonara
              Eggs, Pecorino Romano, Pancetta
              30 minutes
          ❯ Margherita Pizza
              Tomatoes, Mozzarella, Basil
              45 minutes
            Caesar Salad

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('down');
        const bottomScreen = getScreen();
        expect(bottomScreen).toMatchInlineSnapshot(`
          "? Select a recipe
              30 minutes
            Margherita Pizza
              Tomatoes, Mozzarella, Basil
              45 minutes
          ❯ Caesar Salad
              Romaine, Croutons, Parmesan
              15 minutes

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('down');
        expect(bottomScreen).toEqual(getScreen());

        events.keypress('up');
        expect(getScreen()).toMatchInlineSnapshot(`
          "? Select a recipe
            Spaghetti Carbonara
              Eggs, Pecorino Romano, Pancetta
              30 minutes
          ❯ Margherita Pizza
              Tomatoes, Mozzarella, Basil
              45 minutes
            Caesar Salad

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('up');
        const topScreen = getScreen();
        expect(topScreen).toMatchInlineSnapshot(`
          "? Select a recipe
          ❯ Spaghetti Carbonara
              Eggs, Pecorino Romano, Pancetta
              30 minutes
            Margherita Pizza
              Tomatoes, Mozzarella, Basil
              45 minutes
            Caesar Salad

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('up');
        expect(topScreen).toEqual(getScreen());

        events.keypress('enter');
        await expect(answer).resolves.toEqual('carbonara');
      });

      it('multi-line choices + separators', async () => {
        const { answer, events, getScreen } = await render(select, {
          message: 'Select a recipe',
          choices: [new Separator(), ...italianMenu, new Separator()],
          pageSize: 7,
          loop: false,
        });

        expect(getScreen()).toMatchInlineSnapshot(`
          "? Select a recipe
           ──────────────
          ❯ Spaghetti Carbonara
              Eggs, Pecorino Romano, Pancetta
              30 minutes
            Margherita Pizza
              Tomatoes, Mozzarella, Basil
              45 minutes

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('down');
        expect(getScreen()).toMatchInlineSnapshot(`
          "? Select a recipe
            Spaghetti Carbonara
              Eggs, Pecorino Romano, Pancetta
              30 minutes
          ❯ Margherita Pizza
              Tomatoes, Mozzarella, Basil
              45 minutes
            Caesar Salad

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('down');
        const bottomScreen = getScreen();
        expect(bottomScreen).toMatchInlineSnapshot(`
          "? Select a recipe
            Margherita Pizza
              Tomatoes, Mozzarella, Basil
              45 minutes
          ❯ Caesar Salad
              Romaine, Croutons, Parmesan
              15 minutes
           ──────────────

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('down');
        expect(bottomScreen).toEqual(getScreen());

        events.keypress('up');
        expect(getScreen()).toMatchInlineSnapshot(`
          "? Select a recipe
            Spaghetti Carbonara
              Eggs, Pecorino Romano, Pancetta
              30 minutes
          ❯ Margherita Pizza
              Tomatoes, Mozzarella, Basil
              45 minutes
            Caesar Salad

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('up');
        const topScreen = getScreen();
        expect(topScreen).toMatchInlineSnapshot(`
          "? Select a recipe
           ──────────────
          ❯ Spaghetti Carbonara
              Eggs, Pecorino Romano, Pancetta
              30 minutes
            Margherita Pizza
              Tomatoes, Mozzarella, Basil
              45 minutes

          ↑↓ navigate • ⏎ select"
        `);

        events.keypress('up');
        expect(topScreen).toEqual(getScreen());

        events.keypress('enter');
        await expect(answer).resolves.toEqual('carbonara');
      });
    });
  });
});
