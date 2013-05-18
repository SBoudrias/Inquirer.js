var expect = require("chai").expect;
var sinon = require("sinon");
var proxyquire = require("proxyquire");

function makeCharmStub() {

  var stub = {};
  stub.up = sinon.stub().returns(stub);
  stub.erase = sinon.stub().returns(stub);

  return function() {
    return stub;
  };
}


describe("cleanLine", function() {

  beforeEach(function() {
    this.charmStub = makeCharmStub();

    this.utils = proxyquire("../lib/utils/utils", {
      "charm": this.charmStub
    });

  });

  it("should clean `n` number of line", function() {
    this.utils.cleanLine(10);
    expect(this.charmStub().erase.callCount).to.equal(10);
    expect(this.charmStub().up.callCount).to.equal(9);
  });

  it("should clean 1 line by default", function() {
    this.utils.cleanLine();
    expect(this.charmStub().erase.callCount).to.equal(1);
  });
});

describe("normalizeChoices", function() {

  var utils = require("../lib/utils/utils");

  it("should normalize array containing strings", function() {
    var initial = [ "foo", "bar" ];
    var normalized = utils.normalizeChoices(initial);
    expect(normalized).to.eql([{
      name: "foo",
      value: "foo"
    }, {
      name: "bar",
      value: "bar"
    }]);
  });
});
