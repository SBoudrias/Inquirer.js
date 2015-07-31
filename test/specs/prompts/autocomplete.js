var expect = require("chai").expect;
var sinon = require("sinon");
var _ = require("lodash");
var ReadlineStub = require("../../helpers/readline");
var fixtures = require("../../helpers/fixtures");

var Autocomplete = require("../../../lib/prompts/autocomplete");


describe("`autocomplete` prompt", function() {
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

  it("should require a choices array", function() {
    var mkPrompt = function() {
      new Autocomplete({ name : "foo", message: "bar" });
    };
    expect(mkPrompt).to.throw(/choices/);
  });

  describe("search", function () {
    var search;
    beforeEach(function () {
      search = sinon.spy(this.autocomplete.opt, 'choices');
    });

    it("should search once initially with no params", function () {
      this.autocomplete.run();
      sinon.assert.calledOnce(this.autocomplete.opt.choices);
      sinon.assert.calledWithExactly(this.autocomplete.opt.choices);
    });

    it("should search when user types", function () {
      this.autocomplete.run();

      rl.line = "a";
      rl.emit("keypress", "a", {name : "a"});

      rl.line = "ab";
      rl.emit("keypress", "b", {name : "b"});

      sinon.assert.calledThrice(search);
      sinon.assert.calledWithExactly(search, 'a');
      sinon.assert.calledWithExactly(search, 'ab');
    });

    it("should not search if last search was the same", function () {
      this.autocomplete.run();

      rl.line = "a";
      rl.emit("keypress", "a", {name : "a"});

      rl.emit("keypress", "", {name : "down"});
      rl.emit("keypress", "", {name : "escape"});
      rl.emit("keypress", "", {name : "up"});
      rl.line = "ab";
      rl.emit("keypress", "b", {name : "b"});
      rl.emit("keypress", "", {name : "tab"});

      sinon.assert.calledThrice(search);
      sinon.assert.calledWithExactly(search, 'a');
      sinon.assert.calledWithExactly(search, 'ab');
    });
  });


});
