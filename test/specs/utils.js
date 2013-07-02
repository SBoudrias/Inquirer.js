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

  it("should keep extra keys", function() {
    var initial = [{ name: "foo", extra: "1" }, { name: "bar", key: "z" }];
    var normalized = utils.normalizeChoices(initial);
    expect(normalized).to.eql([{
      name: "foo",
      value: "foo",
      extra: "1"
    }, {
      name: "bar",
      value: "bar",
      key: "z"
    }]);
  });
});

describe("runAsync", function() {

  it("should run synchronous functions", function( done ) {
    var aFunc = function() {
      return "pass1";
    };
    utils.runAsync(aFunc, function( val ) {
      expect(val).to.equal("pass1");
      done();
    });
  });

  it("should run synchronous functions", function( done ) {
    var aFunc = function() {
      var returns = this.async();
      returns("pass2");
    };
    utils.runAsync(aFunc, function( val ) {
      expect(val).to.equal("pass2");
      done();
    });
  });

  it("should pass single argument", function( done ) {
    var aFunc = function( val ) {
      expect(val).to.equal("a");
      done();
    };
    utils.runAsync(aFunc, function() {}, "a");
  });

  it("should apply multiple arguments", function( done ) {
    var aFunc = function( val, val2 ) {
      expect(val).to.equal("a");
      expect(val2).to.equal("b");
      done();
    };
    utils.runAsync(aFunc, function() {}, "a", "b");
  });

});
