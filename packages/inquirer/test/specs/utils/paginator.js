const { expect } = require('chai');
const ReadlineStub = require('../../helpers/readline');
const Paginator = require('../../../lib/utils/paginator');

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
  beforeEach(function () {
    this.rl = new ReadlineStub();
    this.paginator = new Paginator();
  });

  it('does nothing if output is smaller than page size', function () {
    expect(this.paginator.paginate(output, 0, endIndex + 1)).equal(output);
  });

  it('paginate returns slice of lines', function () {
    expect(getPage(this.paginator, 0)).equal(`\
a
b
c`);
  });
  it('slice has offset after later pages are rendered', function () {
    expect(getPage(this.paginator, 0)).equal(`\
a
b
c`);
    expect(getPage(this.paginator, 1)).equal(`\
a
b
c`);
    expect(getPage(this.paginator, 2)).equal(`\
b
c
d`);
  });
  it('slice offset does not reset', function () {
    expect(getPage(this.paginator, 2));
    expect(getPage(this.paginator, 0)).equal(`\
z
a
b`);
  });
  describe('non infinite mode', () => {
    beforeEach(function () {
      this.paginator = new Paginator(undefined, { isInfinite: false });
    });
    it('shows start for as long as possible', function () {
      expect(getPage(this.paginator, 0)).equal(`\
a
b
c`);
      expect(getPage(this.paginator, 1)).equal(`\
a
b
c`);
      expect(getPage(this.paginator, 2)).equal(`\
a
b
c`);
      expect(getPage(this.paginator, 3)).equal(`\
b
c
d`);
    });
    it('slice offset does reset', function () {
      getPage(this.paginator, 3);
      expect(getPage(this.paginator, 0)).equal(`\
a
b
c`);
    });
    it('aligns end to bottom', function () {
      expect(getPage(this.paginator, endIndex - 3)).equal(`\
u
v
w`);
      expect(getPage(this.paginator, endIndex - 2)).equal(`\
v
w
x`);
      expect(getPage(this.paginator, endIndex - 1)).equal(`\
w
x
y`);
      expect(getPage(this.paginator, endIndex)).equal(`\
x
y
z`);
    });
  });
});
