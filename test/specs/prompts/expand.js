var expect = require("chai").expect;
var sinon = require("sinon");
var _ = require("lodash");
var ReadlineStub = require("../../helpers/readline");
var fixtures = require("../../helpers/fixtures");

var Expand = require("../../../lib/prompts/expand");


describe("`expand` prompt", function() {

  beforeEach(function() {
    var self = this;
    this.output = "";

    this._write = Expand.prototype.write;
    Expand.prototype.write = function( str ) {
      self.output += str;
      return this;
    };

    this.fixture = _.clone( fixtures.expand );
    this.rl = new ReadlineStub();
    this.expand = new Expand( this.fixture, this.rl );
  });

  afterEach(function() {
    Expand.prototype.write = this._write;
  });

  it("should throw if `key` is missing", function() {
    var mkPrompt = function() {
      this.fixture.choices = [ "a", "a" ];
      return new Expand( this.fixture, this.rl );
    }.bind(this);

    expect(mkPrompt).to.throw(/Format error/);
  });

  it("should throw if `key` is duplicate", function() {
    var mkPrompt = function() {
      this.fixture.choices = [
        { key: "a", name: "foo" },
        { key: "a", name: "foo" }
      ];
      return new Expand( this.fixture, this.rl );
    }.bind(this);

    expect(mkPrompt).to.throw(/Duplicate\ key\ error/);
  });

  it("should throw if `key` is `h`", function() {
    var mkPrompt = function() {
      this.fixture.choices = [
        { key: "h", name: "foo" }
      ];
      return new Expand( this.fixture, this.rl );
    }.bind(this);

    expect(mkPrompt).to.throw(/Reserved\ key\ error/);
  });

  it("should take the first choice by default", function( done ) {
    this.expand.run(function( answer ) {
      expect(answer).to.equal("acab");
      done();
    });
    this.rl.emit("line");
  });

  it("should use the `default` argument value", function( done ) {
    this.fixture.default = 1;
    this.expand = new Expand( this.fixture, this.rl );

    this.expand.run(function( answer ) {
      expect(answer).to.equal("bar");
      done();
    });
    this.rl.emit("line");
  });

  it("should return the user input", function( done ) {
    this.expand.run(function( answer ) {
      expect(answer).to.equal("bar");
      done();
    });
    this.rl.emit("line", "b");
  });

  it("should have help option", function( done ) {
    var run = 0;
    this.expand.run(function( answer ) {
      expect(this.output).to.match(/a\)\ acab/);
      expect(this.output).to.match(/b\)\ bar/);
      expect(answer).to.equal("chile");
      done();
    }.bind(this));
    this.rl.emit("line", "h");
    this.rl.emit("line", "c");
  });

  it("should not allow invalid command", function( done ) {
    var self = this;
    var callCount = 0;

    this.expand.run(function( answer ) {
      callCount++;
    });

    this.rl.emit( "line", "blah" );
    setTimeout(function() {
      self.rl.emit( "line", "a" );
      setTimeout(function() {
          expect(callCount).to.equal(1);
          done();
      }, 10 );
    }, 10 );
  });

  it("should display and capitalize the default choice `key`", function() {
    this.fixture.default = 1;
    this.expand = new Expand( this.fixture, this.rl );

    this.expand.run(function() {});
    expect(this.output).to.contain("(aBch)");
  });

  it("should 'autocomplete' the user input", function() {
    this.expand = new Expand( this.fixture, this.rl );
    this.expand.run(function() {});
    this.rl.line = "a";
    this.rl.emit("keypress");
    setTimeout(function() {
      expect(this.output).to.contain("acab");
    }.bind(this), 10);
  });

});
