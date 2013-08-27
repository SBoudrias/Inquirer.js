var expect = require("chai").expect;
var sinon = require("sinon");

var utils = require("../../lib/utils/utils");

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
