var expect = require("chai").expect;
var sinon = require("sinon");
var ReadlineStub = require("../../helpers/readline");

var inquirer = require("../../../lib/inquirer");
var Choices = require("../../../lib/objects/choices");
var Choice = require("../../../lib/objects/choice");

describe("Choices collection", function() {

  it("should create Choice object from array member", function() {
    var choices = new Choices([ "bar", { name: "foo" } ]);
    expect( choices.getChoice(0) ).to.be.instanceOf( Choice );
    expect( choices.getChoice(1) ).to.be.instanceOf( Choice );
  });

  it("should not process Separator object", function() {
    var sep = new inquirer.Separator();
    var choices = new Choices([ "Bar", sep ]);
    expect( choices.get(0).name ).to.equal("Bar");
    expect( choices.get(1) ).to.equal( sep );
  });

  it("should provide access to length information", function() {
    var choices = new Choices([ "Bar", new inquirer.Separator(), "foo" ]);
    expect( choices.length ).to.equal( 3 );
    expect( choices.realLength ).to.equal( 2 );

    choices.length = 1;
    expect( choices.length ).to.equal( 1 );
    expect( choices.get(1) ).to.not.exist;
    expect(function() { choices.realLength = 0; }).to.throw;
  });

  it("should allow plucking choice content", function() {
    var choices = new Choices([{ name: "n", key: "foo"}, { name: "a", key: "lab" }]);
    expect( choices.pluck("key") ).to.eql([ "foo", "lab" ]);
  });

  it("should allow filtering value with where", function() {
    var choices = new Choices([{ name: "n", key: "foo"}, { name: "a", key: "lab" }]);
    expect(choices.where({ key: "lab" })).to.eql([{ name: "a", value: "a", key: "lab" }]);
  });

  it("should façade forEach", function() {
    var raw = [ "a", "b", "c" ];
    var choices = new Choices( raw );
    choices.forEach(function( val, i ) {
      expect( val.name ).to.equal( raw[i] );
    });
  });

  it("should façade filter", function() {
    var choices = new Choices([ "a", "b", "c" ]);
    var filtered = choices.filter(function( val, i ) {
      return val.name === "a";
    });
    expect( filtered.length ).to.equal( 1 );
    expect( filtered[0].name ).to.equal("a");
  });

  it("should façade push and update the realChoices internally", function() {
    var choices = new Choices([ "a" ]);
    choices.push( "b", new inquirer.Separator() );
    expect( choices.length ).to.equal( 3 );
    expect( choices.realLength ).to.equal( 2 );
    expect( choices.getChoice(1) ).to.be.instanceOf( Choice );
    expect( choices.get(2) ).to.be.instanceOf( inquirer.Separator );
  });

});
