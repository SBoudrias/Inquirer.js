var expect = require("chai").expect;
var sinon = require("sinon");
var ReadlineStub = require("../../helpers/readline");

var Separator = require("../../../lib/objects/separator");
var Inquirer = require("../../../lib/inquirer");

describe("Separator object", function() {

  it("should have a default", function() {
    var sep = new Separator();
    expect( sep.toString() ).to.equal("--------");
  });

  it("should use user input as separator", function() {
    var sep = new Separator("foo bar");
    expect( sep.toString() ).to.equal("foo bar");
  });

  it("should be transformed to string when appended to a string", function() {
    var sep = new Separator("foo bar");
    expect( sep + "" ).to.equal("foo bar");
  });

  it("should be exposed on Inquirer object", function() {
    expect( Inquirer.Separator ).to.equal( Separator );
  });

});
