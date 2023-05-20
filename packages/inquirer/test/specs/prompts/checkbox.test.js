import { vi, expect, beforeEach, describe, it } from 'vitest';
import ReadlineStub from '../../helpers/readline.js';
import fixtures from '../../helpers/fixtures.js';

import Checkbox from '../../../lib/prompts/checkbox.js';

describe('`checkbox` prompt', () => {
  let fixture;
  let rl;
  let checkbox;

  beforeEach(() => {
    fixture = { ...fixtures.checkbox };
    rl = new ReadlineStub();
    checkbox = new Checkbox(fixture, rl);
  });

  it('should return a single selected choice in an array', () =>
    new Promise((done) => {
      checkbox.run().then((answer) => {
        expect(answer.length).toEqual(1);
        expect(answer[0]).toEqual('choice 1');
        done();
      });
      rl.input.emit('keypress', ' ', { name: 'space' });
      rl.emit('line');
    }));

  it('should return multiples selected choices in an array', () =>
    new Promise((done) => {
      checkbox.run().then((answer) => {
        expect(answer.length).toEqual(2);
        expect(answer[0]).toEqual('choice 1');
        expect(answer[1]).toEqual('choice 2');
        done();
      });
      rl.input.emit('keypress', ' ', { name: 'space' });
      rl.input.emit('keypress', null, { name: 'down' });
      rl.input.emit('keypress', ' ', { name: 'space' });
      rl.emit('line');
    }));

  it('should check defaults choices', () =>
    new Promise((done) => {
      fixture.choices = [
        { name: '1', checked: true },
        { name: '2', checked: false },
        { name: '3', checked: false },
      ];
      checkbox = new Checkbox(fixture, rl);
      checkbox.run().then((answer) => {
        expect(answer.length).toEqual(1);
        expect(answer[0]).toEqual('1');
        done();
      });
      rl.emit('line');
    }));

  it('provide an array of checked choice to validate', () => {
    fixture.choices = [
      { name: '1', checked: true },
      { name: '2', checked: 1 },
      { name: '3', checked: false },
    ];
    fixture.validate = function (answer) {
      expect(answer).toEqual(['1', '2']);
      return true;
    };

    checkbox = new Checkbox(fixture, rl);
    const promise = checkbox.run();
    rl.emit('line');
    return promise;
  });

  it('should check defaults choices if given as array of values', () =>
    new Promise((done) => {
      fixture.choices = [{ name: '1' }, { name: '2' }, { name: '3' }];
      fixture.default = ['1', '3'];
      checkbox = new Checkbox(fixture, rl);
      checkbox.run().then((answer) => {
        expect(answer.length).toEqual(2);
        expect(answer[0]).toEqual('1');
        expect(answer[1]).toEqual('3');
        done();
      });
      rl.emit('line');
    }));

  it('should toggle choice when hitting space', () =>
    new Promise((done) => {
      checkbox.run().then((answer) => {
        expect(answer.length).toEqual(1);
        expect(answer[0]).toEqual('choice 1');
        done();
      });
      rl.input.emit('keypress', ' ', { name: 'space' });
      rl.input.emit('keypress', null, { name: 'down' });
      rl.input.emit('keypress', ' ', { name: 'space' });
      rl.input.emit('keypress', ' ', { name: 'space' });
      rl.emit('line');
    }));

  it('should allow for arrow navigation', () =>
    new Promise((done) => {
      checkbox.run().then((answer) => {
        expect(answer.length).toEqual(1);
        expect(answer[0]).toEqual('choice 2');
        done();
      });

      rl.input.emit('keypress', null, { name: 'down' });
      rl.input.emit('keypress', null, { name: 'down' });
      rl.input.emit('keypress', null, { name: 'up' });

      rl.input.emit('keypress', ' ', { name: 'space' });
      rl.emit('line');
    }));

  it('should allow for vi-style navigation', () =>
    new Promise((done) => {
      checkbox.run().then((answer) => {
        expect(answer.length).toEqual(1);
        expect(answer[0]).toEqual('choice 2');
        done();
      });

      rl.input.emit('keypress', 'j', { name: 'j' });
      rl.input.emit('keypress', 'j', { name: 'j' });
      rl.input.emit('keypress', 'k', { name: 'k' });

      rl.input.emit('keypress', ' ', { name: 'space' });
      rl.emit('line');
    }));

  it('should allow for emacs-style navigation', () =>
    new Promise((done) => {
      checkbox.run().then((answer) => {
        expect(answer.length).toEqual(1);
        expect(answer[0]).toEqual('choice 2');
        done();
      });

      rl.input.emit('keypress', 'n', { name: 'n', ctrl: true });
      rl.input.emit('keypress', 'n', { name: 'n', ctrl: true });
      rl.input.emit('keypress', 'p', { name: 'p', ctrl: true });

      rl.input.emit('keypress', ' ', { name: 'space' });
      rl.emit('line');
    }));

  it('should allow 1-9 shortcut key', () =>
    new Promise((done) => {
      checkbox.run().then((answer) => {
        expect(answer.length).toEqual(1);
        expect(answer[0]).toEqual('choice 2');
        done();
      });

      rl.input.emit('keypress', '2');
      rl.emit('line');
    }));

  it('should select all answers if <a> is pressed', () => {
    const promise = checkbox.run();

    rl.input.emit('keypress', 'a', { name: 'a' });
    rl.emit('line');

    return promise.then((answer) => {
      expect(answer.length).toEqual(3);
    });
  });

  it('should select no answers if <a> is pressed a second time', () => {
    const promise = checkbox.run();

    rl.input.emit('keypress', 'a', { name: 'a' });
    rl.input.emit('keypress', 'a', { name: 'a' });
    rl.emit('line');

    return promise.then((answer) => {
      expect(answer.length).toEqual(0);
    });
  });

  it('should select the inverse of the current selection when <i> is pressed', () => {
    const promise = checkbox.run();

    rl.input.emit('keypress', 'i', { name: 'i' });
    rl.emit('line');

    return promise.then((answer) => {
      expect(answer.length).toEqual(3);
    });
  });

  it('pagination works with multiline choices', () =>
    new Promise((done) => {
      const multilineFixture = {
        message: 'message',
        name: 'name',
        choices: ['a\n\n', 'b\n\n'],
      };
      const list = new Checkbox(multilineFixture, rl);
      const spy = vi.spyOn(list.paginator, 'paginate');
      list.run().then((answer) => {
        const realIndexPosition1 = spy.mock.calls[0][1];
        const realIndexPosition2 = spy.mock.calls[1][1];

        // 'a\n\n': 0th index, but pagination at 2nd index position due to 2 extra newlines
        expect(realIndexPosition1).toEqual(2);
        // 'b\n\n': 1st index, but pagination at 5th index position due to 4 extra newlines
        expect(realIndexPosition2).toEqual(5);
        expect(answer[0]).toEqual('b\n\n');
        done();
      });
      rl.input.emit('keypress', '', { name: 'down' });
      rl.input.emit('keypress', ' ', { name: 'space' });
      rl.emit('line');
    }));

  describe('with disabled choices', () => {
    beforeEach(() => {
      fixture.choices.push({
        name: 'dis1',
        disabled: true,
      });
      fixture.choices.push({
        name: 'dis2',
        disabled: 'uh oh',
      });
      checkbox = new Checkbox(fixture, rl);
    });

    it('output disabled choices and custom messages', () => {
      const promise = checkbox.run();
      rl.emit('line');
      return promise.then(() => {
        expect(rl.output.__raw__).toContain('- dis1 (Disabled)');
        expect(rl.output.__raw__).toContain('- dis2 (uh oh)');
      });
    });

    it('skip disabled choices', () =>
      new Promise((done) => {
        checkbox.run().then((answer) => {
          expect(answer[0]).toEqual('choice 1');
          done();
        });
        rl.input.emit('keypress', null, { name: 'down' });
        rl.input.emit('keypress', null, { name: 'down' });
        rl.input.emit('keypress', null, { name: 'down' });

        rl.input.emit('keypress', ' ', { name: 'space' });
        rl.emit('line');
      }));

    it("uncheck defaults choices who're disabled", () =>
      new Promise((done) => {
        fixture.choices = [{ name: '1', checked: true, disabled: true }, { name: '2' }];
        checkbox = new Checkbox(fixture, rl);
        checkbox.run().then((answer) => {
          expect(answer.length).toEqual(0);
          done();
        });
        rl.emit('line');
      }));

    it('disabled can be a function', () => {
      fixture.choices = [
        {
          name: 'dis1',
          disabled(answers) {
            expect(answers.foo).toEqual('foo');
            return true;
          },
        },
      ];
      checkbox = new Checkbox(fixture, rl, { foo: 'foo' });
      const promise = checkbox.run();
      rl.emit('line');

      promise.then(() => {
        expect(rl.output.__raw__).toContain('- dis1 (Disabled)');
      });
    });
  });

  describe('going out of boundaries', () => {
    describe('when loop undefined / true', () => {
      it('loops to bottom when too far up', async () => {
        const promise = checkbox.run();

        rl.input.emit('keypress', null, { name: 'up' });
        rl.input.emit('keypress', null, { name: 'up' });

        rl.input.emit('keypress', ' ', { name: 'space' });
        rl.emit('line');

        const answer = await promise;
        expect(answer.length).toEqual(1);
        expect(answer[0]).toEqual('choice 2');
      });
      it('loops to top when too far down', async () => {
        const promise = checkbox.run();

        rl.input.emit('keypress', null, { name: 'down' });
        rl.input.emit('keypress', null, { name: 'down' });
        rl.input.emit('keypress', null, { name: 'down' });

        rl.input.emit('keypress', ' ', { name: 'space' });
        rl.emit('line');

        const answer = await promise;
        expect(answer.length).toEqual(1);
        expect(answer[0]).toEqual('choice 1');
      });
    });

    describe('when loop: false', () => {
      beforeEach(() => {
        checkbox = new Checkbox(Object.assign(fixture, { loop: false }), rl);
      });
      it('stays at top when too far up', async () => {
        const promise = checkbox.run();

        rl.input.emit('keypress', null, { name: 'up' });
        rl.input.emit('keypress', null, { name: 'up' });

        rl.input.emit('keypress', ' ', { name: 'space' });
        rl.emit('line');

        const answer = await promise;
        expect(answer.length).toEqual(1);
        expect(answer[0]).toEqual('choice 1');
      });
      it('stays at bottom when too far down', async () => {
        const promise = checkbox.run();

        rl.input.emit('keypress', null, { name: 'down' });
        rl.input.emit('keypress', null, { name: 'down' });
        rl.input.emit('keypress', null, { name: 'down' });

        rl.input.emit('keypress', ' ', { name: 'space' });
        rl.emit('line');

        const answer = await promise;
        expect(answer.length).toEqual(1);
        expect(answer[0]).toEqual('choice 3');
      });
    });
  });
});
