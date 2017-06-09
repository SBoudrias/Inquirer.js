var expect = require('chai').expect;
var _ = require('lodash');
var ReadlineStub = require('../../helpers/readline');
var fixtures = require('../../helpers/fixtures');

require('datejs');
var DateTime = require('../../../lib/prompts/datetime');

describe('`datetime` prompt', function () {
  beforeEach(function () {
    this.fixture = _.clone(fixtures.datetime);
    this.rl = new ReadlineStub();
    this.datetime = new DateTime(this.fixture, this.rl);
  });

  it('should output a valid date', function (done) {
    this.datetime.run().then(function (answer) {
      expect(answer).to.be.a('Date');
      expect(answer.equals(Date.parse('1/1/2000 5:00PM'))).to.be.true;
      done();
    });

    this.rl.emit('line');
  });
});
