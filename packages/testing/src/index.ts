const logStore: Array<Parameters<typeof console.log>> = [];

beforeEach(() => {
  logStore.length = 0;
});

afterEach(() => {
  logStore.forEach((...line) => console.log(...line));
});

export function log(...line: Parameters<typeof console.log>) {
  logStore.push(line);
}
