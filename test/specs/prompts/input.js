var expect = require("chai").expect;
var sinon = require("sinon");
var _ = require("lodash");
var ReadlineStub = require("../../helpers/readline");
var fixtures = require("../../helpers/fixtures");

var Input = require("../../../lib/prompts/input");


describe("`input` prompt", function() {

  beforeEach(function() {
    var self = this;
    this.output = "";

    this._write = Input.prototype.write;
    Input.prototype.write = function( str ) {
      self.output += str;
      return this;
    };

    this.fixture = _.clone( fixtures.input );
    this.rl = new ReadlineStub();
  });

  afterEach(function() {
    Input.prototype.write = this._write;
  });

  it("should use raw value from the user", function( done ) {

    var input = new Input( this.fixture, this.rl );

    input.run(function( answer ) {
      expect(answer).to.equal("Inquirer");
      done();
    });

    this.rl.emit( "line", "Inquirer" );
  });

  it("should not output filtered value", function( done ) {
    this.fixture.filter = function() {
      return "pass";
    };

    var prompt = new Input( this.fixture, this.rl );
    prompt.run(function( answer ) {
      expect(this.output).not.to.contain("pass");
      done();
    }.bind(this));

    this.rl.emit("line", "");
  });

  it("should filter the answer", function(done){
    this.fixture.filter = function() {
      return "pass";
    };

    var prompt = new Input( this.fixture, this.rl );
    prompt.run(function( answer ) {
      expect(answer).to.equal("pass");
      done();
    }.bind(this));

    this.rl.emit("line", "");
  });

  it("should not execute filter function more than once", function(done){
    var counter = 0;

    this.fixture.filter = function() {
      ++ counter;
      return "pass";
    };

    var prompt = new Input( this.fixture, this.rl );
    prompt.run(function( answer ) {
      expect(counter).to.equal(1);
      done();
    }.bind(this));

    this.rl.emit("line", "");
  });
});
