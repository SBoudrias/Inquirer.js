var expect = require("chai").expect;
var sinon = require("sinon");
var _ = require("lodash");
var ReadlineStub = require("../../helpers/readline");
var fixtures = require("../../helpers/fixtures");

var Autocomplete = require("../../../lib/prompts/autocomplete");


describe.only("`autocomplete` prompt", function() {
  var rl;

  beforeEach(function() {
    this.fixture = _.clone( fixtures.autocomplete );
    rl = new ReadlineStub();
    this.autocomplete = new Autocomplete( this.fixture, rl );
  });

  it("should default to first choice", function( done ) {

    this.autocomplete.run(function( answer ) {
      expect(answer).to.equal("foo");
      done();
    });

    this.autocomplete.currentPromise.then(function() {
      rl.emit("line");
    });
  });

  it("should move selected cursor on keypress", function( done ) {

    this.autocomplete.run(function( answer ) {
      expect(answer).to.equal("bar");
      done();
    });

    this.autocomplete.currentPromise.then(function() {
      rl.emit("keypress", "", { name : "down" });
      rl.emit("line");
    });
  });

  it("should allow for arrow navigation", function( done ) {

    this.autocomplete.run(function( answer ) {
      expect(answer).to.equal("bar");
      done();
    });

    this.autocomplete.currentPromise.then(function() {
      rl.emit("keypress", "", { name : "down" });
      rl.emit("keypress", "", { name : "down" });
      rl.emit("keypress", "", { name : "up" });
      rl.emit("line");
    });
  });

  it("should loop the choices when going out of boundaries", function( done ) {
    var i = 0;
    function complete() {
      i++;
      if (i === 2) {
        done();
      }
    }

    this.autocomplete.run(function( answer ) {
      expect(answer).to.equal("bar");
      complete();
    });

    this.autocomplete.currentPromise.then(function() {
     rl.emit("keypress", "", { name : "up" });
     rl.emit("keypress", "", { name : "up" });
     rl.emit("line");
    });


    this.autocomplete.selected = 0; //reset
    this.autocomplete.run(function( answer ) {
      expect(answer).to.equal("foo");
      complete();
    });

    this.autocomplete.currentPromise.then(function() {
      rl.emit("keypress", "", { name : "down" });
      rl.emit("keypress", "", { name : "down" });
      rl.emit("keypress", "", { name : "down" });
      rl.emit("line");
    });

  });

  it("should search when typing", function () {
    sinon.spy(this.fixture, 'choices');

this.autocomplete.currentPromise
    rl.emit("keypress", "a", { name : "a" });
    console.log('after');
    sinon.assert.calledOnce(this.fixture.choices);

  });

  it("should require a choices array", function() {
    var mkPrompt = function() {
      new Autocomplete({ name : "foo", message: "bar" });
    };
    expect(mkPrompt).to.throw(/choices/);
  });

});
