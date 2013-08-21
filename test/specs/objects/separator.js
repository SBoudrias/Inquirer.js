var expect = require("chai").expect;
var sinon = require("sinon");
var ReadlineStub = require("../../helpers/readline");

var Separator = require("../../../lib/objects/separator");
var Inquirer = require("../../../lib/inquirer");

describe("Separator constructor", function() {

  it("should set a default", function() {
    var sep = new Separator();
    expect( sep.toString() ).to.equal("--------");
  });

  it("should set user input as separator", function() {
    var sep = new Separator("foo bar");
    expect( sep.toString() ).to.equal("foo bar");
  });

  it("instances should be stringified when appended to a string", function() {
    var sep = new Separator("foo bar");
    expect( sep + "" ).to.equal("foo bar");
  });

  it("should be exposed on Inquirer object", function() {
    expect( Inquirer.Separator ).to.equal( Separator );
  });

  it("should expose a helper function to check for separator", function() {
    expect( Separator.exclude({}) ).to.be.true;
    expect( Separator.exclude(new Separator()) ).to.be.false;
  });

});
