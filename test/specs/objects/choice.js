var expect = require("chai").expect;
var sinon = require("sinon");
var ReadlineStub = require("../../helpers/readline");

var Choice = require("../../../lib/objects/choice");
var Separator = require("../../../lib/objects/separator");

describe("Choice object", function() {
  it("should normalize accept String as value", function() {
    var choice = new Choice("foo");
    expect( choice.name ).to.equal("foo");
    expect( choice.value ).to.equal("foo");
  });

  it("should use value|name as default if default property is missing", function() {
    var onlyName = new Choice({ name : "foo" });
    var onlyVal = new Choice({ value : "bar" });

    expect( onlyName.name ).to.equal("foo");
    expect( onlyName.value ).to.equal("foo");
    expect( onlyVal.name ).to.equal("bar");
    expect( onlyVal.value ).to.equal("bar");
  });

  it("should keep extra keys", function() {
    var choice = new Choice({ name: "foo", extra: "1" });

    expect( choice.extra ).to.equal("1");
    expect( choice.name ).to.equal("foo");
    expect( choice.value ).to.equal("foo");
  });

  it("shouldn't process Separator object", function() {
    var sep = new Choice( new Separator() );
    expect( sep ).to.be.instanceOf( Separator );
  });

});
