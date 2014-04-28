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

  it("should output filtered value", function( done ) {
    this.fixture.filter = function() {
      return "pass";
    };

    var prompt = new Input( this.fixture, this.rl );
    prompt.run(function( answer ) {
      expect(this.output).to.contain("pass");
      done();
    }.bind(this));

    this.rl.emit("line", "");
  });

});
