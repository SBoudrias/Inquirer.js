import { beforeEach, describe, it, expect } from 'vitest';
import Paginator from '../../../lib/utils/paginator.js';

const output = `\
a
b
c
d
e
f
g
h
i
j
k
l
m
n
o
p
q
r
s
t
u
v
w
x
y
z`;
const pageSize = 3;
const endIndex = output.split('\n').length - 1;
const getPage = (paginator, index) => {
  const lines = paginator.paginate(output, index, pageSize).split('\n');
  const lastLine = lines.pop();
  if (!lastLine.match(/Move up and down/)) {
    lines.push(lastLine);
  }
  return lines.join('\n');
};

describe('paginator', () => {
  let paginator;

  beforeEach(() => {
    paginator = new Paginator();
  });

  it('does nothing if output is smaller than page size', () => {
    expect(paginator.paginate(output, 0, endIndex + 1)).equal(output);
  });

  it('paginate returns slice of lines', () => {
    expect(getPage(paginator, 0)).equal(`\
a
b
c`);
  });
  it('slice has offset after later pages are rendered', () => {
    expect(getPage(paginator, 0)).equal(`\
a
b
c`);
    expect(getPage(paginator, 1)).equal(`\
a
b
c`);
    expect(getPage(paginator, 2)).equal(`\
b
c
d`);
  });
  it('slice offset does not reset', () => {
    expect(getPage(paginator, 2));
    expect(getPage(paginator, 0)).equal(`\
z
a
b`);
  });
  describe('non infinite mode', () => {
    beforeEach(() => {
      paginator = new Paginator(undefined, { isInfinite: false });
    });
    it('shows start for as long as possible', () => {
      expect(getPage(paginator, 0)).equal(`\
a
b
c`);
      expect(getPage(paginator, 1)).equal(`\
a
b
c`);
      expect(getPage(paginator, 2)).equal(`\
a
b
c`);
      expect(getPage(paginator, 3)).equal(`\
b
c
d`);
    });
    it('slice offset does reset', () => {
      getPage(paginator, 3);
      expect(getPage(paginator, 0)).equal(`\
a
b
c`);
    });
    it('aligns end to bottom', () => {
      expect(getPage(paginator, endIndex - 3)).equal(`\
u
v
w`);
      expect(getPage(paginator, endIndex - 2)).equal(`\
v
w
x`);
      expect(getPage(paginator, endIndex - 1)).equal(`\
w
x
y`);
      expect(getPage(paginator, endIndex)).equal(`\
x
y
z`);
    });
  });
});
