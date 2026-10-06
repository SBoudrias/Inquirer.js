import { describe, expect, it } from 'vitest';
import { BufferedStream } from './buffered-stream.ts';

// A chunk with only ANSI codes or whitespace doesn't count as a render —
// the stream only records writes that produce visible characters.
const ANSI_ONLY_CHUNK = Buffer.from('\x1b[1G');

// A real render: writes visible text, emits a `render` event.
const VISIBLE_CHUNK = Buffer.from('? Question');

describe('BufferedStream', () => {
  it('renders only chunks containing visible text', () => {
    const stream = new BufferedStream();

    stream.write(ANSI_ONLY_CHUNK);
    expect(stream.writeCount).toBe(0);
    expect(stream.getLastChunk()).toBe('');

    stream.write(VISIBLE_CHUNK);
    expect(stream.writeCount).toBe(1);
    expect(stream.getLastChunk()).toBe('? Question');
  });

  it('emits a render event for visible chunks only', () => {
    const stream = new BufferedStream();
    const renders: number[] = [];
    stream.on('render', () => renders.push(stream.writeCount));

    stream.write(ANSI_ONLY_CHUNK);
    stream.write(VISIBLE_CHUNK);
    stream.write(ANSI_ONLY_CHUNK);

    expect(renders).toEqual([1]);
  });

  it('keeps ANSI-only chunks in the raw stream only', () => {
    const stream = new BufferedStream();

    // A visible render, then a trailing cursor move: the last raw chunk can
    // be ANSI-only while the last render still contains visible text.
    stream.write(VISIBLE_CHUNK);
    stream.write(ANSI_ONLY_CHUNK);

    expect(stream.getLastChunk({ raw: true })).toBe('\x1b[1G');
    expect(stream.getLastChunk()).toBe('? Question');
  });

  it('returns the full raw output, including non-render chunks', () => {
    const stream = new BufferedStream();

    stream.write(ANSI_ONLY_CHUNK);
    stream.write(VISIBLE_CHUNK);

    expect(stream.getFullOutput()).toBe('\x1b[1G? Question');
  });

  it('clear() resets the recorded output', () => {
    const stream = new BufferedStream();

    stream.write(VISIBLE_CHUNK);
    expect(stream.getFullOutput()).toBe('? Question');

    stream.clear();

    expect(stream.getFullOutput()).toBe('');
    expect(stream.getLastChunk()).toBe('');
    expect(stream.getLastChunk({ raw: true })).toBe('');
  });

  it('exposes a large column width so prompts are not hard-wrapped at 80 columns', () => {
    const stream = new BufferedStream();
    expect(stream.columns).toBe(10_000);
  });
});
