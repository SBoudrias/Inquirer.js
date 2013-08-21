var expect = require("chai").expect;
var sinon = require("sinon");

var utils = require("../../lib/utils/utils");
var inquirer = require("../../lib/inquirer");
var Choice = require("../../lib/objects/choice");

describe("normalizeChoices", function() {

  it("should create Choice object from array member", function() {
    var result = utils.normalizeChoices([ "bar", { name: "foo" } ]);
    expect( result[0] ).to.be.instanceOf( Choice );
    expect( result[1] ).to.be.instanceOf( Choice );
  });

  it("should not process Separator object", function() {
    var sep = new inquirer.Separator();
    var result = utils.normalizeChoices([ "Bar", sep ]);
    expect( result[0].name ).to.equal("Bar");
    expect( result[1] ).to.equal( sep );
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
