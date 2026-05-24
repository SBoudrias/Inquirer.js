type NextHandler<T> = (value: T) => void;
type ErrorHandler = (error: unknown) => void;
type CompleteHandler = () => void;
type TeardownLogic = void | (() => void) | SubscriptionLike;

declare global {
  interface SymbolConstructor {
    readonly observable: symbol;
  }
}

export type Observer<T> = {
  next?: NextHandler<T>;
  error?: ErrorHandler;
  complete?: CompleteHandler;
};

export type SubscriptionLike = {
  closed?: boolean;
  unsubscribe: () => void;
};

export type Observable<T> = {
  subscribe: {
    (observer: Observer<T>): SubscriptionLike;
    (
      next?: NextHandler<T> | null,
      error?: ErrorHandler | null,
      complete?: CompleteHandler | null,
    ): SubscriptionLike;
  };
};

export type InteropObservable<T> = Observable<T> &
  AsyncIterable<T> & {
    readonly [Symbol.observable]: () => Observable<T>;
    readonly '@@observable': () => Observable<T>;
  };

type ObservableController<T> = {
  observable: InteropObservable<T>;
  next: (value: T) => void;
  error: (error: unknown) => void;
  complete: () => void;
};

type ObserverEntry<T> = {
  observer: Observer<T>;
  subscription: SubscriptionLike & { closed: boolean };
};

type PendingIterator<T> = {
  resolve: (result: IteratorResult<T>) => void;
  reject: (error: unknown) => void;
};

type QueueItem<T> = { value: T };

function getObservableSymbol(): symbol | '@@observable' {
  const symbolConstructor = Symbol as SymbolConstructor & {
    observable?: symbol;
  };

  return typeof symbolConstructor.observable === 'symbol'
    ? symbolConstructor.observable
    : '@@observable';
}

function normalizeObserver<T>(
  observerOrNext?: Observer<T> | NextHandler<T> | null,
  error?: ErrorHandler | null,
  complete?: CompleteHandler | null,
): Observer<T> {
  if (typeof observerOrNext === 'function') {
    return {
      next: observerOrNext,
      ...(error ? { error } : {}),
      ...(complete ? { complete } : {}),
    };
  }

  return observerOrNext ?? {};
}

function reportObserverError(error: unknown) {
  queueMicrotask(() => {
    throw error;
  });
}

function callObserver(callback: () => void) {
  try {
    callback();
  } catch (error: unknown) {
    reportObserverError(error);
  }
}

function createClosedSubscription(): SubscriptionLike & { closed: boolean } {
  return {
    closed: true,
    unsubscribe() {},
  };
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function runTeardown(teardown: TeardownLogic) {
  if (typeof teardown === 'function') {
    teardown();
  } else {
    teardown?.unsubscribe();
  }
}

class ObservableImpl<T> implements InteropObservable<T> {
  readonly '@@observable' = () => this;
  declare readonly [Symbol.observable]: () => Observable<T>;
  private subscribeFn: (observer: Observer<T>) => TeardownLogic;

  constructor(subscribeFn: (observer: Observer<T>) => TeardownLogic) {
    this.subscribeFn = subscribeFn;
    Object.defineProperty(this, getObservableSymbol(), {
      configurable: true,
      value: () => this,
    });
  }

  subscribe(
    observerOrNext?: Observer<T> | NextHandler<T> | null,
    error?: ErrorHandler | null,
    complete?: CompleteHandler | null,
  ): SubscriptionLike {
    const observer = normalizeObserver(observerOrNext, error, complete);
    let closed = false;
    let teardown: TeardownLogic;
    let teardownReady = false;

    const subscription = {
      get closed() {
        return closed;
      },
      unsubscribe() {
        if (closed) {
          return;
        }

        closed = true;
        if (teardownReady) {
          runTeardown(teardown);
        }
      },
    };

    const safeObserver: Observer<T> = {
      next(value) {
        if (!closed) {
          callObserver(() => observer.next?.(value));
        }
      },
      error(error) {
        if (closed) {
          return;
        }

        closed = true;
        if (observer.error) {
          callObserver(() => observer.error?.(error));
        } else {
          reportObserverError(error);
        }

        if (teardownReady) {
          runTeardown(teardown);
        }
      },
      complete() {
        if (closed) {
          return;
        }

        closed = true;
        callObserver(() => observer.complete?.());

        if (teardownReady) {
          runTeardown(teardown);
        }
      },
    };

    try {
      teardown = this.subscribeFn(safeObserver);
      teardownReady = true;
      if (subscription.closed) {
        runTeardown(teardown);
      }
    } catch (error: unknown) {
      safeObserver.error?.(error);
    }

    return subscription;
  }

  [Symbol.asyncIterator](): AsyncIterator<T> {
    return observableToAsyncIterable(this)[Symbol.asyncIterator]();
  }
}

export const EMPTY: InteropObservable<never> = new ObservableImpl<never>((observer) => {
  observer.complete?.();
  return createClosedSubscription();
});

export function createObservableController<T>(): ObservableController<T> {
  const observers = new Set<ObserverEntry<T>>();
  let completed = false;
  let errored = false;
  let thrownError: unknown;

  const observable = new ObservableImpl<T>((observer) => {
    if (errored) {
      observer.error?.(thrownError);
      return createClosedSubscription();
    }

    if (completed) {
      observer.complete?.();
      return createClosedSubscription();
    }

    const entry: ObserverEntry<T> = {
      observer,
      subscription: {
        closed: false,
        unsubscribe() {
          entry.subscription.closed = true;
          observers.delete(entry);
        },
      },
    };
    observers.add(entry);

    return entry.subscription;
  });

  return {
    observable,
    next(value) {
      if (completed || errored) {
        return;
      }

      for (const { observer, subscription } of observers) {
        if (!subscription.closed) {
          callObserver(() => observer.next?.(value));
        }
      }
    },
    error(error) {
      if (completed || errored) {
        return;
      }

      errored = true;
      thrownError = error;
      for (const { observer, subscription } of observers) {
        subscription.closed = true;
        callObserver(() => observer.error?.(error));
      }
      observers.clear();
    },
    complete() {
      if (completed || errored) {
        return;
      }

      completed = true;
      for (const { observer, subscription } of observers) {
        subscription.closed = true;
        callObserver(() => observer.complete?.());
      }
      observers.clear();
    },
  };
}

type ObservableValue<T> = T extends Observable<infer Value> ? Value : never;

export function isObservableLike<T>(
  value: T,
): value is T & Observable<ObservableValue<T>> {
  return (
    (typeof value === 'object' || typeof value === 'function') &&
    value != null &&
    'subscribe' in value &&
    typeof value.subscribe === 'function'
  );
}

export function observableToAsyncIterable<T>(source: Observable<T>): AsyncIterable<T> {
  return {
    [Symbol.asyncIterator](): AsyncIterator<T> {
      const values: Array<QueueItem<T>> = [];
      const pending: Array<PendingIterator<T>> = [];
      let completed = false;
      let errored = false;
      let thrownError: Error | undefined;
      let subscription: SubscriptionLike | undefined;

      const resolvePending = (result: IteratorResult<T>) => {
        while (pending.length > 0) {
          pending.shift()?.resolve(result);
        }
      };

      const rejectPending = (error: unknown) => {
        while (pending.length > 0) {
          pending.shift()?.reject(error);
        }
      };

      const iterator: AsyncIterator<T> = {
        next() {
          const item = values.shift();
          if (item) {
            return Promise.resolve({ done: false, value: item.value });
          }

          if (errored) {
            return Promise.reject(thrownError ?? new Error('Observable source failed'));
          }

          if (completed) {
            return Promise.resolve({ done: true, value: undefined });
          }

          return new Promise<IteratorResult<T>>((resolve, reject) => {
            pending.push({ resolve, reject });
          });
        },
        return() {
          completed = true;
          values.length = 0;
          subscription?.unsubscribe();
          resolvePending({ done: true, value: undefined });
          return Promise.resolve({ done: true, value: undefined });
        },
      };

      try {
        subscription = source.subscribe({
          next(value) {
            if (completed || errored) {
              return;
            }

            const pendingIterator = pending.shift();
            if (pendingIterator) {
              pendingIterator.resolve({ done: false, value });
              return;
            }

            values.push({ value });
          },
          error(error) {
            if (completed || errored) {
              return;
            }

            values.length = 0;
            errored = true;
            thrownError = toError(error);
            rejectPending(thrownError);
            subscription?.unsubscribe();
          },
          complete() {
            if (completed || errored) {
              return;
            }

            completed = true;
            resolvePending({ done: true, value: undefined });
          },
        });
      } catch (error: unknown) {
        values.length = 0;
        errored = true;
        thrownError = toError(error);
        rejectPending(thrownError);
      }

      return iterator;
    },
  };
}
