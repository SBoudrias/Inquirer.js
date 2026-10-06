/**
 * Observable utility public API test
 */

import { describe, it, expect } from 'vitest';
import { Subject } from 'rxjs';
import {
  EMPTY,
  createObservableController,
  isObservableLike,
  observableToAsyncIterable,
} from './observable.ts';
import type { Observable, Observer, SubscriptionLike } from './observable.ts';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function captureUncaughtError(trigger: () => void): Promise<unknown> {
  return new Promise((resolve) => {
    const handler = (error: unknown) => {
      process.removeListener('uncaughtException', handler);
      resolve(error);
    };
    process.on('uncaughtException', handler);
    trigger();
  });
}

type ManualSource = {
  source: Observable<string>;
  emitNext: (value: string) => void;
  emitError: (error: unknown) => void;
  emitComplete: () => void;
  unsubscribeCount: () => number;
};

function createManualSource(): ManualSource {
  const subject = new Subject<string>();
  let unsubscribed = 0;

  const source: Observable<string> = {
    subscribe: (observerOrNext) => {
      const observer: Observer<string> =
        typeof observerOrNext === 'function'
          ? { next: observerOrNext }
          : (observerOrNext ?? {});
      const subscription = subject.subscribe(observer);
      return {
        unsubscribe: () => {
          unsubscribed += 1;
          subscription.unsubscribe();
        },
      };
    },
  };

  return {
    source,
    emitNext: (value: string) => {
      subject.next(value);
    },
    emitError: (error: unknown) => {
      subject.error(error);
    },
    emitComplete: () => {
      subject.complete();
    },
    unsubscribeCount: () => unsubscribed,
  };
}

type LeakySource = {
  source: Observable<string>;
  emitNext: (value: string) => void;
  emitError: (error: unknown) => void;
  emitComplete: () => void;
};

// A source that keeps emitting to a subscriber even after it unsubscribed,
// the way a misbehaving observable would.
function createLeakySource(): LeakySource {
  let observer: Observer<string> | undefined;

  const source: Observable<string> = {
    subscribe: (observerOrNext) => {
      observer =
        typeof observerOrNext === 'function'
          ? { next: observerOrNext }
          : (observerOrNext ?? {});
      return { unsubscribe: () => {} };
    },
  };

  return {
    source,
    emitNext: (value) => {
      observer?.next?.(value);
    },
    emitError: (error) => {
      observer?.error?.(error);
    },
    emitComplete: () => {
      observer?.complete?.();
    },
  };
}

describe('createObservableController', () => {
  it('delivers values to every active subscriber', () => {
    const controller = createObservableController<string>();
    const first: string[] = [];
    const second: string[] = [];

    const subscriptionOne = controller.observable.subscribe((value) => first.push(value));
    controller.observable.subscribe({
      next: (value) => second.push(value),
    });

    controller.next('a');
    controller.next('b');

    expect(first).toEqual(['a', 'b']);
    expect(second).toEqual(['a', 'b']);

    subscriptionOne.unsubscribe();
    controller.next('c');

    expect(first).toEqual(['a', 'b']);
    expect(second).toEqual(['a', 'b', 'c']);
  });

  it('supports positional next, error and complete handlers', () => {
    const events: string[] = [];

    const completing = createObservableController<string>();
    completing.observable.subscribe(
      (value) => events.push(`next:${value}`),
      (error) => events.push(`error:${errorMessage(error)}`),
      () => events.push('complete'),
    );
    completing.next('a');
    completing.complete();

    const failing = createObservableController<string>();
    failing.observable.subscribe(
      (value) => events.push(`next:${value}`),
      (error) => events.push(`error:${errorMessage(error)}`),
      () => events.push('complete'),
    );
    failing.next('b');
    failing.error(new Error('boom'));

    expect(events).toEqual(['next:a', 'complete', 'next:b', 'error:boom']);
  });

  it('tolerates subscribing without any observer', () => {
    const controller = createObservableController<string>();
    const subscription = controller.observable.subscribe();

    controller.next('nobody is listening');
    controller.complete();

    expect(subscription.closed).toBe(true);
  });

  it('stops delivery once unsubscribed and ignores repeated unsubscribe', () => {
    const controller = createObservableController<string>();
    const values: string[] = [];
    const subscription = controller.observable.subscribe((value) => values.push(value));

    expect(subscription.closed).toBe(false);

    subscription.unsubscribe();
    subscription.unsubscribe();

    controller.next('a');
    controller.complete();
    controller.error(new Error('boom'));

    expect(values).toEqual([]);
    expect(subscription.closed).toBe(true);
  });

  it('notifies subscribers on completion and drops later emissions', () => {
    const controller = createObservableController<string>();
    const events: string[] = [];
    const subscription = controller.observable.subscribe({
      next: (value) => events.push(value),
      complete: () => events.push('complete'),
    });

    controller.next('a');
    controller.complete();
    controller.next('b');
    controller.error(new Error('boom'));

    expect(events).toEqual(['a', 'complete']);
    expect(subscription.closed).toBe(true);

    const lateEvents: string[] = [];
    const late = controller.observable.subscribe({
      complete: () => lateEvents.push('complete'),
    });
    controller.next('c');

    expect(lateEvents).toEqual(['complete']);
    expect(late.closed).toBe(true);
  });

  it('notifies subscribers of errors and drops later emissions', () => {
    const controller = createObservableController<string>();
    const failure = new Error('boom');
    const events: string[] = [];
    const subscription = controller.observable.subscribe({
      next: (value) => events.push(value),
      error: (error) => events.push(`error:${errorMessage(error)}`),
    });

    controller.next('a');
    controller.error(failure);
    controller.next('b');
    controller.complete();

    expect(events).toEqual(['a', 'error:boom']);
    expect(subscription.closed).toBe(true);

    const lateErrors: unknown[] = [];
    const late = controller.observable.subscribe({
      error: (error) => lateErrors.push(error),
    });

    expect(lateErrors).toEqual([failure]);
    expect(late.closed).toBe(true);
  });

  it('reports errors thrown by observer handlers instead of failing the controller', async () => {
    const nextFailure = await captureUncaughtError(() => {
      const controller = createObservableController<string>();
      controller.observable.subscribe({
        next: () => {
          throw new Error('next blew up');
        },
      });
      controller.next('a');
    });
    expect(nextFailure).toMatchObject({ message: 'next blew up' });

    const errorFailure = await captureUncaughtError(() => {
      const controller = createObservableController<string>();
      controller.observable.subscribe({
        error: () => {
          throw new Error('error blew up');
        },
      });
      controller.error(new Error('boom'));
    });
    expect(errorFailure).toMatchObject({ message: 'error blew up' });

    const completeFailure = await captureUncaughtError(() => {
      const controller = createObservableController<string>();
      controller.observable.subscribe({
        complete: () => {
          throw new Error('complete blew up');
        },
      });
      controller.complete();
    });
    expect(completeFailure).toMatchObject({ message: 'complete blew up' });
  });

  it('reports unhandled source errors when no error handler is subscribed', async () => {
    const failure = await captureUncaughtError(() => {
      const controller = createObservableController<string>();
      controller.observable.subscribe({ next: () => {} });
      controller.error(new Error('nobody is listening'));
    });
    expect(failure).toMatchObject({ message: 'nobody is listening' });
  });

  it('exposes itself through observable interop symbols', () => {
    const controller = createObservableController<string>();
    expect(controller.observable['@@observable']()).toBe(controller.observable);

    const originalDescriptor = Object.getOwnPropertyDescriptor(Symbol, 'observable');
    Object.defineProperty(Symbol, 'observable', {
      value: Symbol('observable'),
      configurable: true,
    });

    try {
      const withSymbol = createObservableController<string>();
      expect(withSymbol.observable[Symbol.observable]()).toBe(withSymbol.observable);
      // With the symbol present, the constructor no longer overwrites the
      // class-field '@@observable' interop accessor.
      expect(withSymbol.observable['@@observable']()).toBe(withSymbol.observable);
    } finally {
      if (originalDescriptor) {
        Object.defineProperty(Symbol, 'observable', originalDescriptor);
      } else {
        Reflect.deleteProperty(Symbol, 'observable');
      }
    }
  });
});

describe('EMPTY', () => {
  it('completes new subscribers immediately with a closed subscription', () => {
    const events: string[] = [];
    const subscription = EMPTY.subscribe({
      complete: () => events.push('complete'),
    });

    expect(events).toEqual(['complete']);
    expect(subscription.closed).toBe(true);
  });

  it('yields no values when consumed as an async iterable', async () => {
    const values: unknown[] = [];
    for await (const value of EMPTY) {
      values.push(value);
    }
    expect(values).toEqual([]);
  });
});

describe('isObservableLike', () => {
  it('recognizes observables exposing a subscribe function', () => {
    expect(isObservableLike(new Subject())).toBe(true);
    expect(
      isObservableLike({
        subscribe: () => ({ unsubscribe: () => {} }),
      }),
    ).toBe(true);
  });

  it('rejects values that do not expose a subscribe function', () => {
    expect(isObservableLike(null)).toBe(false);
    expect(isObservableLike('observable')).toBe(false);
    expect(isObservableLike(42)).toBe(false);
    expect(isObservableLike({})).toBe(false);
    expect(isObservableLike({ subscribe: 'nope' })).toBe(false);
  });
});

describe('observableToAsyncIterable', () => {
  it('yields buffered and live values, then ends on completion', async () => {
    const controller = createObservableController<number>();
    const iterator = observableToAsyncIterable(controller.observable)[
      Symbol.asyncIterator
    ]();

    controller.next(1);
    controller.next(2);

    expect(await iterator.next()).toEqual({ done: false, value: 1 });
    expect(await iterator.next()).toEqual({ done: false, value: 2 });

    const pending = iterator.next();
    controller.next(3);
    expect(await pending).toEqual({ done: false, value: 3 });

    controller.complete();
    expect(await iterator.next()).toEqual({ done: true, value: undefined });
    expect(await iterator.next()).toEqual({ done: true, value: undefined });
  });

  it('supports async iteration directly on the observable', async () => {
    const controller = createObservableController<string>();
    const values: string[] = [];
    const iteration = (async () => {
      for await (const value of controller.observable) {
        values.push(value);
      }
    })();

    controller.next('a');
    controller.next('b');
    controller.complete();

    await iteration;
    expect(values).toEqual(['a', 'b']);
  });

  it('rejects pending iterations when the source errors', async () => {
    const controller = createObservableController<string>();
    const iterator = observableToAsyncIterable(controller.observable)[
      Symbol.asyncIterator
    ]();

    const pending = iterator.next();
    const failure = new Error('boom');
    controller.error(failure);

    await expect(pending).rejects.toBe(failure);
    await expect(iterator.next()).rejects.toBe(failure);
  });

  it('wraps non-Error failures in an Error when rejecting', async () => {
    const controller = createObservableController<string>();
    const iterator = controller.observable[Symbol.asyncIterator]();

    controller.error('just a string');

    await expect(iterator.next()).rejects.toMatchObject({
      message: 'just a string',
    });
  });

  it('resolves concurrent pending iterations on completion', async () => {
    const controller = createObservableController<string>();
    const iterator = observableToAsyncIterable(controller.observable)[
      Symbol.asyncIterator
    ]();

    const first = iterator.next();
    const second = iterator.next();
    controller.complete();

    expect(await first).toEqual({ done: true, value: undefined });
    expect(await second).toEqual({ done: true, value: undefined });
  });

  it('unsubscribes from the source when the consumer stops iterating early', async () => {
    const manual = createManualSource();
    const values: string[] = [];
    const iteration = (async () => {
      for await (const value of observableToAsyncIterable(manual.source)) {
        values.push(value);
        break;
      }
    })();

    manual.emitNext('a');
    await iteration;

    expect(values).toEqual(['a']);
    expect(manual.unsubscribeCount()).toBe(1);
  });

  it('ignores values and completion arriving after an error', async () => {
    const leaky = createLeakySource();
    const iterator = observableToAsyncIterable(leaky.source)[Symbol.asyncIterator]();

    const pending = iterator.next();
    leaky.emitNext('a');
    leaky.emitError(new Error('boom'));
    leaky.emitNext('late');
    leaky.emitComplete();

    expect(await pending).toEqual({ done: false, value: 'a' });
    await expect(iterator.next()).rejects.toMatchObject({ message: 'boom' });
  });

  it('ignores errors arriving after completion', async () => {
    const leaky = createLeakySource();
    const iterator = observableToAsyncIterable(leaky.source)[Symbol.asyncIterator]();

    const pending = iterator.next();
    leaky.emitNext('a');
    leaky.emitComplete();
    leaky.emitError(new Error('too late'));

    expect(await pending).toEqual({ done: false, value: 'a' });
    expect(await iterator.next()).toEqual({ done: true, value: undefined });
  });

  it('rejects iteration when the source throws while subscribing', async () => {
    const failure = new Error('subscribe blew up');
    const source: Observable<string> = {
      subscribe(): SubscriptionLike {
        throw failure;
      },
    };

    const iterator = observableToAsyncIterable(source)[Symbol.asyncIterator]();

    await expect(iterator.next()).rejects.toBe(failure);
    await expect(iterator.next()).rejects.toBe(failure);
  });
});
