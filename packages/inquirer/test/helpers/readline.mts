import { EventEmitter } from 'node:events';
import { inherits } from 'node:util';
import { vi } from 'vitest';

const stub = {};

Object.assign(stub, {
  write: vi.fn(() => stub),
  moveCursor: vi.fn(() => stub),
  setPrompt: vi.fn(() => stub),
  close: vi.fn(() => stub),
  pause: vi.fn(() => stub),
  resume: vi.fn(() => stub),
  getCursorPos: vi.fn(() => ({ cols: 0, rows: 0 })),
  output: {
    end: vi.fn(),
    mute: vi.fn(),
    unmute: vi.fn(),
    __raw__: '',
    write(str) {
      this.__raw__ += str;
    },
  },
});

const ReadlineStub = function (...args) {
  this.line = '';
  this.input = new EventEmitter();

  Reflect.apply(EventEmitter, this, args);
};

inherits(ReadlineStub, EventEmitter);
Object.assign(ReadlineStub.prototype, stub);

export default ReadlineStub;
