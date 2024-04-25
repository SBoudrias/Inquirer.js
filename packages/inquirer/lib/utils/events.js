import { fromEvent, filter, map, share, takeUntil } from 'rxjs';

function normalizeKeypressEvents(value, key) {
  return { value, key: key || {} };
}

export default function observe(rl) {
  const keypress = fromEvent(rl.input, 'keypress', normalizeKeypressEvents)
    .pipe(takeUntil(fromEvent(rl, 'close')))
    // Ignore `enter` key. On the readline, we only care about the `line` event.
    .pipe(filter(({ key }) => key.name !== 'enter' && key.name !== 'return'));

  return {
    line: fromEvent(rl, 'line'),
    keypress,

    normalizedUpKey: keypress.pipe(
      filter(
        ({ key }) =>
          key.name === 'up' || key.name === 'k' || (key.name === 'p' && key.ctrl),
      ),
      share(),
    ),

    normalizedDownKey: keypress.pipe(
      filter(
        ({ key }) =>
          key.name === 'down' || key.name === 'j' || (key.name === 'n' && key.ctrl),
      ),
      share(),
    ),

    numberKey: keypress.pipe(
      filter((e) => e.value && '123456789'.includes(e.value)),
      map((e) => Number(e.value)),
      share(),
    ),

    spaceKey: keypress.pipe(
      filter(({ key }) => key && key.name === 'space'),
      share(),
    ),
    aKey: keypress.pipe(
      filter(({ key }) => key && key.name === 'a'),
      share(),
    ),
    iKey: keypress.pipe(
      filter(({ key }) => key && key.name === 'i'),
      share(),
    ),
  };
}
