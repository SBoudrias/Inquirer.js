const { expect } = require('chai');
const _ = require('lodash');
const ReadlineStub = require('../../helpers/readline');
const fixtures = require('../../helpers/fixtures');

const Confirm = require('../../../lib/prompts/confirm');

describe('`confirm` prompt', () => {
  beforeEach(function () {
    this.fixture = _.clone(fixtures.confirm);
    this.rl = new ReadlineStub();
    this.confirm = new Confirm(this.fixture, this.rl);
  });

  afterEach(function () {
    Confirm.prototype.write = this._write;
  });

  it('should default to true', function (done) {
    this.confirm.run().then((answer) => {
      expect(this.rl.output.__raw__).to.contain('Y/n');
      expect(answer).to.equal(true);
      done();
    });

    this.rl.emit('line', '');
  });

  it('should allow a default `false` value', function (done) {
    this.fixture.default = false;
    const falseConfirm = new Confirm(this.fixture, this.rl);

    falseConfirm.run().then((answer) => {
      expect(this.rl.output.__raw__).to.contain('y/N');
      expect(answer).to.equal(false);
      done();
    });

    this.rl.emit('line', '');
  });

  it('should allow a default `true` value', function (done) {
    this.fixture.default = true;
    const falseConfirm = new Confirm(this.fixture, this.rl);

    falseConfirm.run().then((answer) => {
      expect(this.rl.output.__raw__).to.contain('Y/n');
      expect(answer).to.equal(true);
      done();
    });

    this.rl.emit('line', '');
  });

  it("should parse 'Y' value to boolean true", function (done) {
    this.confirm.run().then((answer) => {
      expect(answer).to.equal(true);
      done();
    });

    this.rl.emit('line', 'Y');
  });

  it("should parse 'Yes' value to boolean true", function (done) {
    this.confirm.run().then((answer) => {
      expect(answer).to.equal(true);
      done();
    });

    this.rl.emit('line', 'Yes');
  });

  it("should parse 'No' value to boolean false", function (done) {
    this.confirm.run().then((answer) => {
      expect(answer).to.equal(false);
      done();
    });

    this.rl.emit('line', 'No');
  });

  it('should parse every other string value to boolean false', function (done) {
    this.confirm.run().then((answer) => {
      expect(answer).to.equal(false);
      done();
    });

    this.rl.emit('line', 'bla bla foo');
  });
});
