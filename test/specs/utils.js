var expect = require("chai").expect;
var sinon = require("sinon");
var utils = require("../../lib/utils/utils");

describe("normalizeChoices", function() {

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
